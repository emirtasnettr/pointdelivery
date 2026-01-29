-- Candidate Info tablosuna documents_enabled kolonu ekleme
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- documents_enabled kolonu ekle (varsayılan false)
ALTER TABLE candidate_info
ADD COLUMN IF NOT EXISTS documents_enabled BOOLEAN DEFAULT FALSE;

-- Açıklama ekle
COMMENT ON COLUMN candidate_info.documents_enabled IS 'Evrak yükleme aktif mi? Consultant tarafından Profil Tamamlansın butonuna basılınca true olur.';

-- Başarılı mesajı
SELECT 'documents_enabled kolonu başarıyla eklendi!' as message;
