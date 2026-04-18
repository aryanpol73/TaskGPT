import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useVault, type VaultDocument } from '@/hooks/useVault';

interface Props {
  doc: VaultDocument | null;
  onClose: () => void;
}

const PreviewDialog: React.FC<Props> = ({ doc, onClose }) => {
  const { getSignedUrl } = useVault();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc) { setUrl(null); return; }
    setLoading(true);
    getSignedUrl(doc.file_url, 3600)
      .then(setUrl)
      .catch(() => setUrl(null))
      .finally(() => setLoading(false));
  }, [doc]);

  if (!doc) return null;
  const isImage = doc.file_type?.startsWith('image/');
  const isPdf = doc.file_type === 'application/pdf';

  return (
    <Dialog open={!!doc} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="glass-strong border-border max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center justify-between gap-2">
            <span className="truncate">{doc.title}</span>
            {url && (
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Open
                </a>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-xl bg-background/50 border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !url ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Unable to load preview
            </div>
          ) : isImage ? (
            <div className="h-full overflow-auto flex items-center justify-center p-4">
              <img src={url} alt={doc.title} className="max-w-full max-h-full object-contain" />
            </div>
          ) : isPdf ? (
            <iframe src={url} title={doc.title} className="w-full h-full" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <p>Preview not available for this file type</p>
              <Button variant="outline" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDialog;
