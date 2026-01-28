-- =====================================================
-- JOB_POSTINGS TABLOSUNA YENİ ALANLAR EKLEME
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- İş ilanı oluşturma formunda kullanılacak yeni alanları ekler
-- =====================================================

-- 1. Görev (Task) - İş ilanında görev tanımı
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS task TEXT;

-- 2. İş Tipi (Job Type) - Tam Zamanlı, Part-time, Dönemsel
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('FULL_TIME', 'PART_TIME', 'SEASONAL') OR job_type IS NULL);

-- 3. Aylık Kişi Başı Bütçe (Tam Zamanlı ve Dönemsel için)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS monthly_budget_per_person NUMERIC(12, 2);

-- 4. Günlük Kişi Başı Bütçe (Part-time için)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS daily_budget_per_person NUMERIC(12, 2);

-- 5. Dönemsel Süre (Ay cinsinden - 1, 3, 6, 12)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS seasonal_period_months INTEGER CHECK (seasonal_period_months IN (1, 3, 6, 12) OR seasonal_period_months IS NULL);

-- 6. Part-time Başlangıç Tarihi (Part-time için gün aralığı başlangıcı)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS part_time_start_date DATE;

-- 7. Part-time Bitiş Tarihi (Part-time için gün aralığı bitişi)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS part_time_end_date DATE;

-- 8. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_job_postings_job_type ON public.job_postings(job_type);

-- NOT: contract_start_date ve contract_end_date zaten mevcut
-- Tam Zamanlı işler için contract_start_date ve contract_end_date kullanılacak
-- Part-time işler için part_time_start_date ve part_time_end_date kullanılacak
-- Dönemsel işler için sadece seasonal_period_months kullanılacak

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık job_postings tablosunda şu yeni alanlar var:
-- 1. task (Görev tanımı)
-- 2. job_type (FULL_TIME, PART_TIME, SEASONAL)
-- 3. monthly_budget_per_person (Aylık kişi başı bütçe)
-- 4. daily_budget_per_person (Günlük kişi başı bütçe)
-- 5. seasonal_period_months (1, 3, 6, 12 ay)
-- 6. part_time_start_date (Part-time başlangıç tarihi)
-- 7. part_time_end_date (Part-time bitiş tarihi)
-- =====================================================
