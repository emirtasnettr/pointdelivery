-- =====================================================
-- İŞ İLANI-ADAY EŞLEŞTİRME TABLOSU
-- =====================================================
-- Consultant iş ilanına aday atadığında ve adayın kabul/red durumu için
-- =====================================================

-- 1. JOB_ASSIGNMENTS TABLOSU OLUŞTUR
CREATE TABLE IF NOT EXISTS public.job_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    rejection_reason TEXT, -- Aday reddettiğinde belirttiği neden (minimum 10 karakter)
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- Consultant
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ, -- Aday cevap verdiğinde
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT job_assignments_unique_job_candidate UNIQUE (job_posting_id, candidate_id), -- Bir iş ilanına bir aday sadece bir kez atanabilir
    CONSTRAINT job_assignments_rejection_reason_check CHECK (
        (status = 'REJECTED' AND rejection_reason IS NOT NULL AND LENGTH(rejection_reason) >= 10) OR
        (status != 'REJECTED')
    )
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_posting_id ON public.job_assignments(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_candidate_id ON public.job_assignments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON public.job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_job_assignments_assigned_by ON public.job_assignments(assigned_by);

-- 2. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Adaylar kendi atamalarını görebilir
DROP POLICY IF EXISTS "Adaylar kendi atamalarını görebilir" ON public.job_assignments;
CREATE POLICY "Adaylar kendi atamalarını görebilir"
    ON public.job_assignments FOR SELECT
    USING (candidate_id = auth.uid());

-- Adaylar kendi atamalarını güncelleyebilir (kabul/red)
DROP POLICY IF EXISTS "Adaylar kendi atamalarını güncelleyebilir" ON public.job_assignments;
CREATE POLICY "Adaylar kendi atamalarını güncelleyebilir"
    ON public.job_assignments FOR UPDATE
    USING (candidate_id = auth.uid())
    WITH CHECK (candidate_id = auth.uid());

-- Consultant ve Admin tüm atamaları görebilir
DROP POLICY IF EXISTS "Consultant ve Admin tüm atamaları görebilir" ON public.job_assignments;
CREATE POLICY "Consultant ve Admin tüm atamaları görebilir"
    ON public.job_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Consultant ve Admin atama oluşturabilir
DROP POLICY IF EXISTS "Consultant ve Admin atama oluşturabilir" ON public.job_assignments;
CREATE POLICY "Consultant ve Admin atama oluşturabilir"
    ON public.job_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Consultant ve Admin atamaları güncelleyebilir
DROP POLICY IF EXISTS "Consultant ve Admin atamaları güncelleyebilir" ON public.job_assignments;
CREATE POLICY "Consultant ve Admin atamaları güncelleyebilir"
    ON public.job_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- 3. UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS update_job_assignments_updated_at ON public.job_assignments;
CREATE TRIGGER update_job_assignments_updated_at
    BEFORE UPDATE ON public.job_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. ADAY KABUL ETTİĞİNDE İŞ İLANI STATUS'UNU CURRENT YAPAN TRIGGER
CREATE OR REPLACE FUNCTION update_job_status_on_acceptance()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Eğer atama ACCEPTED durumuna geçtiyse, iş ilanı status'unu CURRENT yap
    IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
        UPDATE public.job_postings
        SET status = 'CURRENT',
            updated_at = NOW()
        WHERE id = NEW.job_posting_id;
    END IF;
    
    -- Eğer atama reddedildiyse, responded_at'i güncelle
    IF NEW.status IN ('ACCEPTED', 'REJECTED') AND OLD.status = 'PENDING' THEN
        NEW.responded_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_job_status_on_acceptance ON public.job_assignments;
CREATE TRIGGER trigger_update_job_status_on_acceptance
    BEFORE UPDATE ON public.job_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_job_status_on_acceptance();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık:
-- 1. job_assignments tablosu oluşturuldu
-- 2. RLS politikaları ayarlandı
-- 3. Aday kabul ettiğinde iş ilanı otomatik CURRENT olur
-- =====================================================
