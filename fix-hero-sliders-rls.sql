-- =====================================================
-- HERO SLIDERS RLS POLİTİKALARI DÜZELTME
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- RLS hatasını düzeltmek için

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Herkes aktif sliderları görebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider ekleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider güncelleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider silebilir" ON public.hero_sliders;

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
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık hero_sliders tablosu için RLS politikaları düzeltildi
-- Admin'ler slider ekleyebilir, güncelleyebilir ve silebilir
