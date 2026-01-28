-- =====================================================
-- EKSİK PROFİLLERİ OLUŞTURMA
-- =====================================================
-- Eğer kullanıcı var ama profil yoksa, bu script profilleri oluşturur
-- =====================================================

-- 1. CONSULTANT profili oluştur (eğer yoksa)
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  'Test Consultant',
  'CONSULTANT',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'consultant@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- 2. ADMIN profili oluştur (eğer yoksa)
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  'Test Admin',
  'ADMIN',
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'admin@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  );

-- =====================================================
-- KONTROL
-- =====================================================
-- check-test-accounts.sql script'ini çalıştırarak
-- profillerin oluşturulduğunu kontrol edin.
-- =====================================================
