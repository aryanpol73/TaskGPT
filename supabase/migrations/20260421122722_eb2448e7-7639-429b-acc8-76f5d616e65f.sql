-- Fix infinite recursion in documents SELECT policy
-- The original policy referenced da.document_id = da.id (typo) and caused recursion.
-- Replace with security-definer function that already exists: user_can_access_document.

DROP POLICY IF EXISTS "Users can view own and shared documents" ON public.documents;

CREATE POLICY "Users can view own and shared documents"
ON public.documents
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_access_document(id, auth.uid())
);