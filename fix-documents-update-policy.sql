-- Documents tablosu için UPDATE policy ekleme
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Mevcut UPDATE policy'yi kaldır (varsa)
DROP POLICY IF EXISTS "Users can update own documents" ON documents;

-- Kullanıcıların kendi belgelerini güncelleyebilmesi için policy
CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Consultant ve Admin'lerin tüm belgeleri güncelleyebilmesi için policy
DROP POLICY IF EXISTS "Consultants can update all documents" ON documents;

CREATE POLICY "Consultants can update all documents"
  ON documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CONSULTANT')
    )
  );

-- Mevcut policy'leri kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'documents';

SELECT 'Documents UPDATE policy başarıyla eklendi!' as message;
