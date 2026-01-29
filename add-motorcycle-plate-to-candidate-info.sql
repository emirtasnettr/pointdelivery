-- Candidate Info tablosuna motorcycle_plate kolonu ekleme
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- motorcycle_plate kolonu ekle
ALTER TABLE candidate_info
ADD COLUMN IF NOT EXISTS motorcycle_plate TEXT DEFAULT NULL;

-- Açıklama ekle
COMMENT ON COLUMN candidate_info.motorcycle_plate IS 'Motosiklet plaka numarası';

-- Başarılı mesajı
SELECT 'motorcycle_plate kolonu başarıyla eklendi!' as message;
