-- =====================================================
-- MIDDLEMAN BELGELERİ İÇİN RLS POLİTİKALARI (TAM)
-- =====================================================
-- Bu script, Middleman'lerin kendi adaylarının belgelerini
-- görebilmesi için gerekli tüm RLS politikalarını oluşturur
-- =====================================================

-- 1. DOCUMENTS TABLOSU RLS POLİTİKALARI

-- 1.1. Middleman'ler kendi adaylarının belgelerini görebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini görebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini görebilir"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 1.2. Middleman'ler kendi adayları için belge yükleyebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini yükleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini yükleyebilir"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 1.3. Middleman'ler kendi adaylarının belgelerini güncelleyebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini güncelleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini güncelleyebilir"
ON public.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 1.4. Middleman'ler kendi adaylarının belgelerini silebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini silebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini silebilir"
ON public.documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 2. STORAGE RLS POLİTİKALARI

-- 2.1. Middleman kendi adaylarının belgelerini görebilir (signed URL için)
DROP POLICY IF EXISTS "Middleman kendi adaylarının belgelerini görebilir" ON storage.objects;

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

-- 2.2. Middleman kendi adaylarının belgelerini yükleyebilir
DROP POLICY IF EXISTS "Middleman kendi adaylarının belgelerini yükleyebilir" ON storage.objects;

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

-- 2.3. Middleman kendi adaylarının belgelerini silebilir
DROP POLICY IF EXISTS "Middleman kendi adaylarının belgelerini silebilir" ON storage.objects;

CREATE POLICY "Middleman kendi adaylarının belgelerini silebilir"
ON storage.objects FOR DELETE
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

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık Middleman'ler:
-- - Kendi adaylarının belgelerini görebilir (documents tablosu)
-- - Kendi adaylarının belgelerini yükleyebilir/güncelleyebilir/silebilir
-- - Kendi adaylarının storage dosyalarını görebilir (signed URL için)
-- - Kendi adaylarının storage dosyalarını yükleyebilir/silebilir
-- =====================================================
