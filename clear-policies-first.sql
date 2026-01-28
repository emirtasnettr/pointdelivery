-- =====================================================
-- ÖNCE TÜM POLİTİKALARI KALDIR
-- =====================================================
-- Bu script'i ÖNCE çalıştırın, sonra fix-rls-policies.sql'i çalıştırın

DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini oluşturabilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Middleman'ler adaylarını görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Consultant'lar tüm adayları görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Consultant'lar tüm profilleri görebilir" ON public.profiles;
DROP POLICY IF EXISTS "Admin'ler tüm profilleri görebilir" ON public.profiles;

-- Fonksiyonu da kaldır (eğer varsa)
DROP FUNCTION IF EXISTS public.is_consultant_or_admin();

-- =====================================================
-- TAMAMLANDI! ✅
-- Şimdi fix-rls-policies.sql dosyasını çalıştırabilirsiniz
-- =====================================================
