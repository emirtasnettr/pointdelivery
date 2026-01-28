-- =====================================================
-- STORAGE DELETE POLİTİKASI EKLEME
-- =====================================================
-- Consultant ve Admin'in belgeleri silme yetkisi
-- Bu script'i Supabase SQL Editor'de çalıştırın

-- Önce mevcut policy'yi kontrol et (varsa drop et)
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri silebilir" ON storage.objects;

-- Consultant ve Admin belgeleri silebilir
CREATE POLICY "Consultant ve Admin belgeleri silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  public.is_consultant_or_admin() = true
);
