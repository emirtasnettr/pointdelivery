-- =====================================================
-- BELGE STATUS NULL YAPMAK İÇİN RPC FUNCTION
-- =====================================================
-- TypeScript'ten null değerini doğru göndermek için helper function
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_document_status_null(doc_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents
  SET status = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL
  WHERE id = doc_id;
END;
$$;

-- =====================================================
-- KULLANIM:
-- =====================================================
-- const { error } = await supabase.rpc('update_document_status_null', {
--   doc_id: documentId
-- });
-- =====================================================
