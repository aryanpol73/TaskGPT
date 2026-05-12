import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Search, Mail, Phone, X } from 'lucide-react';
import { useContacts, useCreateContact, type GoogleContact } from '@/hooks/useGoogleApi';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick?: (contact: GoogleContact, email: string) => void;
}

const ContactsDialog: React.FC<Props> = ({ open, onOpenChange, onPick }) => {
  const [search, setSearch] = useState('');
  const { data: contacts = [], isLoading, error, refetch } = useContacts(open, search);
  const createContact = useCreateContact();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.emails.some(e => e.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Name required');
    try {
      await createContact.mutateAsync({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      toast.success('Contact saved to Google');
      setNewName(''); setNewEmail(''); setNewPhone('');
      setShowAdd(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create contact');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10 bg-secondary/50"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">
            Couldn't load contacts. You may need to reconnect Google in Settings → Integrations to grant Contacts access.
          </p>
        )}

        <div className="max-h-[320px] overflow-y-auto space-y-1 -mx-2 px-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No contacts found</p>
          ) : (
            filtered.map(c => (
              <div key={c.resourceName} className="glass p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {c.photo ? (
                    <img src={c.photo} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.emails[0] && <p className="text-xs text-muted-foreground truncate">{c.emails[0]}</p>}
                  </div>
                </div>
                {onPick && c.emails.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {c.emails.map(em => (
                      <Button
                        key={em}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => { onPick(c, em); onOpenChange(false); }}
                      >
                        <Mail className="w-3 h-3 mr-1" />{em}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {showAdd ? (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">New contact</p>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Phone (optional)" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="bg-secondary/50" />
            <Button variant="ai" className="w-full" onClick={handleCreate} disabled={createContact.isPending}>
              {createContact.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Save to Google
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAdd(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Add new contact
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactsDialog;
