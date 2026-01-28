-- =====================================================
-- TEST HESAPLARI ROL GÜNCELLEME
-- =====================================================
-- Bu script, oluşturulmuş kullanıcıların rollerini günceller
-- 
-- ÖNEMLİ: Önce Supabase Dashboard > Authentication > Users
-- üzerinden kullanıcıları oluşturmalısınız!
-- =====================================================

-- 1. CONSULTANT hesabını güncelle
-- Email: consultant@test.com (değiştirebilirsiniz)
UPDATE public.profiles
SET 
  role = 'CONSULTANT',
  full_name = 'Test Consultant',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'consultant@test.com'
);

-- 2. ADMIN hesabını güncelle
-- Email: admin@test.com (değiştirebilirsiniz)
UPDATE public.profiles
SET 
  role = 'ADMIN',
  full_name = 'Test Admin',
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

-- =====================================================
-- KONTROL SORGUSU
-- =====================================================
-- Aşağıdaki sorguyu çalıştırarak güncellemeleri kontrol edebilirsiniz:

SELECT 
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('consultant@test.com', 'admin@test.com')
ORDER BY p.role;

-- =====================================================
-- EĞER KULLANICI BULUNAMADISSA
-- =====================================================
-- Kullanıcı bulunamadıysa, önce kullanıcıları oluşturmanız gerekir:
-- 1. Supabase Dashboard > Authentication > Users > Add user
-- 2. Email ve şifre girin
-- 3. Email Confirm'u işaretleyin
-- 4. Bu script'i tekrar çalıştırın
-- =====================================================

-- =====================================================
-- ALTERNATIF: FARKLI EMAIL KULLANMAK İSTERSENİZ
-- =====================================================
-- Yukarıdaki 'consultant@test.com' ve 'admin@test.com' 
-- kısımlarını kendi email adreslerinizle değiştirin.
-- =====================================================
