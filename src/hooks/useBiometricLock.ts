import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_PREFIX = 'vault_biometric_';
const UNLOCK_PREFIX = 'vault_unlocked_';
const UNLOCK_TTL_MS = 5 * 60 * 1000; // re-lock after 5 minutes

const b64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (str: string) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

export function useBiometricLock() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const credKey = user ? `${STORAGE_PREFIX}${user.id}` : '';
  const unlockKey = user ? `${UNLOCK_PREFIX}${user.id}` : '';

  useEffect(() => {
    let active = true;
    (async () => {
      const hasApi =
        typeof window !== 'undefined' &&
        !!window.PublicKeyCredential &&
        !!navigator.credentials;
      let isPlatform = false;
      if (hasApi) {
        try {
          isPlatform =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
          isPlatform = false;
        }
      }
      if (!active) return;
      setSupported(hasApi && isPlatform);

      if (user) {
        const stored = localStorage.getItem(credKey);
        setEnrolled(!!stored);
        const ts = Number(sessionStorage.getItem(unlockKey) || 0);
        setUnlocked(!!ts && Date.now() - ts < UNLOCK_TTL_MS);
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [user, credKey, unlockKey]);

  const enroll = useCallback(async () => {
    if (!user) throw new Error('Not signed in');
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(user.id);
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'TaskPilot Vault', id: window.location.hostname },
        user: {
          id: userId,
          name: user.email || user.id,
          displayName: user.email || 'Vault User',
        },
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
    setEnrolled(true);
    setUnlocked(true);
  }, [user, credKey, unlockKey]);

  const unlock = useCallback(async () => {
    if (!user) throw new Error('Not signed in');
    const stored = localStorage.getItem(credKey);
    if (!stored) throw new Error('Not enrolled');
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: [
          { id: fromB64(stored), type: 'public-key' },
        ],
        rpId: window.location.hostname,
      },
    });
    if (!assertion) throw new Error('Unlock failed');
    sessionStorage.setItem(unlockKey, String(Date.now()));
    setUnlocked(true);
  }, [user, credKey, unlockKey]);

  const lock = useCallback(() => {
    sessionStorage.removeItem(unlockKey);
    setUnlocked(false);
  }, [unlockKey]);

  const disable = useCallback(() => {
    localStorage.removeItem(credKey);
    sessionStorage.removeItem(unlockKey);
    setEnrolled(false);
    setUnlocked(false);
  }, [credKey, unlockKey]);

  return { supported, enrolled, unlocked, checking, enroll, unlock, lock, disable };
}
