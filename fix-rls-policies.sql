-- =====================================================
-- RLS POLİTİKALARI DÜZELTME SCRIPT'İ
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'de çalıştırın
-- Mevcut sorunlu politikaları kaldırıp yenilerini ekler

-- ÖNEMLİ: Önce mevcut politikaları kaldırıyoruz
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini oluşturabilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Middleman'ler adaylarını görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Consultant'lar tüm adayları görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin'ler tüm profilleri görebilir" ON public.profiles;

-- =====================================================
-- YENİ POLİTİKALAR (Sonsuz döngü olmadan)
-- =====================================================

-- 1. Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 2. Kullanıcılar kendi profillerini oluşturabilir
CREATE POLICY "Kullanıcılar kendi profillerini oluşturabilir"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Kullanıcılar kendi profillerini güncelleyebilir (ROL DEĞİŞİKLİĞİ HARİÇ)
-- NOT: Rol değişikliği kontrolü trigger veya uygulama tarafında yapılmalı
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Middleman'ler kendi adaylarını görebilir
-- NOT: Bu politika daha basit - sadece middleman_id kontrolü yapıyor
CREATE POLICY "Middleman'ler adaylarını görebilir"
    ON public.profiles FOR SELECT
    USING (
        -- Kendi profili
        (auth.uid() = id AND role = 'MIDDLEMAN')
        OR
        -- Kendi adayları (middleman_id kontrolü)
        (middleman_id = auth.uid())
    );

-- 5. Consultant ve Admin için SECURITY DEFINER fonksiyonu oluştur
-- DAHA İYİ ÇÖZÜM: Bu fonksiyon RLS bypass yapar (sonsuz döngü önlenir)
CREATE OR REPLACE FUNCTION public.is_consultant_or_admin()
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
    
    RETURN user_role_value IN ('CONSULTANT', 'ADMIN');
END;
$$;

-- 6. Admin ve Consultant politikalarını fonksiyon ile oluştur
-- NOT: Önce mevcut politikaları kaldırıyoruz (eğer varsa)
DROP POLICY IF EXISTS "Consultant'lar tüm adayları görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Consultant'lar tüm profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin'ler tüm profilleri görebilir" ON public.profiles;

-- Consultant'lar tüm profilleri görebilir (fonksiyon ile)
CREATE POLICY "Consultant'lar tüm profilleri görebilir"
    ON public.profiles FOR SELECT
    USING (public.is_consultant_or_admin());

-- Admin'ler her şeyi görebilir (aynı fonksiyon ile - çünkü fonksiyon her ikisini de kontrol ediyor)
CREATE POLICY "Admin'ler tüm profilleri görebilir"
    ON public.profiles FOR SELECT
    USING (public.is_consultant_or_admin());

-- =====================================================
-- ÖNEMLİ NOTLAR:
-- =====================================================
-- 1. Consultant ve Admin politikaları artık SECURITY DEFINER fonksiyonu kullanıyor
--    Bu, RLS politikasını kontrol ederken tekrar RLS'yi tetiklemiyor (sonsuz döngü yok)
-- 
-- 2. Rol değişikliği kontrolü artık sadece uygulama tarafında yapılmalı
--    Veya ayrı bir trigger ile kontrol edilebilir
--
-- 3. Production'da daha güvenli bir yapı için:
--    - JWT token'a rol bilgisi ekleyin
--    - Veya her rol için ayrı fonksiyonlar oluşturun
--
-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
