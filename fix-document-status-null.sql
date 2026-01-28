-- =====================================================
-- BELGE STATUS NULL SORUNU DÜZELTME
-- =====================================================
-- Bu script, belge güncelleme sırasında status NULL hatası için
-- DEFAULT değerini ve mevcut verileri kontrol eder
-- =====================================================

-- 1. Mevcut DEFAULT değerini kontrol et ve gerekirse güncelle
DO $$
BEGIN
  -- Eğer DEFAULT değer 'PENDING' ise, NULL yap
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'status'
    AND column_default = '''PENDING''::text'
  ) THEN
    ALTER TABLE public.documents ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.documents ALTER COLUMN status SET DEFAULT NULL;
  END IF;
END $$;

-- 2. Mevcut PENDING ve DRAFT belgeleri NULL yap (eğer varsa)
UPDATE public.documents 
SET status = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL
WHERE status IN ('PENDING', 'DRAFT');

-- 3. CHECK constraint'i kontrol et ve güncelle (eğer gerekiyorsa)
DO $$
BEGIN
  -- Eğer constraint yoksa veya yanlışsa, düzelt
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'documents' 
    AND constraint_name = 'documents_status_check'
  ) THEN
    ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_status_check 
    CHECK (status IS NULL OR status IN ('APPROVED', 'REJECTED'));
  END IF;
END $$;

-- 4. Son kontrol: Hala PENDING veya DRAFT statüsünde belge var mı?
SELECT 
  COUNT(*) as hatali_belge_sayisi,
  array_agg(DISTINCT status) as hatali_statuler
FROM public.documents 
WHERE status NOT IN ('APPROVED', 'REJECTED') AND status IS NOT NULL;

-- =====================================================
-- NOT: Eğer yukarıdaki sorgu 0 dönerse, her şey tamam! ✅
-- Eğer > 0 dönerse, o belgeleri manuel olarak NULL yapmalısınız
-- =====================================================
