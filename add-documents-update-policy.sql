-- =====================================================
-- Documents Tablosu UPDATE Policy Ekleme
-- =====================================================
-- Adayların kendi belgelerini güncelleyebilmesi için
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Adaylar kendi belgelerini güncelleyebilir (belge değiştirme için)
CREATE POLICY "Adaylar kendi belgelerini güncelleyebilir"
ON public.documents FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
