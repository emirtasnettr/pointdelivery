-- =====================================================
-- BELGELER SORGUSU DEBUG
-- =====================================================
-- Bu script, consultant'ların belgeleri görüntüleme sorununu debug eder
-- =====================================================

-- 1. Tüm belgeleri kontrol et
SELECT 
  d.id,
  d.file_name,
  d.document_type,
  d.status,
  d.profile_id,
  p.full_name as candidate_name,
  p.role as candidate_role,
  d.created_at
FROM public.documents d
LEFT JOIN public.profiles p ON d.profile_id = p.id
ORDER BY d.created_at DESC;

-- 2. Bekleyen belgeleri kontrol et
SELECT 
  d.id,
  d.file_name,
  d.document_type,
  d.status,
  d.profile_id,
  p.full_name as candidate_name,
  d.created_at
FROM public.documents d
LEFT JOIN public.profiles p ON d.profile_id = p.id
WHERE d.status = 'PENDING'
ORDER BY d.created_at DESC;

-- 3. RLS politikalarını kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY policyname;

-- 4. Consultant rolüne sahip kullanıcıları kontrol et
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'CONSULTANT';

-- =====================================================
-- SORUN TESPİTİ
-- =====================================================
-- 
-- 1. Eğer belgeler görünüyorsa ama RLS hatası varsa:
--    - RLS politikalarını kontrol edin
--    - fix-rls-policies.sql script'ini çalıştırın
--
-- 2. Eğer belgeler görünmüyorsa:
--    - Belge yükleme işleminin başarılı olduğundan emin olun
--    - Documents tablosunu kontrol edin
--
-- 3. Eğer RLS politikası yoksa:
--    - supabase-schema.sql script'indeki RLS politikalarını kontrol edin
-- =====================================================
