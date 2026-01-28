-- =====================================================
-- SITE SETTINGS RLS POLİTİKALARI DÜZELTME
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- RLS hatasını düzeltmek için SECURITY DEFINER fonksiyonu kullanıyoruz

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Admin'ler site ayarlarını görebilir" ON public.site_settings;
DROP POLICY IF EXISTS "Admin'ler site ayarlarını güncelleyebilir" ON public.site_settings;

-- Admin kontrolü için SECURITY DEFINER fonksiyonu oluştur
-- Bu fonksiyon RLS bypass yapar (sonsuz döngü önlenir)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bu fonksiyon sahibinin yetkileriyle çalışır (RLS bypass)
SET search_path = public
AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM public.profiles
    WHERE id = auth.uid();
    
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
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık site_settings tablosuna Admin'ler erişebilir ve güncelleyebilir
-- RLS hatası çözülmüş olmalı
