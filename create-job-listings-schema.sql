-- İş İlanları ve Başvurular Tabloları
-- Bu script Supabase SQL Editor'de çalıştırılmalıdır

-- 1. İş İlanları Tablosu
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    company_name TEXT,
    company_logo_url TEXT, -- Supabase Storage'daki logo URL'i
    location TEXT,
    job_type TEXT, -- 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'
    salary_min INTEGER,
    salary_max INTEGER,
    requirements JSONB DEFAULT '[]'::jsonb, -- Gereksinimler listesi
    benefits JSONB DEFAULT '[]'::jsonb, -- Yan haklar listesi
    is_active BOOLEAN DEFAULT true,
    application_deadline DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_listings_consultant_id ON public.job_listings(consultant_id);
CREATE INDEX idx_job_listings_is_active ON public.job_listings(is_active);
CREATE INDEX idx_job_listings_created_at ON public.job_listings(created_at);

-- 2. İş İlanı Başvuruları Tablosu
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED')),
    notes TEXT, -- Consultant notları
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT job_applications_unique_candidate_job UNIQUE (job_listing_id, candidate_id) -- Bir aday aynı işe sadece bir kez başvurabilir
);

CREATE INDEX idx_job_applications_job_listing_id ON public.job_applications(job_listing_id);
CREATE INDEX idx_job_applications_candidate_id ON public.job_applications(candidate_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

-- 3. RLS Policies - İş İlanları
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Consultant'lar kendi ilanlarını görebilir ve yönetebilir
CREATE POLICY "Consultant'lar kendi ilanlarını görebilir"
    ON public.job_listings FOR SELECT
    USING (
        consultant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'CONSULTANT')
        )
    );

CREATE POLICY "Consultant'lar iş ilanı oluşturabilir"
    ON public.job_listings FOR INSERT
    WITH CHECK (
        consultant_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'CONSULTANT'
        )
    );

CREATE POLICY "Consultant'lar kendi ilanlarını güncelleyebilir"
    ON public.job_listings FOR UPDATE
    USING (consultant_id = auth.uid())
    WITH CHECK (consultant_id = auth.uid());

CREATE POLICY "Consultant'lar kendi ilanlarını silebilir"
    ON public.job_listings FOR DELETE
    USING (consultant_id = auth.uid());

-- Adaylar aktif ilanları görebilir
CREATE POLICY "Adaylar aktif ilanları görebilir"
    ON public.job_listings FOR SELECT
    USING (
        is_active = true OR
        consultant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'CONSULTANT')
        )
    );

-- 4. RLS Policies - İş İlanı Başvuruları
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Adaylar kendi başvurularını görebilir
CREATE POLICY "Adaylar kendi başvurularını görebilir"
    ON public.job_applications FOR SELECT
    USING (candidate_id = auth.uid());

-- Adaylar başvuru yapabilir
CREATE POLICY "Adaylar başvuru yapabilir"
    ON public.job_applications FOR INSERT
    WITH CHECK (
        candidate_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'CANDIDATE'
        )
    );

-- Consultant'lar kendi ilanlarına yapılan başvuruları görebilir
CREATE POLICY "Consultant'lar ilan başvurularını görebilir"
    ON public.job_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.job_listings jl
            WHERE jl.id = job_applications.job_listing_id
            AND jl.consultant_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'ADMIN'
        )
    );

-- Consultant'lar başvuruları güncelleyebilir (durum değiştirme)
CREATE POLICY "Consultant'lar başvuruları güncelleyebilir"
    ON public.job_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.job_listings jl
            WHERE jl.id = job_applications.job_listing_id
            AND jl.consultant_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.job_listings jl
            WHERE jl.id = job_applications.job_listing_id
            AND jl.consultant_id = auth.uid()
        )
    );

-- 5. Storage Bucket - İş İlanı Logoları
-- Not: Bu bucket'ı Supabase Dashboard'dan manuel olarak oluşturmanız gerekebilir
-- Bucket adı: 'job-logos'
-- Public: false (sadece authenticated kullanıcılar erişebilir)

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON public.job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
