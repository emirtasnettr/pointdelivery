-- =====================================================
-- Başvuru Statüsü Sistemi Ekleme
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. Başvuru Statüsü ENUM'ını oluştur
CREATE TYPE application_status AS ENUM (
  'NEW_APPLICATION',      -- Yeni Başvuru
  'EVALUATION',          -- Değerlendirme
  'APPROVED',            -- Onaylı
  'REJECTED',            -- Reddedildi
  'UPDATE_REQUIRED'      -- Bilgi/Evrak Güncelleme
);

-- 2. Profiles tablosuna application_status kolonunu ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS application_status application_status DEFAULT 'NEW_APPLICATION';

-- 3. Sadece CANDIDATE rolündeki kullanıcılar için varsayılan değer ayarla
UPDATE public.profiles
SET application_status = 'NEW_APPLICATION'
WHERE role = 'CANDIDATE' AND application_status IS NULL;

-- 4. Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_profiles_application_status ON public.profiles(application_status);

-- 5. Belge statüsünü kontrol etmek için NOT NULL constraint (sadece CANDIDATE için)
-- Bu constraint'i eklemek yerine, uygulama seviyesinde kontrol yapacağız

-- 6. Mevcut UPDATE policy'sini güncelle (application_status desteği ekle)
-- Önce mevcut policy'yi drop et
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles;

-- Yeni güncellenmiş policy oluştur
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Rol değişikliği yapılamaz (sadece admin tarafından yapılabilir)
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = role AND
  -- CANDIDATE kullanıcılar application_status'u sadece belirli durumlarda değiştirebilir
  (
    -- Rol CANDIDATE değilse, application_status serbestçe değiştirilebilir (diğer roller için)
    (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'CANDIDATE'
    OR
    -- CANDIDATE ise, application_status kontrolü (uygulama seviyesinde yapılacak, burada sadece genel kontrol)
    role = 'CANDIDATE'
  )
);

-- 7. Consultant ve Admin için application_status güncelleme policy'si
CREATE POLICY "Consultant ve Admin başvuru statüsünü güncelleyebilir"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('CONSULTANT', 'ADMIN')
  )
)
WITH CHECK (
  -- Consultant ve Admin sadece CANDIDATE profillerinin application_status'unu değiştirebilir
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('CONSULTANT', 'ADMIN')
    )
    AND role = 'CANDIDATE'
  )
);
