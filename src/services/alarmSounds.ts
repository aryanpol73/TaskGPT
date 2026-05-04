// Synthesized alarm sounds using Web Audio API — no asset files needed.
// Each sound returns a stop() function.

export type SoundId = 'chime' | 'bell' | 'digital' | 'pulse' | 'arcade' | 'soft';

export const SOUND_OPTIONS: { id: SoundId; label: string; description: string }[] = [
  { id: 'chime',   label: 'Chime',        description: 'Soft 3-tone chime' },
  { id: 'bell',    label: 'Bell',         description: 'Classic bell ring' },
  { id: 'digital', label: 'Digital',      description: 'Modern digital beep' },
  { id: 'pulse',   label: 'Pulse',        description: 'Rhythmic pulse' },
  { id: 'arcade',  label: 'Arcade',       description: 'Retro arcade alert' },
  { id: 'soft',    label: 'Soft',         description: 'Gentle wake tone' },
];

let ctx: AudioContext | null = null;
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

const tone = (
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
) => {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
  return osc;
};

const playPattern = (id: SoundId): number => {
  switch (id) {
    case 'chime':
      tone(880, 0, 0.4); tone(1175, 0.25, 0.4); tone(1568, 0.5, 0.6);
      return 1200;
    case 'bell':
      tone(1318, 0,    1.2, 'triangle', 0.3);
      tone(1976, 0,    1.2, 'sine',     0.15);
      return 1300;
    case 'digital':
      tone(1500, 0, 0.12, 'square', 0.2);
      tone(1500, 0.18, 0.12, 'square', 0.2);
      tone(1800, 0.36, 0.18, 'square', 0.2);
      return 600;
    case 'pulse':
      for (let i = 0; i < 4; i++) tone(880, i * 0.2, 0.12, 'sine', 0.25);
      return 900;
    case 'arcade':
      tone(523, 0, 0.1, 'square'); tone(659, 0.1, 0.1, 'square');
      tone(784, 0.2, 0.1, 'square'); tone(1046, 0.3, 0.25, 'square');
      return 700;
    case 'soft':
      tone(523, 0, 0.6, 'sine', 0.18); tone(659, 0.3, 0.7, 'sine', 0.18);
      return 1000;
  }
};

export const playSound = (id: SoundId) => {
  try { playPattern(id); } catch (e) { console.warn('Audio failed', e); }
};

export const playAlarm = (id: SoundId, durationMs = 15000): (() => void) => {
  let stopped = false;
  const loop = () => {
    if (stopped) return;
    const len = playPattern(id);
    setTimeout(loop, len + 200);
  };
  loop();
  const auto = window.setTimeout(() => { stopped = true; }, durationMs);
  return () => { stopped = true; clearTimeout(auto); };
};
