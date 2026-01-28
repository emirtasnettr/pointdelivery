-- =====================================================
-- TÜM FİRSATLARI SİLME SCRIPTİ
-- =====================================================
-- Bu script, job_postings tablosundaki TÜM kayıtları siler
-- Statü fark etmeksizin tüm fırsatlar silinecektir
-- 
-- ⚠️ UYARI: Bu işlem geri alınamaz!
-- =====================================================

-- Önce bağımlı tablolardaki ilişkili kayıtları sil (eğer CASCADE yoksa)
-- job_assignments tablosundaki ilişkili kayıtları sil
DELETE FROM public.job_assignments;

-- job_postings tablosundaki TÜM kayıtları sil
DELETE FROM public.job_postings;

-- Sonucu kontrol et
SELECT COUNT(*) as remaining_jobs FROM public.job_postings;
