-- =====================================================
-- JOB_POSTINGS TABLOSUNA ÇALIŞMA SAATLERİ ALANI EKLEME
-- =====================================================
-- Part-time işler için günlük çalışma saatlerini saklamak için
-- JSONB formatında: {"2024-01-15": {"start": "09:00", "end": "17:00"}, ...}
-- =====================================================

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_job_postings_working_hours ON public.job_postings USING GIN (working_hours);

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
