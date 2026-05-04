import React, { useEffect, useState } from 'react';
import { Fingerprint, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  supported: boolean;
  enrolled: boolean;
  onEnroll: () => Promise<void>;
  onUnlock: () => Promise<void>;
  onSkip?: () => void;
}

const VaultLockScreen: React.FC<Props> = ({ supported, enrolled, onEnroll, onUnlock, onSkip }) => {
  const [busy, setBusy] = useState(false);

  const handle = async (fn: () => Promise<void>, errMsg: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      toast.error(e?.message || errMsg);
    } finally {
      setBusy(false);
    }
  };

  // Auto-prompt on mount when already enrolled
  useEffect(() => {
    if (supported && enrolled) {
      handle(onUnlock, 'Unlock failed');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center ai-glow">
          {supported ? (
            <Fingerprint className="w-8 h-8 text-primary-foreground" />
          ) : (
            <ShieldAlert className="w-8 h-8 text-primary-foreground" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Vault is locked</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {!supported
            ? 'Biometric authentication isn\'t available on this device. You can continue without it.'
            : enrolled
            ? 'Use your fingerprint, Face ID, or device PIN to unlock the vault.'
            : 'Set up biometric unlock (fingerprint, Face ID, or device PIN) to keep your documents private.'}
        </p>

        {supported ? (
          enrolled ? (
            <Button
              variant="ai"
              className="w-full"
              disabled={busy}
              onClick={() => handle(onUnlock, 'Unlock failed')}
            >
              <Fingerprint className="w-4 h-4 mr-1" />
              {busy ? 'Verifying…' : 'Unlock Vault'}
            </Button>
          ) : (
            <Button
              variant="ai"
              className="w-full"
              disabled={busy}
              onClick={() => handle(onEnroll, 'Enrollment failed')}
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              {busy ? 'Setting up…' : 'Enable Biometric Unlock'}
            </Button>
          )
        ) : (
          onSkip && (
            <Button variant="outline" className="w-full" onClick={onSkip}>
              Continue without biometrics
            </Button>
          )
        )}

        {supported && !enrolled && onSkip && (
          <button
            className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
            onClick={onSkip}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
};

export default VaultLockScreen;
