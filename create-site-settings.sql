-- =====================================================
-- SITE SETTINGS TABLOSU OLUŞTURMA (Logo 404 hatası için)
-- =====================================================
-- Bu dosyayı Supabase Dashboard → SQL Editor'de çalıştırın.
-- 404 sebebi: site_settings tablosu projede yok.
-- Bu script tabloyu oluşturur; Consultant/Admin dahil giriş yapmış
-- herkes logo_url okuyabilir.
-- =====================================================

-- 1. Tablo
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    site_name TEXT DEFAULT 'Point Delivery',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT site_settings_single_row_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

CREATE UNIQUE INDEX IF NOT EXISTS site_settings_single_row ON public.site_settings(id);

-- 2. Varsayılan satır (tek satır mantığı)
INSERT INTO public.site_settings (id, logo_url, site_name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, NULL, 'Point Delivery')
ON CONFLICT (id) DO NOTHING;

-- 3. RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Eski politika isimleri (varsa kaldır)
DROP POLICY IF EXISTS "Admin'ler site ayarlarını görebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını güncelleyebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını ekleyebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Giriş yapmış kullanıcılar site ayarlarını okuyabilir" ON public.site_settings;

-- Giriş yapmış herkes (Consultant, Admin, vb.) logo/site_name okuyabilir
CREATE POLICY "Giriş yapmış kullanıcılar site ayarlarını okuyabilir"
    ON public.site_settings FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Sadece Admin yazabilsin diye is_admin lazım (role::text ile user_role yoksa da çalışır)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role_value TEXT;
BEGIN
    SELECT role::text INTO user_role_value
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN user_role_value = 'ADMIN';
END;
$$;

CREATE POLICY "Admin'ler site ayarlarını güncelleyebilir"
    ON public.site_settings FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admin'ler site ayarlarını ekleyebilir"
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_admin());

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_site_settings_updated_at();

-- =====================================================
-- Tamamlandı. /rest/v1/site_settings?select=logo_url 404 yerine 200 döner.
-- =====================================================
