-- Vehicle Info tablosu oluşturma
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın

-- Tablo oluştur
CREATE TABLE IF NOT EXISTS vehicle_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type TEXT DEFAULT NULL,
  vehicle_subtype TEXT DEFAULT NULL,
  has_company BOOLEAN DEFAULT NULL,
  has_p1 BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_vehicle_info_profile_id ON vehicle_info(profile_id);

-- RLS politikaları
ALTER TABLE vehicle_info ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi verilerini okuyabilir
CREATE POLICY "Users can view own vehicle info"
  ON vehicle_info
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Kullanıcılar kendi verilerini ekleyebilir
CREATE POLICY "Users can insert own vehicle info"
  ON vehicle_info
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Kullanıcılar kendi verilerini güncelleyebilir
CREATE POLICY "Users can update own vehicle info"
  ON vehicle_info
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Admin ve Consultant tüm verileri okuyabilir
CREATE POLICY "Admins and Consultants can view all vehicle info"
  ON vehicle_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CONSULTANT')
    )
  );

-- Açıklamalar
COMMENT ON TABLE vehicle_info IS 'Aday araç ve şirket bilgileri';
COMMENT ON COLUMN vehicle_info.vehicle_type IS 'Araç tipi (MOTOSİKLET, OTOMOBİL vb.)';
COMMENT ON COLUMN vehicle_info.vehicle_subtype IS 'Araç alt tipi';
COMMENT ON COLUMN vehicle_info.has_company IS 'Şirketi var mı?';
COMMENT ON COLUMN vehicle_info.has_p1 IS 'P1 belgesi var mı?';

-- Başarılı mesajı
SELECT 'vehicle_info tablosu başarıyla oluşturuldu!' as message;
