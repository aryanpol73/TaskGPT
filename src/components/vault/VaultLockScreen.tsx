import React, { useEffect, useState } from 'react';
import { Fingerprint, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useBiometricLock } from '@/hooks/useBiometricLock';

interface Props {
  bio: ReturnType<typeof useBiometricLock>;
}

const VaultLockScreen: React.FC<Props> = ({ bio }) => {
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [mode, setMode] = useState<'bio' | 'pin'>(bio.bioSupported && bio.bioEnrolled ? 'bio' : 'pin');

  const handleBio = async () => {
    setBusy(true);
    try {
      if (bio.bioEnrolled) await bio.unlockBiometric();
      else await bio.enrollBiometric();
      toast.success('Vault unlocked');
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
      // If biometric fails, fall back to PIN
      setMode('pin');
    } finally {
      setBusy(false);
    }
  };

  const handlePin = async () => {
    setBusy(true);
    try {
      if (bio.pinSet) {
        await bio.unlockPin(pin);
        toast.success('Vault unlocked');
      } else {
        if (pin !== pin2) throw new Error('PINs do not match');
        await bio.setPin(pin);
        toast.success('PIN set — vault unlocked');
      }
      setPin(''); setPin2('');
    } catch (e: any) {
      toast.error(e?.message || 'Incorrect PIN');
    } finally {
      setBusy(false);
    }
  };

  // Auto-prompt biometric on mount if enrolled
  useEffect(() => {
    if (mode === 'bio' && bio.bioSupported && bio.bioEnrolled) {
      handleBio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsSetup = !bio.bioEnrolled && !bio.pinSet;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center ai-glow">
          {mode === 'bio' ? (
            <Fingerprint className="w-8 h-8 text-primary-foreground" />
          ) : (
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
          {needsSetup ? 'Secure your vault' : 'Vault is locked'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {needsSetup
            ? 'Set up biometric unlock or a PIN to protect your documents.'
            : mode === 'bio'
            ? 'Use your fingerprint, Face ID, or device PIN.'
            : bio.pinSet ? 'Enter your PIN to unlock.' : 'Set a 4-8 digit PIN.'}
        </p>

        {mode === 'bio' ? (
          <div className="space-y-3">
            <Button variant="ai" className="w-full" disabled={busy} onClick={handleBio}>
              <Fingerprint className="w-4 h-4 mr-1" />
              {busy ? 'Verifying…' : bio.bioEnrolled ? 'Unlock with biometric' : 'Enable biometric'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setMode('pin')}>
              <KeyRound className="w-4 h-4 mr-1" /> Use PIN instead
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={8}
              placeholder={bio.pinSet ? 'Enter PIN' : 'New PIN (4-8 digits)'}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && bio.pinSet && handlePin()}
              className="bg-secondary/50 text-center tracking-widest text-lg"
            />
            {!bio.pinSet && (
              <Input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="Confirm PIN"
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handlePin()}
                className="bg-secondary/50 text-center tracking-widest text-lg"
              />
            )}
            <Button variant="ai" className="w-full" disabled={busy || pin.length < 4} onClick={handlePin}>
              <ShieldCheck className="w-4 h-4 mr-1" />
              {busy ? 'Working…' : bio.pinSet ? 'Unlock' : 'Set PIN & Unlock'}
            </Button>
            {bio.bioSupported && bio.bioEnrolled && (
              <Button variant="outline" className="w-full" onClick={() => setMode('bio')}>
                <Fingerprint className="w-4 h-4 mr-1" /> Use biometric
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultLockScreen;
