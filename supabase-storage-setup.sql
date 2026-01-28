-- =====================================================
-- SUPABASE STORAGE KURULUMU
-- =====================================================
-- Bu script, belge yükleme için Supabase Storage bucket'ını oluşturur

-- 1. DOCUMENTS BUCKET'INI OLUŞTUR
-- NOT: Bu komut SQL Editor'de çalışmaz, Supabase Dashboard > Storage > New Bucket üzerinden yapılmalı
-- Ancak SQL ile yapmak isterseniz (Service Role Key gerekir):

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS POLİTİKALARI (Storage için)
-- Kullanıcılar kendi belgelerini yükleyebilir
CREATE POLICY "Kullanıcılar kendi belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kullanıcılar kendi belgelerini görebilir
CREATE POLICY "Kullanıcılar kendi belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Kullanıcılar kendi belgelerini silebilir
CREATE POLICY "Kullanıcılar kendi belgelerini silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Consultant ve Admin tüm belgeleri görebilir
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
-- NOT: Storage bucket'ını Dashboard üzerinden oluşturmanız daha kolay olabilir:
-- =====================================================
-- 1. Supabase Dashboard > Storage > New Bucket
-- 2. Bucket name: "documents"
-- 3. Public bucket: NO (kapalı)
-- 4. File size limit: 50MB (veya istediğiniz limit)
-- 5. Allowed MIME types: application/pdf, image/*, vb. (isteğe bağlı)
-- 
-- SQL script'i çalıştırmak için Service Role Key gerekebilir.
-- RLS politikalarını yukarıdaki SQL ile ekleyebilirsiniz.
-- =====================================================
