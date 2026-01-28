-- =====================================================
-- MÜŞTERİ ROLÜ VE ALTYAPI EKLEME (2. ADIM)
-- =====================================================
-- ÖNCE add-customer-role-enum-only.sql script'ini çalıştırın
-- Sonra bu script'i çalıştırın
-- Müşteri rolü, customer_info tablosu ve job_postings tablosu oluşturulacak
-- =====================================================

-- NOT: Enum değeri (CUSTOMER) önceki script'te eklenmiş olmalı

-- 2. CUSTOMER_INFO TABLOSU OLUŞTUR (Müşteri firma bilgileri için)
-- Müşteri rolündeki kullanıcıların firma bilgilerini saklar
CREATE TABLE IF NOT EXISTS public.customer_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    authorized_name TEXT, -- Yetkili Adı Soyadı
    authorized_phone TEXT, -- Yetkili Telefon Numarası
    company_name TEXT, -- Firma Ünvanı
    tax_number TEXT, -- Vergi Numarası
    tax_office TEXT, -- Vergi Dairesi
    company_address TEXT, -- Şirket Adresi
    company_phone TEXT, -- Şirket Telefon Numarası
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NOT: Rol kontrolü trigger ile yapılacak (CHECK constraint'te subquery kullanılamaz)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_customer_info_profile_id ON public.customer_info(profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_info_tax_number ON public.customer_info(tax_number);

-- 3. JOB_POSTINGS TABLOSU OLUŞTUR/GÜNCELLE (İş İlanları için)
-- İş ilanlarının durumunu belirten enum
CREATE TYPE job_status AS ENUM (
    'ACTIVE',      -- Aktif İşe Alımlar (şu an aday aranan ilanlar)
    'CURRENT',     -- Mevcut İşe Alımlar (aday bulunmuş, çalışıyor)
    'PAST'         -- Geçmiş İşe Alımlar (sözleşme sonlandırılmış)
);

CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- İş İlanı Başlığı
    description TEXT, -- İş İlanı Açıklaması (ne aranıyor)
    required_count INTEGER NOT NULL DEFAULT 1, -- Kaç kişiye ihtiyaç var
    contract_start_date DATE, -- Sözleşme Başlangıç Tarihi
    contract_end_date DATE, -- Sözleşme Bitiş Tarihi
    start_date DATE, -- Personelin ne zaman işe başlaması gerektiği
    status job_status NOT NULL DEFAULT 'ACTIVE', -- İlan durumu
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NOT: Rol kontrolü trigger ile yapılacak (CHECK constraint'te subquery kullanılamaz)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_job_postings_customer_id ON public.job_postings(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at);

-- 4. ROW LEVEL SECURITY (RLS) POLİTİKALARI

-- CUSTOMER_INFO RLS
ALTER TABLE public.customer_info ENABLE ROW LEVEL SECURITY;

-- Müşteriler kendi bilgilerini görebilir
DROP POLICY IF EXISTS "Müşteriler kendi bilgilerini görebilir" ON public.customer_info;
CREATE POLICY "Müşteriler kendi bilgilerini görebilir"
    ON public.customer_info FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = profile_id 
            AND id = auth.uid()
        )
    );

-- Consultant ve Admin'ler tüm müşteri bilgilerini görebilir
DROP POLICY IF EXISTS "Consultant ve Admin müşteri bilgilerini görebilir" ON public.customer_info;
CREATE POLICY "Consultant ve Admin müşteri bilgilerini görebilir"
    ON public.customer_info FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Müşteriler kendi bilgilerini oluşturabilir
DROP POLICY IF EXISTS "Müşteriler kendi bilgilerini oluşturabilir" ON public.customer_info;
CREATE POLICY "Müşteriler kendi bilgilerini oluşturabilir"
    ON public.customer_info FOR INSERT
    WITH CHECK (
        profile_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'CUSTOMER'
        )
    );

-- Consultant ve Admin müşteri bilgisi oluşturabilir
DROP POLICY IF EXISTS "Consultant ve Admin müşteri bilgisi oluşturabilir" ON public.customer_info;
CREATE POLICY "Consultant ve Admin müşteri bilgisi oluşturabilir"
    ON public.customer_info FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Müşteriler kendi bilgilerini güncelleyebilir
DROP POLICY IF EXISTS "Müşteriler kendi bilgilerini güncelleyebilir" ON public.customer_info;
CREATE POLICY "Müşteriler kendi bilgilerini güncelleyebilir"
    ON public.customer_info FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Consultant ve Admin müşteri bilgilerini güncelleyebilir
DROP POLICY IF EXISTS "Consultant ve Admin müşteri bilgilerini güncelleyebilir" ON public.customer_info;
CREATE POLICY "Consultant ve Admin müşteri bilgilerini güncelleyebilir"
    ON public.customer_info FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- JOB_POSTINGS RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Müşteriler kendi iş ilanlarını görebilir
DROP POLICY IF EXISTS "Müşteriler kendi iş ilanlarını görebilir" ON public.job_postings;
CREATE POLICY "Müşteriler kendi iş ilanlarını görebilir"
    ON public.job_postings FOR SELECT
    USING (customer_id = auth.uid());

-- Consultant ve Admin tüm iş ilanlarını görebilir
DROP POLICY IF EXISTS "Consultant ve Admin tüm iş ilanlarını görebilir" ON public.job_postings;
CREATE POLICY "Consultant ve Admin tüm iş ilanlarını görebilir"
    ON public.job_postings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Müşteriler kendi iş ilanlarını oluşturabilir
DROP POLICY IF EXISTS "Müşteriler kendi iş ilanlarını oluşturabilir" ON public.job_postings;
CREATE POLICY "Müşteriler kendi iş ilanlarını oluşturabilir"
    ON public.job_postings FOR INSERT
    WITH CHECK (
        customer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'CUSTOMER'
        )
    );

-- Müşteriler kendi iş ilanlarını güncelleyebilir
DROP POLICY IF EXISTS "Müşteriler kendi iş ilanlarını güncelleyebilir" ON public.job_postings;
CREATE POLICY "Müşteriler kendi iş ilanlarını güncelleyebilir"
    ON public.job_postings FOR UPDATE
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Consultant ve Admin iş ilanlarını güncelleyebilir
DROP POLICY IF EXISTS "Consultant ve Admin iş ilanlarını güncelleyebilir" ON public.job_postings;
CREATE POLICY "Consultant ve Admin iş ilanlarını güncelleyebilir"
    ON public.job_postings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- Müşteriler kendi iş ilanlarını silebilir
DROP POLICY IF EXISTS "Müşteriler kendi iş ilanlarını silebilir" ON public.job_postings;
CREATE POLICY "Müşteriler kendi iş ilanlarını silebilir"
    ON public.job_postings FOR DELETE
    USING (customer_id = auth.uid());

-- 5. ROL KONTROL TRIGGER FONKSİYONLARI

-- customer_info için CUSTOMER rol kontrolü
CREATE OR REPLACE FUNCTION public.check_customer_role_for_customer_info()
RETURNS TRIGGER
SECURITY DEFINER -- RLS'i bypass et
SET search_path = public
AS $$
BEGIN
    -- Profile'ın CUSTOMER rolünde olduğunu kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.profile_id 
        AND role = 'CUSTOMER'
    ) THEN
        RAISE EXCEPTION 'customer_info sadece CUSTOMER rolündeki kullanıcılar için oluşturulabilir';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- job_postings için CUSTOMER rol kontrolü
CREATE OR REPLACE FUNCTION public.check_customer_role_for_job_postings()
RETURNS TRIGGER
SECURITY DEFINER -- RLS'i bypass et
SET search_path = public
AS $$
BEGIN
    -- Profile'ın CUSTOMER rolünde olduğunu kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.customer_id 
        AND role = 'CUSTOMER'
    ) THEN
        RAISE EXCEPTION 'job_postings sadece CUSTOMER rolündeki kullanıcılar için oluşturulabilir';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları ekle
DROP TRIGGER IF EXISTS check_customer_role_customer_info_trigger ON public.customer_info;
CREATE TRIGGER check_customer_role_customer_info_trigger
    BEFORE INSERT ON public.customer_info
    FOR EACH ROW
    EXECUTE FUNCTION public.check_customer_role_for_customer_info();

DROP TRIGGER IF EXISTS check_customer_role_job_postings_trigger ON public.job_postings;
CREATE TRIGGER check_customer_role_job_postings_trigger
    BEFORE INSERT ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_customer_role_for_job_postings();

-- 7. UPDATED_AT TRIGGER FONKSİYONU
-- customer_info ve job_postings için updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- customer_info için trigger
DROP TRIGGER IF EXISTS update_customer_info_updated_at ON public.customer_info;
CREATE TRIGGER update_customer_info_updated_at
    BEFORE UPDATE ON public.customer_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- job_postings için trigger
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER update_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık:
-- 1. 'CUSTOMER' rolü eklendi
-- 2. customer_info tablosu oluşturuldu (firma bilgileri için)
-- 3. job_postings tablosu oluşturuldu (iş ilanları için)
-- 4. RLS politikaları ayarlandı
-- 5. Rol kontrol trigger'ları eklendi (CUSTOMER rolü kontrolü)
-- 6. updated_at trigger'ları eklendi (otomatik güncelleme)
-- =====================================================
