import React, { useMemo, useState } from 'react';
import { Search, Upload, Users, Cloud, FolderOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useVault, type VaultDocument } from '@/hooks/useVault';
import { supabase } from '@/integrations/supabase/client';
import UploadDialog from '@/components/vault/UploadDialog';
import DocumentCard from '@/components/vault/DocumentCard';
import PreviewDialog from '@/components/vault/PreviewDialog';
import AiResultDialog from '@/components/vault/AiResultDialog';
import FamilyDialog from '@/components/vault/FamilyDialog';

const VaultPage: React.FC = () => {
  const { user } = useAuth();
  const { documents, loading, deleteDocument } = useVault();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => d.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (activeTag && !d.tags.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) &&
            !d.tags.some(t => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [documents, search, activeTag]);

  const runAi = async (doc: VaultDocument, action: 'summarize' | 'extract') => {
    setAiTitle(action === 'summarize' ? `Summary: ${doc.title}` : `Key info: ${doc.title}`);
    setAiOpen(true);
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('vault-ai', {
        body: { document_id: doc.id, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.result);
    } catch (e: any) {
      setAiResult(null);
      toast.error(e.message || 'AI request failed');
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (doc: VaultDocument) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    try {
      await deleteDocument(doc);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const driveStub = (which: 'import' | 'backup') => {
    toast.info(which === 'import'
      ? 'Google Drive import coming soon'
      : 'Drive backup coming soon');
  };

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center ai-glow">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
            Vault
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Secure, AI-powered document storage</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setFamilyOpen(true)}>
            <Users className="w-4 h-4 mr-1" /> Family
          </Button>
          <Button variant="outline" size="sm" onClick={() => driveStub('import')}>
            <FolderOpen className="w-4 h-4 mr-1" /> Import from Drive
          </Button>
          <Button variant="outline" size="sm" onClick={() => driveStub('backup')}>
            <Cloud className="w-4 h-4 mr-1" /> Backup to Drive
          </Button>
          <Button variant="ai" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents and tags…"
          className="pl-10 bg-secondary/50 border-border h-11"
        />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto">
          <Badge
            variant={activeTag === null ? 'default' : 'outline'}
            className={`cursor-pointer ${activeTag === null ? 'gradient-primary text-primary-foreground border-0' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </Badge>
          {allTags.map(t => (
            <Badge
              key={t}
              variant={activeTag === t ? 'default' : 'outline'}
              className={`cursor-pointer ${activeTag === t ? 'gradient-primary text-primary-foreground border-0' : ''}`}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Documents */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading vault…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-4 flex items-center justify-center ai-glow">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {documents.length === 0 ? 'Your vault is empty' : 'No matching documents'}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {documents.length === 0
              ? 'Upload your first document to get started.'
              : 'Try a different search or tag.'}
          </p>
          {documents.length === 0 && (
            <Button variant="ai" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Upload document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isOwner={doc.user_id === user?.id}
              onPreview={() => setPreviewDoc(doc)}
              onAi={(action) => runAi(doc, action)}
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </div>
      )}

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <FamilyDialog open={familyOpen} onOpenChange={setFamilyOpen} />
      <PreviewDialog doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <AiResultDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={aiTitle}
        loading={aiLoading}
        result={aiResult}
      />
    </div>
  );
};

export default VaultPage;
