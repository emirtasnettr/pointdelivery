-- =====================================================
-- STORAGE RLS POLİTİKALARI (SADECE)
-- =====================================================
-- ÖNEMLİ: Önce Supabase Dashboard > Storage > New Bucket ile
-- "documents" adında bir bucket oluşturmalısınız!
-- 
-- Bu script sadece RLS politikalarını ekler.
-- =====================================================

-- Önce mevcut politikaları kaldır (eğer varsa)
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini silebilir" ON storage.objects;
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON storage.objects;

-- 1. Kullanıcılar kendi belgelerini yükleyebilir
-- NOT: Dosya yolu {user-id}/{filename} formatında olmalı
CREATE POLICY "Kullanıcılar kendi belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Kullanıcılar kendi belgelerini görebilir
CREATE POLICY "Kullanıcılar kendi belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Kullanıcılar kendi belgelerini silebilir
CREATE POLICY "Kullanıcılar kendi belgelerini silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Consultant ve Admin tüm belgeleri görebilir
-- NOT: Bu politika, is_consultant_or_admin fonksiyonunu kullanır
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('CONSULTANT', 'ADMIN')
  )
);

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık Storage RLS politikaları aktif.
-- Kullanıcılar sadece kendi belgelerini yükleyebilir/görebilir.
-- Consultant ve Admin tüm belgeleri görebilir.
-- =====================================================
