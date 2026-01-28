-- =====================================================
-- TEST HESAPLARI KONTROL SORGUSU
-- =====================================================
-- Bu script, test hesaplarının durumunu kontrol eder
-- =====================================================

-- 1. Auth.users tablosunda kullanıcıları kontrol et
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email IN ('consultant@test.com', 'admin@test.com')
ORDER BY email;

-- 2. Profiles tablosunda profilleri kontrol et
SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('consultant@test.com', 'admin@test.com')
ORDER BY p.role;

-- =====================================================
-- SORUN TESPİTİ
-- =====================================================
-- 
-- EĞER SONUÇ BOŞSA (kullanıcı yok):
-- 1. Supabase Dashboard > Authentication > Users
-- 2. "Add user" butonuna tıklayın
-- 3. Email ve şifre girin
-- 4. "Email Confirm" işaretleyin
-- 5. "Create user" butonuna tıklayın
--
-- EĞER KULLANICI VAR AMA PROFİL YOK:
-- Profil kaydı trigger tarafından otomatik oluşturulmalı.
-- Eğer oluşmadıysa, aşağıdaki script'i çalıştırın.
--
-- EĞER PROFİL VAR AMA ROL YANLIŞ:
-- update-test-accounts.sql script'ini çalıştırın.
-- =====================================================
