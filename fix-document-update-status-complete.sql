-- =====================================================
-- BELGE GÜNCELLEME SORUNU TAM ÇÖZÜM
-- =====================================================
-- Bu script, belge güncelleme sırasında status NULL hatası için
-- Hem DEFAULT değerini hem de UPDATE trigger'ı ekler
-- =====================================================

-- 1. CHECK CONSTRAINT'İ KALDIR (eğer varsa)
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

-- 2. MEVCUT PENDING VE DRAFT BELGELERİ NULL YAP
UPDATE public.documents 
SET status = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL
WHERE status IN ('PENDING', 'DRAFT');

-- 3. DEFAULT DEĞERİNİ NULL YAP
-- NOT: DROP DEFAULT IF EXISTS syntax'ı PostgreSQL'de desteklenmiyor
-- Eğer DEFAULT yoksa hata verebilir ama devam eder
DO $$ 
BEGIN
  ALTER TABLE public.documents ALTER COLUMN status DROP DEFAULT;
EXCEPTION
  WHEN OTHERS THEN
    -- DEFAULT yoksa devam et
    NULL;
END $$;

ALTER TABLE public.documents 
ALTER COLUMN status SET DEFAULT NULL;

-- 4. YENİ CHECK CONSTRAINT EKLE
ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check 
CHECK (status IS NULL OR status IN ('APPROVED', 'REJECTED'));

-- 5. UPDATE TRIGGER OLUŞTUR (Belge değiştirildiğinde status'u NULL yap)
CREATE OR REPLACE FUNCTION reset_document_status_on_file_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer dosya yolu veya dosya adı değiştiyse, status'u NULL yap
  IF (OLD.file_path IS DISTINCT FROM NEW.file_path) OR 
     (OLD.file_name IS DISTINCT FROM NEW.file_name) THEN
    NEW.status = NULL;
    NEW.reviewed_by = NULL;
    NEW.reviewed_at = NULL;
    NEW.review_notes = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle
DROP TRIGGER IF EXISTS trigger_reset_status_on_file_change ON public.documents;

CREATE TRIGGER trigger_reset_status_on_file_change
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION reset_document_status_on_file_change();

-- 6. RLS POLICY GÜNCELLEMESİ
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON public.documents;

CREATE POLICY "Consultant ve Admin belgeleri görebilir"
    ON public.documents FOR SELECT
    USING (
        (status IS NULL OR status IN ('APPROVED', 'REJECTED')) AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık:
-- 1. Belge dosyası değiştirildiğinde otomatik olarak status NULL olacak
-- 2. Yeni belgeler status = NULL ile kaydedilecek (DEFAULT)
-- 3. UPDATE işleminde status'u explicit set etmeye gerek yok - trigger halledecek
-- =====================================================
