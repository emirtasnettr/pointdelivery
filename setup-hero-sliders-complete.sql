-- =====================================================
-- HERO SLIDERS TABLOSU VE RLS POLİTİKALARI (TAM KURULUM)
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Hem tabloyu oluşturur hem de RLS politikalarını düzeltir

-- =====================================================
-- 1. TABLO OLUŞTURMA
-- =====================================================

-- Hero sliderlar tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.hero_sliders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Display order için index
CREATE INDEX IF NOT EXISTS hero_sliders_display_order_idx ON public.hero_sliders(display_order);
CREATE INDEX IF NOT EXISTS hero_sliders_active_idx ON public.hero_sliders(is_active);

-- =====================================================
-- 2. RLS POLİTİKALARI
-- =====================================================

-- RLS'yi etkinleştir
ALTER TABLE public.hero_sliders ENABLE ROW LEVEL SECURITY;

-- Önce mevcut politikaları kaldır (eğer varsa)
DROP POLICY IF EXISTS "Herkes aktif sliderları görebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider ekleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider güncelleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider silebilir" ON public.hero_sliders;

-- is_admin() fonksiyonunun var olduğundan emin ol
-- (Eğer yoksa site_settings kurulumundan sonra oluşturulmuş olmalı)
-- Önce mevcut fonksiyonu kaldır, sonra yeniden oluştur
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- is_admin fonksiyonunu oluştur
-- SECURITY DEFINER ile RLS bypass yapar
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Herkes aktif sliderları görebilir (public read - authenticated veya anonymous)
CREATE POLICY "Herkes aktif sliderları görebilir"
    ON public.hero_sliders FOR SELECT
    USING (is_active = true);

-- Sadece Admin'ler slider ekleyebilir
CREATE POLICY "Admin'ler slider ekleyebilir"
    ON public.hero_sliders FOR INSERT
    WITH CHECK (public.is_admin());

-- Sadece Admin'ler slider güncelleyebilir
CREATE POLICY "Admin'ler slider güncelleyebilir"
    ON public.hero_sliders FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Sadece Admin'ler slider silebilir
CREATE POLICY "Admin'ler slider silebilir"
    ON public.hero_sliders FOR DELETE
    USING (public.is_admin());

-- =====================================================
-- 3. TRIGGER (Updated_at için)
-- =====================================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_hero_sliders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur (eğer yoksa)
DROP TRIGGER IF EXISTS hero_sliders_updated_at ON public.hero_sliders;
CREATE TRIGGER hero_sliders_updated_at
    BEFORE UPDATE ON public.hero_sliders
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_sliders_updated_at();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık hero_sliders tablosu oluşturuldu ve RLS politikaları aktif
-- Admin'ler slider ekleyebilir, güncelleyebilir ve silebilir
-- Herkes (authenticated ve anonymous) aktif sliderları görebilir
