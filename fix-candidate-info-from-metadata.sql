-- Candidate Info tablosundaki eksik bilgileri user_metadata'dan tamamla
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Önce mevcut durumu görelim
SELECT 
  ci.profile_id,
  p.full_name,
  ci.city as current_city,
  ci.district as current_district,
  ci.phone as current_phone,
  au.raw_user_meta_data->>'city' as metadata_city,
  au.raw_user_meta_data->>'district' as metadata_district,
  au.raw_user_meta_data->>'phone' as metadata_phone
FROM candidate_info ci
LEFT JOIN profiles p ON p.id = ci.profile_id
LEFT JOIN auth.users au ON au.id = ci.profile_id
WHERE ci.city IS NULL OR ci.district IS NULL OR ci.phone IS NULL;

-- Eksik city bilgilerini güncelle
UPDATE candidate_info ci
SET city = au.raw_user_meta_data->>'city'
FROM auth.users au
WHERE ci.profile_id = au.id
  AND ci.city IS NULL
  AND au.raw_user_meta_data->>'city' IS NOT NULL;

-- Eksik district bilgilerini güncelle
UPDATE candidate_info ci
SET district = au.raw_user_meta_data->>'district'
FROM auth.users au
WHERE ci.profile_id = au.id
  AND ci.district IS NULL
  AND au.raw_user_meta_data->>'district' IS NOT NULL;

-- Eksik phone bilgilerini güncelle
UPDATE candidate_info ci
SET phone = au.raw_user_meta_data->>'phone'
FROM auth.users au
WHERE ci.profile_id = au.id
  AND ci.phone IS NULL
  AND au.raw_user_meta_data->>'phone' IS NOT NULL;

-- Eksik email bilgilerini güncelle
UPDATE candidate_info ci
SET email = au.email
FROM auth.users au
WHERE ci.profile_id = au.id
  AND ci.email IS NULL
  AND au.email IS NOT NULL;

-- candidate_info kaydı olmayan kullanıcılar için yeni kayıt oluştur
INSERT INTO candidate_info (profile_id, phone, email, city, district)
SELECT 
  p.id as profile_id,
  au.raw_user_meta_data->>'phone' as phone,
  au.email as email,
  au.raw_user_meta_data->>'city' as city,
  au.raw_user_meta_data->>'district' as district
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
LEFT JOIN candidate_info ci ON ci.profile_id = p.id
WHERE p.role = 'CANDIDATE'
  AND ci.id IS NULL;

-- Sonucu kontrol et
SELECT 
  ci.profile_id,
  p.full_name,
  ci.city,
  ci.district,
  ci.phone,
  ci.email
FROM candidate_info ci
LEFT JOIN profiles p ON p.id = ci.profile_id
ORDER BY ci.created_at DESC;
