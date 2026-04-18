import React from 'react';
import { FileText, Image as ImageIcon, FileType, MoreVertical, Eye, Sparkles, Trash2, Users, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { VaultDocument } from '@/hooks/useVault';

interface Props {
  doc: VaultDocument;
  isOwner: boolean;
  onPreview: () => void;
  onAi: (action: 'summarize' | 'extract') => void;
  onDelete: () => void;
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getIcon = (type: string | null) => {
  if (!type) return FileText;
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf') return FileType;
  return FileText;
};

const DocumentCard: React.FC<Props> = ({ doc, isOwner, onPreview, onAi, onDelete }) => {
  const Icon = getIcon(doc.file_type);
  const date = new Date(doc.created_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="glass p-4 rounded-2xl hover:border-primary/40 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 ai-glow">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate" title={doc.title}>{doc.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-1 opacity-60 hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-border">
                <DropdownMenuItem onClick={onPreview}>
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAi('summarize')}>
                  <Sparkles className="w-4 h-4 mr-2" /> Summarize
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAi('extract')}>
                  <Sparkles className="w-4 h-4 mr-2" /> Extract key info
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{date}</span>
            {doc.file_size ? <><span>•</span><span>{formatBytes(doc.file_size)}</span></> : null}
            {doc.is_shared ? (
              <><span>•</span><Users className="w-3 h-3" /></>
            ) : (
              <><span>•</span><Lock className="w-3 h-3" /></>
            )}
          </div>

          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {doc.tags.slice(0, 4).map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] py-0 h-5">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={onPreview}>
          <Eye className="w-3.5 h-3.5 mr-1" /> Preview
        </Button>
        <Button variant="ai" size="sm" className="flex-1 h-8" onClick={() => onAi('summarize')}>
          <Sparkles className="w-3.5 h-3.5 mr-1" /> AI
        </Button>
      </div>
    </div>
  );
};

export default DocumentCard;
