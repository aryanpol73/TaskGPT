import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  loading: boolean;
  result: string | null;
}

const AiResultDialog: React.FC<Props> = ({ open, onClose, title, loading, result }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="glass-strong border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-[200px] max-h-[60vh] overflow-y-auto p-4 rounded-xl bg-secondary/30 border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing document…</p>
              </div>
            </div>
          ) : result ? (
            <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {result}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No result.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiResultDialog;
