-- =====================================================
-- BELGE STATÜLERİ GÜNCELLEME - SADECE KABUL/RED
-- =====================================================
-- Belgeler artık sadece APPROVED (Kabul) veya REJECTED (Red) olacak
-- DRAFT ve PENDING statüleri kaldırılıyor
-- =====================================================

-- 1. ÖNCE CHECK CONSTRAINT'İ KALDIR (UPDATE için gerekli)
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

-- 2. MEVCUT PENDING VE DRAFT BELGELERİ NULL YAP
-- Consultant'lar bunları görebilir ama henüz işaretlenmemiş olarak görünecek
UPDATE public.documents 
SET status = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL
WHERE status IN ('PENDING', 'DRAFT');

-- 3. DEFAULT DEĞERİNİ NULL YAP (yeni belgeler için)
ALTER TABLE public.documents 
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.documents 
ALTER COLUMN status SET DEFAULT NULL;

-- 4. YENİ CHECK CONSTRAINT EKLE (sadece NULL, APPROVED, REJECTED kabul edilir)
ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check 
CHECK (status IS NULL OR status IN ('APPROVED', 'REJECTED'));

-- 5. RLS POLICY GÜNCELLEMESİ
-- Consultant ve Admin'ler tüm belgeleri görebilir (NULL, APPROVED, REJECTED)
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON public.documents;

CREATE POLICY "Consultant ve Admin belgeleri görebilir"
    ON public.documents FOR SELECT
    USING (
        -- Status NULL veya APPROVED veya REJECTED olabilir (DRAFT/PENDING yok artık)
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
-- 1. Belgeler sadece APPROVED (Kabul) veya REJECTED (Red) olabilir
-- 2. Henüz incelenmemiş belgeler NULL olur
-- 3. Consultant'lar tüm belgeleri görebilir (NULL, APPROVED, REJECTED)
-- 4. Başvuru statüsüne göre belge işlemi yapılabilir/yapılamaz
-- =====================================================
