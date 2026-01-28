-- =====================================================
-- JOB_POSTINGS VE JOB_ASSIGNMENTS TABLOLARINA YENİ ALANLAR EKLEME
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- İş ilanı reddetme ve aday tutarları için gerekli alanları ekler
-- =====================================================

-- 1. JOB_POSTINGS TABLOSUNA RED BİLGİLERİ EKLE
-- Red nedeni ve yeni teklif tutarları için alanlar

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS rejection_reason TEXT CHECK (rejection_reason IN ('NEW_OFFER', 'PERSONNEL_SHORTAGE') OR rejection_reason IS NULL);

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Yeni teklif tutarları (eğer rejection_reason = 'NEW_OFFER' ise)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_monthly_budget_per_person NUMERIC(12, 2);

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_daily_budget_per_person NUMERIC(12, 2);

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_total_without_vat NUMERIC(12, 2);

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_total_with_vat NUMERIC(12, 2);

-- Yeni teklif onay durumu (müşteri kabul ederse ACTIVE'a geri döner)
ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.job_postings
ADD COLUMN IF NOT EXISTS new_offer_accepted_at TIMESTAMPTZ;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_job_postings_rejection_reason ON public.job_postings(rejection_reason);
CREATE INDEX IF NOT EXISTS idx_job_postings_rejected_by ON public.job_postings(rejected_by);

-- 2. JOB_ASSIGNMENTS TABLOSUNA ADAY TUTARLARI EKLE
-- Adayın kazanacağı tutar (Consultant tarafından belirlenir)
ALTER TABLE public.job_assignments
ADD COLUMN IF NOT EXISTS candidate_monthly_salary NUMERIC(12, 2);

ALTER TABLE public.job_assignments
ADD COLUMN IF NOT EXISTS candidate_daily_salary NUMERIC(12, 2);

-- NOT: candidate_monthly_salary Tam Zamanlı ve Dönemsel için kullanılır
-- candidate_daily_salary Part-time için kullanılır
-- Aday sadece consultant'ın belirlediği tutarı görecek, müşterinin teklifini görmeyecek

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık:
-- 1. job_postings tablosunda red nedeni ve yeni teklif tutarları alanları var
-- 2. job_assignments tablosunda aday tutarları alanları var
-- 3. Reddedilen ilanlar müşteriye gönderilebilir
-- 4. Adaylar sadece consultant'ın belirlediği tutarı görecek
-- =====================================================
