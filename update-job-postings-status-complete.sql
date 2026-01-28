-- =====================================================
-- İŞ İLANI STATUS MANTIK GÜNCELLEME
-- =====================================================
-- Yeni mantık:
-- ACTIVE: İş İlanı Talebi (consultant onayı bekliyor)
-- APPROVED: Consultant onayladı (Aktif İş İlanları - henüz aday atanmamış)
-- CURRENT: Aday atandı VE kabul etti (Aktif Sözleşmeler)
-- PAST: Sözleşme tarihi bitmiş (Geçmiş Sözleşmeler)
-- =====================================================

-- 1. JOB_STATUS ENUM'UNU GÜNCELLE
-- Önce APPROVED değerini ekle
DO $$ 
BEGIN
    -- Enum değerinin var olup olmadığını kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'APPROVED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')
    ) THEN
        -- Enum değerini ekle
        ALTER TYPE job_status ADD VALUE 'APPROVED';
    END IF;
END $$;

-- 2. MEVCUT CURRENT STATUS'U OLAN İŞ İLANLARINI APPROVED YAP
-- (Çünkü henüz aday atanmamış olabilir - bu düzeltme için)
-- NOT: Mevcut CURRENT'ları koruyacağız, sadece yeni mantık için güncelleme yapacağız
-- UPDATE public.job_postings SET status = 'APPROVED' WHERE status = 'CURRENT';
-- Yukarıdaki satırı yorum satırı olarak bırakıyoruz - manuel kontrol gerekebilir

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık job_status enum'unda şu değerler var:
-- - ACTIVE: İş İlanı Talebi (consultant onayı bekliyor)
-- - APPROVED: Consultant onayladı (Aktif İş İlanları)
-- - CURRENT: Aday atandı ve kabul etti (Aktif Sözleşmeler)
-- - PAST: Sözleşme bitmiş (Geçmiş Sözleşmeler)
-- =====================================================
