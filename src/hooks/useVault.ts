import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VaultDocument {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  tags: string[];
  source: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  member_email: string;
  member_user_id: string | null;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

export function useVault() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setDocuments(data as VaultDocument[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const uploadDocument = async (
    file: File,
    opts: { title?: string; tags: string[]; isShared: boolean }
  ) => {
    if (!user) throw new Error('Not authenticated');
    if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 25MB)');
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type');
    }

    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('vault').upload(path, file, { contentType: file.type });
    if (upErr) throw upErr;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: opts.title || file.name,
        file_url: path,
        file_type: file.type,
        file_size: file.size,
        tags: opts.tags,
        is_shared: opts.isShared,
        source: 'upload',
      })
      .select().single();
    if (error) throw error;
    await loadDocuments();
    return data;
  };

  const deleteDocument = async (doc: VaultDocument) => {
    // Try delete file (only owner can)
    if (user?.id === doc.user_id) {
      await supabase.storage.from('vault').remove([doc.file_url]);
    }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) throw error;
    await loadDocuments();
  };

  const updateDocument = async (id: string, updates: Partial<VaultDocument>) => {
    const { error } = await supabase.from('documents').update(updates).eq('id', id);
    if (error) throw error;
    await loadDocuments();
  };

  const getSignedUrl = async (path: string, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from('vault').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documents, loading,
    uploadDocument, deleteDocument, updateDocument,
    getSignedUrl, refresh: loadDocuments,
  };
}

export function useFamilyMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setMembers(data as FamilyMember[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const invite = async (email: string) => {
    if (!user) throw new Error('Not authenticated');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Invalid email');

    // Check if invitee already exists in auth via existing invite or by trying insert
    const { error } = await supabase.from('family_members').insert({
      owner_id: user.id,
      member_email: cleanEmail,
    });
    if (error) {
      if (error.code === '23505') throw new Error('Already invited');
      throw error;
    }
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  return { members, loading, invite, remove, refresh: load };
}
