
-- =====================================
-- VAULT FEATURE: tables, RLS, storage
-- =====================================

-- 1. documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,           -- storage path inside the 'vault' bucket
  file_type TEXT,                   -- mime type
  file_size BIGINT,                 -- bytes
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'upload',  -- 'upload' | 'google_drive'
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. document_access table (explicit per-document grants)
CREATE TABLE public.document_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view',  -- 'view'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

CREATE INDEX idx_document_access_user_id ON public.document_access(user_id);
CREATE INDEX idx_document_access_document_id ON public.document_access(document_id);

ALTER TABLE public.document_access ENABLE ROW LEVEL SECURITY;

-- 3. family_members table (invites)
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  member_user_id UUID,                          -- filled when invitee signs up
  status TEXT NOT NULL DEFAULT 'pending',       -- 'pending' | 'accepted'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(owner_id, member_email)
);

CREATE INDEX idx_family_members_owner_id ON public.family_members(owner_id);
CREATE INDEX idx_family_members_member_email ON public.family_members(member_email);
CREATE INDEX idx_family_members_member_user_id ON public.family_members(member_user_id);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- =====================================
-- Helper function: check if user has access to a document
-- (owner OR explicit document_access OR shared+family member)
-- =====================================
CREATE OR REPLACE FUNCTION public.user_can_access_document(_document_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
      AND (
        d.user_id = _user_id
        OR EXISTS (SELECT 1 FROM public.document_access da WHERE da.document_id = d.id AND da.user_id = _user_id)
        OR (
          d.is_shared = true
          AND EXISTS (
            SELECT 1 FROM public.family_members fm
            WHERE fm.owner_id = d.user_id
              AND fm.member_user_id = _user_id
              AND fm.status = 'accepted'
          )
        )
      )
  );
$$;

-- =====================================
-- RLS POLICIES
-- =====================================

-- documents
CREATE POLICY "Users can view own and shared documents"
  ON public.documents FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.document_access da WHERE da.document_id = id AND da.user_id = auth.uid())
    OR (
      is_shared = true
      AND EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.owner_id = documents.user_id
          AND fm.member_user_id = auth.uid()
          AND fm.status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- document_access
CREATE POLICY "Owners and grantees can view access rows"
  ON public.document_access FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Owners can insert access rows"
  ON public.document_access FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

CREATE POLICY "Owners can delete access rows"
  ON public.document_access FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.user_id = auth.uid())
  );

-- family_members
CREATE POLICY "Owners can view their invites"
  ON public.family_members FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = member_user_id);

CREATE POLICY "Owners can create invites"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their invites"
  ON public.family_members FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update their invites"
  ON public.family_members FOR UPDATE
  USING (auth.uid() = owner_id);

-- =====================================
-- Auto-link new signups to pending family invites
-- =====================================
CREATE OR REPLACE FUNCTION public.link_pending_family_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.family_members
  SET member_user_id = NEW.id,
      status = 'accepted',
      accepted_at = now()
  WHERE LOWER(member_email) = LOWER(NEW.email)
    AND member_user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link_invites ON auth.users;
CREATE TRIGGER on_auth_user_created_link_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_family_invites();

-- =====================================
-- Storage bucket for vault files (private)
-- =====================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault', 'vault', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies — files stored under {user_id}/{filename}
CREATE POLICY "Vault: users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vault: users can view files they have document access to"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.file_url = storage.objects.name
          AND public.user_can_access_document(d.id, auth.uid())
      )
    )
  );

CREATE POLICY "Vault: users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vault'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
