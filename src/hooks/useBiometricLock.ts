import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CRED_PREFIX = 'vault_biometric_';
const PIN_PREFIX = 'vault_pin_';
const UNLOCK_PREFIX = 'vault_unlocked_';
const UNLOCK_TTL_MS = 5 * 60 * 1000;

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (str: string) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64(hash);
}

export function useBiometricLock() {
  const { user } = useAuth();
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const credKey = user ? `${CRED_PREFIX}${user.id}` : '';
  const pinKey = user ? `${PIN_PREFIX}${user.id}` : '';
  const unlockKey = user ? `${UNLOCK_PREFIX}${user.id}` : '';

  useEffect(() => {
    let active = true;
    (async () => {
      const hasApi =
        typeof window !== 'undefined' &&
        !!window.PublicKeyCredential &&
        !!navigator.credentials &&
        window.isSecureContext;
      let isPlatform = false;
      if (hasApi) {
        try {
          isPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          isPlatform = false;
        }
      }
      if (!active) return;
      setBioSupported(hasApi && isPlatform);

      if (user) {
        setBioEnrolled(!!localStorage.getItem(credKey));
        setPinSet(!!localStorage.getItem(pinKey));
        const ts = Number(sessionStorage.getItem(unlockKey) || 0);
        setUnlocked(!!ts && Date.now() - ts < UNLOCK_TTL_MS);
      }
      setChecking(false);
    })();
    return () => { active = false; };
  }, [user, credKey, pinKey, unlockKey]);

  const enrollBiometric = useCallback(async () => {
    if (!user) throw new Error('Not signed in');
    if (!bioSupported) throw new Error('Biometric not available on this device/browser');
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(user.id);
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'TaskPilot Vault', id: window.location.hostname },
        user: { id: userId, name: user.email || user.id, displayName: user.email || 'Vault' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) throw new Error('Enrollment cancelled');
    localStorage.setItem(credKey, b64(cred.rawId));
    sessionStorage.setItem(unlockKey, String(Date.now()));
    setBioEnrolled(true);
    setUnlocked(true);
  }, [user, credKey, unlockKey, bioSupported]);

  const unlockBiometric = useCallback(async () => {
    if (!user) throw new Error('Not signed in');
    const stored = localStorage.getItem(credKey);
    if (!stored) throw new Error('Biometric not enrolled');
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [{ id: fromB64(stored), type: 'public-key' }],
        rpId: window.location.hostname,
      },
    });
    if (!assertion) throw new Error('Verification failed');
    sessionStorage.setItem(unlockKey, String(Date.now()));
    setUnlocked(true);
  }, [user, credKey, unlockKey]);

  const setPin = useCallback(async (pin: string) => {
    if (!user) throw new Error('Not signed in');
    if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN must be 4-8 digits');
    const hash = await sha256(`${user.id}:${pin}`);
    localStorage.setItem(pinKey, hash);
    sessionStorage.setItem(unlockKey, String(Date.now()));
    setPinSet(true);
    setUnlocked(true);
  }, [user, pinKey, unlockKey]);

  const unlockPin = useCallback(async (pin: string) => {
    if (!user) throw new Error('Not signed in');
    const stored = localStorage.getItem(pinKey);
    if (!stored) throw new Error('No PIN set');
    const hash = await sha256(`${user.id}:${pin}`);
    if (hash !== stored) throw new Error('Incorrect PIN');
    sessionStorage.setItem(unlockKey, String(Date.now()));
    setUnlocked(true);
  }, [user, pinKey, unlockKey]);

  const lock = useCallback(() => {
    sessionStorage.removeItem(unlockKey);
    setUnlocked(false);
  }, [unlockKey]);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem(credKey);
    setBioEnrolled(false);
  }, [credKey]);

  const removePin = useCallback(() => {
    localStorage.removeItem(pinKey);
    setPinSet(false);
  }, [pinKey]);

  return {
    bioSupported,
    bioEnrolled,
    pinSet,
    unlocked,
    checking,
    enrollBiometric,
    unlockBiometric,
    setPin,
    unlockPin,
    lock,
    disableBiometric,
    removePin,
    // legacy compat
    supported: bioSupported,
    enrolled: bioEnrolled || pinSet,
    enroll: enrollBiometric,
    unlock: unlockBiometric,
    disable: () => { localStorage.removeItem(credKey); localStorage.removeItem(pinKey); setBioEnrolled(false); setPinSet(false); },
  };
}
