-- =====================================================
-- PROFİL 500 HATASI DÜZELTMESİ (Consultant kendi profilini okurken)
-- =====================================================
-- Hata: profiles?select=*&id=eq.xxx → 500
-- Sebep: RLS politikaları içinde yine "SELECT ... FROM profiles" var → sonsuz döngü
--        - "Consultant'lar tüm adayları görebilir" → EXISTS(SELECT FROM profiles)
--        - "Admin'ler tüm profilleri görebilir"   → EXISTS(SELECT FROM profiles)
--        - "Middleman'ler adaylarını görebilir"   → EXISTS(SELECT FROM profiles)
--
-- Çözüm: SECURITY DEFINER fonksiyonu + Middleman'da alt sorgu yok.
-- Bu dosyayı Supabase Dashboard → SQL Editor'de çalıştırın.
-- =====================================================

-- 1. Rol kontrolü için fonksiyon (RLS bypass – profiles'a güvenli erişim)
CREATE OR REPLACE FUNCTION public.is_consultant_or_admin()
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
    
    RETURN user_role_value IN ('CONSULTANT', 'ADMIN');
END;
$$;

-- 2. Özyinelemeli / eski politika isimlerini kaldır (idempotent)
DROP POLICY IF EXISTS "Consultant'lar tüm adayları görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Consultant'lar tüm profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin'ler tüm profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Middleman'ler adaylarını görebilir" ON public.profiles;

-- 3. Middleman: profiles içinde SELECT yok, sadece sütun karşılaştırması
CREATE POLICY "Middleman'ler adaylarını görebilir"
    ON public.profiles FOR SELECT
    USING (
        (auth.uid() = id AND role = 'MIDDLEMAN')
        OR
        (middleman_id = auth.uid())
    );

-- 4. Consultant / Admin: fonksiyon kullan (RLS döngüsü yok)
CREATE POLICY "Consultant'lar tüm profilleri görebilir"
    ON public.profiles FOR SELECT
    USING (public.is_consultant_or_admin());

CREATE POLICY "Admin'ler tüm profilleri görebilir"
    ON public.profiles FOR SELECT
    USING (public.is_consultant_or_admin());

-- =====================================================
-- Tamamlandı. Consultant/Admin olarak girişten sonra
-- profil sorgusu 500 yerine 200 dönmeli.
-- =====================================================
