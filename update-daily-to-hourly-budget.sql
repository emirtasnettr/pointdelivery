-- =====================================================
-- JOB_POSTINGS TABLOSUNDA GÜNLÜK ÜCRETİ SAATLİK ÜCRETE ÇEVİRME
-- =====================================================
-- Part-time işler için günlük ücret yerine saatlik ücret kullanılacak
-- =====================================================

-- 1. Yeni saatlik ücret alanını ekle
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS hourly_budget_per_person NUMERIC(12, 2);

-- 2. Mevcut günlük ücret verilerini saatlik ücrete çevir (varsayılan 8 saat üzerinden)
-- NOT: Bu sadece mevcut veriler için. Yeni kayıtlar saatlik ücret kullanacak.
UPDATE public.job_postings
SET hourly_budget_per_person = daily_budget_per_person / 8.0
WHERE daily_budget_per_person IS NOT NULL 
  AND hourly_budget_per_person IS NULL
  AND job_type = 'PART_TIME';

-- 3. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_job_postings_hourly_budget ON public.job_postings(hourly_budget_per_person);

-- NOT: daily_budget_per_person alanı kaldırılmayacak (geriye dönük uyumluluk için)
-- Ancak yeni kayıtlar hourly_budget_per_person kullanacak

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
