-- =====================================================
-- BELGE TÜRLERİNİ GÜNCELLEME
-- =====================================================
-- Mevcut belge türlerini CV, POLICE, RESIDENCE, KIMLIK olarak güncelle
-- =====================================================

-- Mevcut belgelerin türlerini güncelle (isteğe bağlı)
-- Eğer eski türler varsa, yeni türlere çevirilebilir
-- UPDATE public.documents 
-- SET document_type = 'CV' 
-- WHERE document_type IN ('cv', 'CV', 'Diploma'); -- Örnek

-- Yeni belge yüklerken kullanılacak türler:
-- 'CV' - Özgeçmiş
-- 'POLICE' - Sabıka Kaydı
-- 'RESIDENCE' - İkametgah
-- 'KIMLIK' - Kimlik Belgesi

-- =====================================================
-- NOT: documents tablosunda document_type TEXT olarak tanımlı
-- Bu yüzden ek bir değişiklik yapmaya gerek yok.
-- Sadece yeni belge yüklerken bu türleri kullanın.
-- =====================================================
