-- =====================================================
-- SITE SETTINGS TABLOSU VE RLS POLİTİKALARI (TAM KURULUM)
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Hem tabloyu oluşturur hem de RLS politikalarını düzeltir

-- =====================================================
-- 1. TABLO OLUŞTURMA
-- =====================================================

-- Site ayarları tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_url TEXT,
    site_name TEXT DEFAULT 'JobulAI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Tek satır garantisi için unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_single_row ON public.site_settings(id);

-- Varsayılan kaydı oluştur
INSERT INTO public.site_settings (id, logo_url, site_name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, NULL, 'JobulAI')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. RLS POLİTİKALARI
-- =====================================================

-- RLS'yi etkinleştir
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Önce mevcut politikaları kaldır (eğer varsa)
DROP POLICY IF EXISTS "Admin'ler site ayarlarını görebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını güncelleyebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını ekleyebilir" ON public.site_settings;

-- Admin kontrolü için SECURITY DEFINER fonksiyonu oluştur
-- Bu fonksiyon RLS bypass yapar (sonsuz döngü önlenir)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bu fonksiyon sahibinin yetkileriyle çalışır (RLS bypass)
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- SECURITY DEFINER sayesinde RLS bypass yapılır
    SELECT role INTO user_role_value
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Eğer profil bulunamazsa false döndür
    IF user_role_value IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN user_role_value = 'ADMIN';
END;
$$;

-- Yeni RLS politikaları (fonksiyon ile)
-- Sadece Admin'ler görebilir
CREATE POLICY "Admin'ler site ayarlarını görebilir"
    ON public.site_settings FOR SELECT
    USING (public.is_admin());

-- Sadece Admin'ler güncelleyebilir
CREATE POLICY "Admin'ler site ayarlarını güncelleyebilir"
    ON public.site_settings FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Sadece Admin'ler ekleyebilir (eğer kayıt yoksa)
CREATE POLICY "Admin'ler site ayarlarını ekleyebilir"
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_admin());

-- =====================================================
-- 3. TRIGGER (Updated_at için)
-- =====================================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık site_settings tablosu oluşturuldu ve RLS politikaları aktif
-- Admin'ler logo yükleyebilir ve site ayarlarını yönetebilir
