-- Documents Enabled özelliği için tüm gerekli düzeltmeler
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- 1. documents_enabled kolonu ekle (yoksa)
ALTER TABLE candidate_info
ADD COLUMN IF NOT EXISTS documents_enabled BOOLEAN DEFAULT FALSE;

-- 1b. rider_id kolonu ekle (yoksa)
ALTER TABLE candidate_info
ADD COLUMN IF NOT EXISTS rider_id TEXT DEFAULT NULL;

COMMENT ON COLUMN candidate_info.rider_id IS 'Rider ID - Consultant tarafından evraklar aktif edilirken girilir';

-- 2. Consultant ve Admin'lerin candidate_info tablosunu güncelleyebilmesi için RLS policy
-- Önce mevcut policy'yi kaldır (hata vermemesi için)
DROP POLICY IF EXISTS "Consultants can update candidate info" ON candidate_info;

-- Yeni policy ekle
CREATE POLICY "Consultants can update candidate info"
  ON candidate_info
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CONSULTANT')
    )
  );

-- 3. Consultant ve Admin'lerin candidate_info tablosunu okuyabilmesi için RLS policy
DROP POLICY IF EXISTS "Consultants can view all candidate info" ON candidate_info;

CREATE POLICY "Consultants can view all candidate info"
  ON candidate_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CONSULTANT')
    )
  );

-- 4. candidate_info kaydı olmayan adaylar için kayıt oluştur
INSERT INTO candidate_info (profile_id, documents_enabled)
SELECT p.id, FALSE
FROM profiles p
LEFT JOIN candidate_info ci ON ci.profile_id = p.id
WHERE p.role = 'CANDIDATE' AND ci.id IS NULL;

-- Başarılı mesajı
SELECT 'documents_enabled özelliği başarıyla ayarlandı!' as message;
