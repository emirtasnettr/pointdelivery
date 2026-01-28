-- =====================================================
-- SITE SETTINGS RLS POLİTİKALARI DÜZELTME (INSERT/UPDATE)
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Logo yükleme hatasını düzeltmek için

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Admin'ler site ayarlarını görebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını güncelleyebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını ekleyebilir" ON public.site_settings;

-- is_admin() fonksiyonunu güncelle (SECURITY DEFINER ile)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

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

-- Sadece Admin'ler ekleyebilir (UPSERT için)
CREATE POLICY "Admin'ler site ayarlarını ekleyebilir"
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_admin());

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık site_settings tablosu için RLS politikaları düzeltildi
-- Admin'ler logo yükleyebilir ve site ayarlarını güncelleyebilir
