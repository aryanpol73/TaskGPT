import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useFamilyMembers } from '@/hooks/useVault';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const FamilyDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { members, invite, remove, loading } = useFamilyMembers();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await invite(email);
      toast.success('Invite sent');
      setEmail('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to invite');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Family Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              placeholder="family@example.com"
              type="email"
              className="bg-secondary/50 border-border"
            />
            <Button variant="ai" onClick={handleInvite} disabled={busy}>Invite</Button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No family members yet.</p>
            ) : members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{m.member_email}</span>
                  <Badge variant={m.status === 'accepted' ? 'default' : 'outline'} className="text-[10px]">
                    {m.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Invited family members can view documents you mark as "Shared with family". When they sign up to TaskGPT with this email, access is granted automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyDialog;
