-- =====================================================
-- APPROVED DURUMUNDAKİ İŞ İLANLARINI CURRENT OLARAK GÜNCELLE
-- =====================================================
-- Consultant tarafından onaylanmış ve aday atanmış iş ilanlarının
-- status değerini APPROVED'dan CURRENT'a günceller
-- =====================================================

-- APPROVED durumundaki tüm iş ilanlarını CURRENT olarak güncelle
-- (Çünkü consultant onayladığında ve aday atadığında artık CURRENT olmalı)
UPDATE public.job_postings 
SET status = 'CURRENT', 
    updated_at = NOW()
WHERE status = 'APPROVED';

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık tüm APPROVED durumundaki iş ilanları CURRENT olarak güncellendi
-- Müşteri dashboard'unda "Aktif Fırsatlar" bölümünde görünecekler
-- =====================================================
