-- =====================================================
-- SITE LOGO STORAGE RLS POLİTİKALARI
-- =====================================================
-- Logo dosyaları site/ klasöründe saklanıyor
-- Bu klasör için özel RLS politikaları ekliyoruz

-- Önce mevcut site/ klasörü politikalarını kaldır (eğer varsa)
DROP POLICY IF EXISTS "Herkes site logo'sunu görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Admin'ler site logo'sunu yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Admin'ler site logo'sunu güncelleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Admin'ler site logo'sunu silebilir" ON storage.objects;

-- 1. Herkes site logo'sunu görebilir (public read)
-- Logo public olmalı çünkü her sayfada gösteriliyor
CREATE POLICY "Herkes site logo'sunu görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (name)::text LIKE 'site/%'
);

-- 2. Sadece Admin'ler site logo'sunu yükleyebilir
CREATE POLICY "Admin'ler site logo'sunu yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (name)::text LIKE 'site/%' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 3. Sadece Admin'ler site logo'sunu güncelleyebilir
CREATE POLICY "Admin'ler site logo'sunu güncelleyebilir"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (name)::text LIKE 'site/%' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
)
WITH CHECK (
  bucket_id = 'documents' AND
  (name)::text LIKE 'site/%' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- 4. Sadece Admin'ler site logo'sunu silebilir
CREATE POLICY "Admin'ler site logo'sunu silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (name)::text LIKE 'site/%' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  )
);

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık site/ klasöründeki logo dosyaları:
-- - Herkes tarafından görüntülenebilir (public read)
-- - Sadece Admin'ler tarafından yüklenebilir/güncellenebilir/silinebilir
