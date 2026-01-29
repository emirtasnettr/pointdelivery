-- Debug: Tüm adayların bilgilerini kontrol et
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. auth.users tablosundaki user_metadata bilgilerini göster
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as meta_full_name,
  au.raw_user_meta_data->>'phone' as meta_phone,
  au.raw_user_meta_data->>'city' as meta_city,
  au.raw_user_meta_data->>'district' as meta_district,
  au.raw_user_meta_data->>'role' as meta_role,
  au.created_at
FROM auth.users au
WHERE au.raw_user_meta_data->>'role' = 'CANDIDATE'
ORDER BY au.created_at DESC
LIMIT 10;

-- 2. candidate_info tablosundaki kayıtları göster
SELECT 
  ci.*
FROM candidate_info ci
ORDER BY ci.created_at DESC
LIMIT 10;

-- 3. Her iki tabloyu birleştirerek karşılaştır
SELECT 
  au.id as user_id,
  au.email,
  au.raw_user_meta_data->>'phone' as meta_phone,
  au.raw_user_meta_data->>'city' as meta_city,
  au.raw_user_meta_data->>'district' as meta_district,
  ci.phone as ci_phone,
  ci.city as ci_city,
  ci.district as ci_district,
  CASE WHEN ci.id IS NULL THEN 'YOK' ELSE 'VAR' END as candidate_info_durumu
FROM auth.users au
LEFT JOIN candidate_info ci ON ci.profile_id = au.id
WHERE au.raw_user_meta_data->>'role' = 'CANDIDATE'
ORDER BY au.created_at DESC;
