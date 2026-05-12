import { useCallback, useEffect, useRef, useState } from 'react';

type SR = any;

declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

export interface VoiceOptions {
  onResult?: (text: string, isFinal: boolean) => void;
  onEnd?: (finalText: string) => void;
  lang?: string;
  continuous?: boolean;
}

export function useVoiceInput({ onResult, onEnd, lang = 'en-US', continuous = false }: VoiceOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recRef = useRef<any>(null);
  const finalRef = useRef('');

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error('Speech recognition not supported in this browser');

    // Request mic permission explicitly
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error('Microphone permission denied');
    }

    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = continuous;
    finalRef.current = '';
    setTranscript('');

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      const full = (finalRef.current + interim).trim();
      setTranscript(full);
      onResult?.(full, !interim);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      onEnd?.(finalRef.current.trim());
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang, continuous, onResult, onEnd]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { supported, listening, transcript, start, stop };
}

export function speak(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1;
  window.speechSynthesis.speak(u);
}
