-- Candidate Info tablosuna IBAN kolonu ekleme
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- IBAN kolonu ekle
ALTER TABLE candidate_info
ADD COLUMN IF NOT EXISTS iban TEXT DEFAULT NULL;

-- Açıklama ekle
COMMENT ON COLUMN candidate_info.iban IS 'Aday banka IBAN bilgisi';

-- Başarılı mesajı
SELECT 'IBAN kolonu başarıyla eklendi!' as message;
