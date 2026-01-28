-- =====================================================
-- BELGE GÖNDERME AKIŞI TAM DÜZELTME
-- =====================================================
-- Bu script, belge yükleme ve gönderme akışını tam olarak düzeltir
-- 1. DRAFT status'unu ekler
-- 2. RLS policy'yi günceller (Consultant'lar DRAFT göremez)
-- 3. Mevcut PENDING belgeleri DRAFT'a çevirir (isteğe bağlı)
-- =====================================================

-- 1. DRAFT STATUS'UNU EKLE
-- Önce mevcut CHECK constraint'i kaldır
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

-- Yeni CHECK constraint ekle (DRAFT, PENDING, APPROVED, REJECTED)
ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check 
CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'));

-- 2. RLS POLICY GÜNCELLEMESİ
-- Consultant ve Admin'lerin sadece gönderilmiş belgeleri görmesi için
-- Önce mevcut policy'yi kaldır
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON public.documents;

-- Yeni policy: Sadece DRAFT olmayan belgeleri görebilirler
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
    ON public.documents FOR SELECT
    USING (
        status != 'DRAFT' AND -- DRAFT belgeleri gösterme
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- 3. MEVCUT PENDING BELGELERİ DRAFT'A ÇEVİR (OPSİYONEL)
-- Eğer consultant tarafından incelenmemiş PENDING belgeler varsa, bunları DRAFT'a çevir
-- Böylece aday tekrar "Belgeleri Onaya Gönder" butonuna basabilir
UPDATE public.documents 
SET status = 'DRAFT', 
    reviewed_by = NULL, 
    reviewed_at = NULL
WHERE status = 'PENDING' 
  AND reviewed_by IS NULL;

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık:
-- 1. Yeni belgeler DRAFT olarak kaydedilecek
-- 2. Consultant'lar DRAFT belgeleri göremeyecek
-- 3. Aday "Belgeleri Onaya Gönder" butonuna basınca belgeler PENDING olacak
-- 4. Consultant'lar sadece PENDING, APPROVED, REJECTED belgeleri görebilecek
-- =====================================================
