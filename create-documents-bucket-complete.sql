-- =====================================================
-- DOCUMENTS BUCKET OLUŞTURMA VE RLS KURULUMU
-- =====================================================
-- Bu script, "documents" bucket'ını oluşturur ve RLS politikalarını ekler
-- Supabase SQL Editor'de çalıştırın
-- =====================================================

-- 1. DOCUMENTS BUCKET'INI OLUŞTUR
-- NOT: Eğer bucket zaten varsa, ON CONFLICT ile hata vermez
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket (güvenlik için)
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 2. MEVCUT RLS POLİTİKALARINI KALDIR (eğer varsa)
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini yükleyebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Kullanıcılar kendi belgelerini silebilir" ON storage.objects;
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Middleman kendi adaylarının belgelerini görebilir" ON storage.objects;
DROP POLICY IF EXISTS "Middleman kendi adaylarının belgelerini yükleyebilir" ON storage.objects;

-- 3. RLS POLİTİKALARINI OLUŞTUR

-- 3.1. Kullanıcılar kendi belgelerini yükleyebilir
-- NOT: Dosya yolu {user-id}/{filename} formatında olmalı
CREATE POLICY "Kullanıcılar kendi belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3.2. Kullanıcılar kendi belgelerini görebilir
CREATE POLICY "Kullanıcılar kendi belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3.3. Kullanıcılar kendi belgelerini silebilir
CREATE POLICY "Kullanıcılar kendi belgelerini silebilir"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3.4. Consultant ve Admin tüm belgeleri görebilir
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

-- 3.5. Middleman kendi adaylarının belgelerini görebilir
CREATE POLICY "Middleman kendi adaylarının belgelerini görebilir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'MIDDLEMAN'
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.middleman_id = auth.uid()
      AND p2.id::text = (storage.foldername(name))[1]
    )
  )
);

-- 3.6. Middleman kendi adaylarının belgelerini yükleyebilir
CREATE POLICY "Middleman kendi adaylarının belgelerini yükleyebilir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'MIDDLEMAN'
    AND EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.middleman_id = auth.uid()
      AND p2.id::text = (storage.foldername(name))[1]
    )
  )
);

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık "documents" bucket'ı oluşturuldu ve RLS politikaları aktif.
-- 
-- Kullanıcılar:
-- - Sadece kendi belgelerini yükleyebilir/görebilir/silebilir
-- - Dosya yolu formatı: {user-id}/{filename} olmalı
--
-- Consultant ve Admin:
-- - Tüm belgeleri görebilir
--
-- Middleman:
-- - Kendi adaylarının belgelerini görebilir ve yükleyebilir
-- =====================================================
