-- =====================================================
-- STORAGE RLS POLİTİKALARI DÜZELTME
-- =====================================================
-- Bu script, Storage RLS politikalarını düzeltir
-- Dosya yolu formatı: {user-id}/{filename}

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini silebilir" ON storage.objects;
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON storage.objects;

-- 1. Kullanıcılar kendi belgelerini yükleyebilir
-- Dosya yolu: {user-id}/{filename} formatında olmalı
-- Örnek: 123e4567-e89b-12d3-a456-426614174000/1701234567890.pdf
CREATE POLICY "Kullanıcılar kendi belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  -- Dosya yolunun başlangıcı kullanıcının ID'si ile başlamalı
  -- Örnek: 123e4567-e89b-12d3-a456-426614174000/1701234567890.pdf
  (name)::text LIKE (auth.uid()::text || '/%')
);

-- 2. Kullanıcılar kendi belgelerini görebilir
CREATE POLICY "Kullanıcılar kendi belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (name)::text LIKE (auth.uid()::text || '/%')
);

-- 3. Kullanıcılar kendi belgelerini silebilir
CREATE POLICY "Kullanıcılar kendi belgelerini silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (name)::text LIKE (auth.uid()::text || '/%')
);

-- 4. Consultant ve Admin tüm belgeleri görebilir
-- SECURITY DEFINER fonksiyonu ile RLS bypass
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  public.is_consultant_or_admin() = true
);

-- 5. Consultant ve Admin belgeleri silebilir
CREATE POLICY "Consultant ve Admin belgeleri silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  public.is_consultant_or_admin() = true
);

-- =====================================================
-- ÖNEMLİ NOTLAR:
-- =====================================================
-- 1. Dosya yolu formatı: {user-id}/{filename}
--    Örnek: 123e4567-e89b-12d3-a456-426614174000/1701234567890.pdf
--
-- 2. Bucket adı: 'documents'
--
-- 3. Storage bucket'ı Dashboard'dan oluşturulmalı:
--    Dashboard > Storage > New Bucket > Name: "documents" > Private
--
-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
