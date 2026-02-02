-- =====================================================
-- KVKK ve Diğer Onaylar için Consent Logs Tablosu
-- =====================================================
-- Bu tablo, kullanıcıların verdiği onayları yasal delil
-- olarak saklamak için kullanılır.
-- =====================================================

-- Onay türleri için ENUM oluştur
DO $$ BEGIN
    CREATE TYPE consent_type AS ENUM (
        'KVKK',                    -- KVKK Aydınlatma Metni onayı
        'SMS_EMAIL_MARKETING',     -- SMS ve E-posta pazarlama onayı
        'PRIVACY_POLICY',          -- Gizlilik Politikası onayı
        'TERMS_OF_SERVICE',        -- Kullanım Koşulları onayı
        'COOKIE_POLICY'            -- Çerez Politikası onayı
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Consent Logs Tablosu
CREATE TABLE IF NOT EXISTS consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Kullanıcı bilgisi
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,  -- Email'i de saklıyoruz çünkü user silinebilir
    
    -- Onay bilgileri
    consent_type consent_type NOT NULL,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    consent_text_version VARCHAR(50) NOT NULL,  -- Örn: "v1.0", "2024-01", "2026-02-02"
    
    -- Yasal delil için gerekli bilgiler
    ip_address VARCHAR(45),           -- IPv4 veya IPv6
    user_agent TEXT,                   -- Tarayıcı/cihaz bilgisi
    
    -- Ek bilgiler
    metadata JSONB DEFAULT '{}',       -- Ek bilgiler (opsiyonel)
    
    -- Zaman damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- İndeksler için
    CONSTRAINT consent_logs_unique_initial UNIQUE (user_id, consent_type, created_at)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_consent_type ON consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created_at ON consent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_email ON consent_logs(user_email);

-- RLS (Row Level Security) Politikaları
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Önce mevcut politikaları sil (varsa)
DROP POLICY IF EXISTS "Users can view own consent logs" ON consent_logs;
DROP POLICY IF EXISTS "Authenticated users can insert consent logs" ON consent_logs;
DROP POLICY IF EXISTS "Only Admins can view all consent logs" ON consent_logs;
DROP POLICY IF EXISTS "Admins and Consultants can view all consent logs" ON consent_logs;

-- Kullanıcılar sadece kendi onay kayıtlarını görebilir
CREATE POLICY "Users can view own consent logs"
    ON consent_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Sadece authenticated kullanıcılar yeni onay kaydı ekleyebilir
CREATE POLICY "Authenticated users can insert consent logs"
    ON consent_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Sadece Admin tüm onay kayıtlarını görebilir (yasal denetim için)
CREATE POLICY "Only Admins can view all consent logs"
    ON consent_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Onay kayıtları silinemez ve güncellenemez (yasal gereklilik)
-- UPDATE ve DELETE politikaları yok = bu işlemler yapılamaz

-- =====================================================
-- Yorum: Bu tabloya eklenen kayıtlar SİLİNEMEZ ve
-- GÜNCELLENEMEZ. Bu, yasal delil niteliğini korumak
-- için gereklidir. Onay geri çekilirse, yeni bir
-- kayıt eklenir (consent_given: false).
-- =====================================================

-- Örnek veri yapısı:
-- INSERT INTO consent_logs (user_id, user_email, consent_type, consent_given, consent_text_version, ip_address, user_agent)
-- VALUES (
--     'user-uuid-here',
--     'user@example.com',
--     'KVKK',
--     true,
--     'v1.0-2026-02-02',
--     '192.168.1.1',
--     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...'
-- );

COMMENT ON TABLE consent_logs IS 'KVKK ve diğer yasal onayların kaydedildiği tablo. Kayıtlar silinemez ve güncellenemez.';
COMMENT ON COLUMN consent_logs.consent_text_version IS 'Onaylanan metnin versiyonu. Metin değiştiğinde yeni versiyon numarası kullanılmalı.';
COMMENT ON COLUMN consent_logs.ip_address IS 'Kullanıcının onay verdiği andaki IP adresi (yasal delil).';
COMMENT ON COLUMN consent_logs.user_agent IS 'Kullanıcının tarayıcı/cihaz bilgisi (yasal delil).';
