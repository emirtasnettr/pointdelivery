-- =====================================================
-- SITE SETTINGS RLS POLİTİKALARI - KESİN ÇÖZÜM
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- Logo yükleme hatasını kesin olarak düzeltmek için

-- =====================================================
-- 1. ÖNCE TÜM POLİTİKALARI VE FONKSİYONLARI TEMİZLE
-- =====================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Admin'ler site ayarlarını görebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını güncelleyebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını ekleyebilir" ON public.site_settings;

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

-- Fonksiyonun sahibini postgres yap (gerekirse)
-- ALTER FUNCTION public.is_admin() OWNER TO postgres;

-- =====================================================
-- 3. RLS POLİTİKALARINI YENİDEN OLUŞTUR
-- =====================================================

-- Sadece Admin'ler görebilir
CREATE POLICY "Admin'ler site ayarlarını görebilir"
    ON public.site_settings FOR SELECT
    USING (public.is_admin());

-- Sadece Admin'ler güncelleyebilir
CREATE POLICY "Admin'ler site ayarlarını güncelleyebilir"
    ON public.site_settings FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Sadece Admin'ler ekleyebilir
CREATE POLICY "Admin'ler site ayarlarını ekleyebilir"
    ON public.site_settings FOR INSERT
    WITH CHECK (public.is_admin());

-- =====================================================
-- 4. TEST İÇİN (OPSIYONEL)
-- =====================================================
-- Aşağıdaki sorguyu çalıştırarak is_admin() fonksiyonunu test edebilirsiniz:
-- SELECT public.is_admin();

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık site_settings tablosu için RLS politikaları düzeltildi
-- Admin'ler logo yükleyebilir ve site ayarlarını güncelleyebilir
-- 
-- NOT: Eğer hala hata alırsanız:
-- 1. Supabase Dashboard > Authentication > Policies bölümünden
--    site_settings tablosunun RLS'sinin aktif olduğundan emin olun
-- 2. Kendi kullanıcınızın ADMIN rolüne sahip olduğundan emin olun
-- 3. Supabase'de oturumunuzu kapatıp tekrar giriş yapın
