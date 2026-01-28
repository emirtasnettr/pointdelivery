-- =====================================================
-- JOB_POSTINGS TABLOSUNA İL VE İLÇE KOLONLARI EKLEME
-- =====================================================
-- Bu script, job_postings tablosuna city ve district kolonlarını ekler

-- İl kolonu ekle
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS city TEXT;

-- İlçe kolonu ekle
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS district TEXT;

-- İndex ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_job_postings_city ON public.job_postings(city);
CREATE INDEX IF NOT EXISTS idx_job_postings_district ON public.job_postings(district);

-- Açıklama
COMMENT ON COLUMN public.job_postings.city IS 'Fırsatın bulunduğu il';
COMMENT ON COLUMN public.job_postings.district IS 'Fırsatın bulunduğu ilçe';
