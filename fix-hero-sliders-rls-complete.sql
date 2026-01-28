-- =====================================================
-- HERO SLIDERS RLS POLİTİKALARI - KESİN ÇÖZÜM
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Slider ekleme RLS hatasını kesin olarak düzeltmek için

-- =====================================================
-- 1. ÖNCE TÜM POLİTİKALARI VE FONKSİYONLARI TEMİZLE
-- =====================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Herkes aktif sliderları görebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider ekleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider güncelleyebilir" ON public.hero_sliders;
DROP POLICY IF EXISTS "Admin'ler slider silebilir" ON public.hero_sliders;

-- is_admin() fonksiyonunu tamamen kaldır (CASCADE ile tüm bağımlılıklar)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- =====================================================
-- 2. is_admin() FONKSİYONUNU YENİDEN OLUŞTUR
-- =====================================================
-- SECURITY DEFINER ile RLS bypass yapıyoruz
-- profiles tablosuna erişirken de RLS bypass yapılması için
-- SET search_path = public kullanıyoruz

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_role_value user_role;
    user_id_value UUID;
BEGIN
    -- auth.uid() değerini al
    user_id_value := auth.uid();
    
    -- Eğer kullanıcı giriş yapmamışsa false döndür
    IF user_id_value IS NULL THEN
        RETURN false;
    END IF;
    
    -- SECURITY DEFINER sayesinde RLS bypass yapılır
    -- profiles tablosuna doğrudan erişim (RLS bypass)
    SELECT role INTO user_role_value
    FROM public.profiles
    WHERE id = user_id_value;
    
    -- Eğer profil bulunamazsa false döndür
    IF user_role_value IS NULL THEN
        RETURN false;
    END IF;
    
    -- Admin kontrolü
    RETURN user_role_value = 'ADMIN';
EXCEPTION
    WHEN OTHERS THEN
        -- Herhangi bir hata durumunda false döndür
        RETURN false;
END;
$$;

-- =====================================================
-- 3. RLS POLİTİKALARINI YENİDEN OLUŞTUR
-- =====================================================

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
-- 4. TEST İÇİN (OPSIYONEL)
-- =====================================================
-- Aşağıdaki sorguyu çalıştırarak is_admin() fonksiyonunu test edebilirsiniz:
-- SELECT public.is_admin();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık hero_sliders tablosu için RLS politikaları düzeltildi
-- Admin'ler slider ekleyebilir, güncelleyebilir ve silebilir
-- 
-- NOT: Eğer hala hata alırsanız:
-- 1. Supabase Dashboard > Authentication > Policies bölümünden
--    hero_sliders tablosunun RLS'sinin aktif olduğundan emin olun
-- 2. Kendi kullanıcınızın ADMIN rolüne sahip olduğundan emin olun
-- 3. Supabase'de oturumunuzu kapatıp tekrar giriş yapın
-- 4. .env.local dosyasında SUPABASE_SERVICE_ROLE_KEY'in tanımlı olduğundan emin olun
-- 5. Development server'ı yeniden başlatın (npm run dev)
