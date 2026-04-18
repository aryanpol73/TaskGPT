import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Upload as UploadIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useVault, MAX_FILE_SIZE, ALLOWED_TYPES } from '@/hooks/useVault';

const PRESET_TAGS = ['Important', 'Personal', 'Shared', 'Work', 'Finance', 'Medical'];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const UploadDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { uploadDocument } = useVault();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null); setTitle(''); setTags([]); setTagInput(''); setIsShared(false);
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File too large (max 25MB)');
      return;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('Unsupported file type');
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const addCustomTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const submit = async () => {
    if (!file) { toast.error('Choose a file first'); return; }
    setBusy(true);
    try {
      await uploadDocument(file, { title: title.trim() || file.name, tags, isShared });
      toast.success('Uploaded to Vault');
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload to Vault</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker */}
          <label className="block">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm truncate max-w-[220px]">{file.name}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Click to choose PDF, image, or document</p>
                  <p className="text-xs mt-1">Max 25MB</p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0] || null)}
              />
            </div>
          </label>

          <div>
            <Label className="text-muted-foreground text-sm">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="bg-secondary/50 border-border mt-1"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Tags</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PRESET_TAGS.map(t => (
                <Badge
                  key={t}
                  variant={tags.includes(t) ? 'default' : 'outline'}
                  className={`cursor-pointer ${tags.includes(t) ? 'gradient-primary text-primary-foreground border-0' : ''}`}
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                placeholder="Add custom tag"
                className="bg-secondary/50 border-border h-9 text-sm"
              />
              <Button size="sm" variant="outline" onClick={addCustomTag}>Add</Button>
            </div>
            {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTag(t)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Share with family</p>
              <p className="text-xs text-muted-foreground">Family members get read-only access</p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="ai" className="flex-1" onClick={submit} disabled={busy || !file}>
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
