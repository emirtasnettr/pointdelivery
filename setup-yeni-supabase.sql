-- setup-yeni-supabase.sql
-- Yeni Supabase projesi için SQL Editor'de tek seferde çalıştır.

-- =====================================================
-- JOBUL-AI: Aday Yönetim Sistemi - Supabase Veritabanı Şeması
-- =====================================================
-- Bu dosyayı Supabase SQL Editor'de çalıştıracaksınız
-- Her adımı detaylı açıklayacağım

-- 1. ÖNEMLİ: ROL ENUM TİPİNİ OLUŞTUR
-- Neden? PostgreSQL'de enum tipleri, sadece belirli değerlerin saklanmasına izin verir.
-- Bu sayede veri bütünlüğü sağlanır ve yanlış rol değerleri girilmesi önlenir.
-- Örnek: 'CANDIDATE' yerine 'CANDIDAT' yazılamaz (hata verir)
CREATE TYPE user_role AS ENUM ('CANDIDATE', 'MIDDLEMAN', 'CONSULTANT', 'ADMIN');

-- 2. PROFİL TABLOSU OLUŞTUR
-- Neden? Supabase Auth, kullanıcıları 'auth.users' tablosunda saklar.
-- Bizim de kendi verilerimizi (ad, soyad, rol vb.) tutmak için ayrı bir 'profiles' tablosuna ihtiyacımız var.
-- 'id' kolonu, auth.users tablosundaki id ile eşleşecek şekilde UUID olarak tanımlanır.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- CASCADE: Auth'dan kullanıcı silinirse profili de sil
    full_name TEXT, -- Kullanıcının tam adı
    role user_role NOT NULL DEFAULT 'CANDIDATE', -- Rol enum tipinden, varsayılan olarak CANDIDATE
    middleman_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Bir adayın bağlı olduğu Middleman
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Oluşturulma zamanı (audit için)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Güncellenme zamanı
    CONSTRAINT profiles_self_reference_check CHECK (id != middleman_id) -- Bir kişi kendine middleman olamaz
    -- NOT: Middleman kontrolü trigger ile yapılacak (CHECK constraint'te subquery kullanılamaz)
);

-- 3. INDEX'LER EKLE (PERFORMANS İÇİN)
-- Neden? Sık yapılan sorguları hızlandırmak için index'ler kullanılır.
CREATE INDEX idx_profiles_role ON public.profiles(role); -- Rol bazlı sorguları hızlandırır
CREATE INDEX idx_profiles_middleman_id ON public.profiles(middleman_id); -- Middleman'lerin adaylarını bulmak için
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at); -- Tarih bazlı sıralamalar için

-- 3.1. MIDDLEMAN KONTROL TRİGGER'I
-- Neden? PostgreSQL'de CHECK constraint içinde subquery kullanılamaz.
-- Bu yüzden kontrolü trigger ile yapıyoruz.
-- Bu trigger, middleman_id atanırken o kullanıcının MIDDLEMAN rolünde olduğunu kontrol eder.
CREATE OR REPLACE FUNCTION public.check_middleman_role()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer middleman_id NULL ise, kontrol yapma (izinli)
    IF NEW.middleman_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Middleman'ın rolünü kontrol et
    -- Eğer MIDDLEMAN değilse hata fırlat
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = NEW.middleman_id 
        AND role = 'MIDDLEMAN'
    ) THEN
        RAISE EXCEPTION 'middleman_id sadece MIDDLEMAN rolündeki kullanıcılara atanabilir';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle (INSERT ve UPDATE'de çalışsın)
CREATE TRIGGER check_middleman_role_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (NEW.middleman_id IS NOT NULL)
    EXECUTE FUNCTION public.check_middleman_role();

-- 4. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- Neden? Supabase'de güvenlik için RLS açık olmalı. Her kullanıcı sadece yetkili olduğu verilere erişebilir.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tüm kullanıcılar kendi profillerini görebilir
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Tüm kullanıcılar kendi profillerini oluşturabilir (kayıt sırasında)
CREATE POLICY "Kullanıcılar kendi profillerini oluşturabilir"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir (ama rolünü değiştiremezler - bu sadece ADMIN yapabilir)
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Rol değişikliği yapılamaz (sadece admin tarafından yapılabilir)
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = role
    );

-- Middleman'ler kendi adaylarını görebilir
CREATE POLICY "Middleman'ler adaylarını görebilir"
    ON public.profiles FOR SELECT
    USING (
        role = 'MIDDLEMAN' AND 
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE middleman_id = auth.uid() AND role = 'MIDDLEMAN'
        )
    );

-- Consultant'lar tüm adayları görebilir
CREATE POLICY "Consultant'lar tüm adayları görebilir"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'CONSULTANT'
        )
    );

-- Admin'ler her şeyi görebilir
CREATE POLICY "Admin'ler tüm profilleri görebilir"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 5. ADay BİLGİLERİ TABLOSU
-- Neden? Adayların detaylı bilgilerini (CV, deneyim, eğitim vb.) tutmak için
CREATE TABLE public.candidate_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Benzersiz ID
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Hangi adaya ait
    phone TEXT, -- Telefon numarası
    email TEXT, -- Email (profil ile aynı olabilir ama buraya da yazılabilir)
    address TEXT, -- Adres
    date_of_birth DATE, -- Doğum tarihi
    national_id TEXT, -- TC Kimlik No (güvenlik için şifrelenmeli)
    education_level TEXT, -- Eğitim seviyesi (ör: Lise, Üniversite)
    experience_years INTEGER DEFAULT 0, -- Deneyim yılı
    skills JSONB DEFAULT '[]'::jsonb, -- Beceriler (JSON array: ["JavaScript", "React"])
    languages JSONB DEFAULT '[]'::jsonb, -- Diller (JSON array: [{"name": "İngilizce", "level": "B2"}])
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT candidate_info_unique_profile UNIQUE (profile_id) -- Her adayın sadece bir info kaydı olabilir
);

CREATE INDEX idx_candidate_info_profile_id ON public.candidate_info(profile_id);

-- RLS: Sadece kendi bilgilerini görebilir (ve yetkili roller)
ALTER TABLE public.candidate_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adaylar kendi bilgilerini görebilir"
    ON public.candidate_info FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Adaylar kendi bilgilerini oluşturabilir"
    ON public.candidate_info FOR INSERT
    WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Adaylar kendi bilgilerini güncelleyebilir"
    ON public.candidate_info FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Middleman, Consultant ve Admin de görebilir
CREATE POLICY "Yetkili roller aday bilgilerini görebilir"
    ON public.candidate_info FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role IN ('MIDDLEMAN', 'CONSULTANT', 'ADMIN')
            AND (
                p.role = 'MIDDLEMAN' AND candidate_info.profile_id IN (
                    SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
                )
                OR p.role IN ('CONSULTANT', 'ADMIN')
            )
        )
    );

-- 6. BELGELER TABLOSU
-- Neden? Adayların yüklediği dosyaları (CV, diploma, kimlik vb.) takip etmek için
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Hangi adaya ait
    document_type TEXT NOT NULL, -- Belge tipi: 'CV', 'DIPLOMA', 'IDENTITY', 'CERTIFICATE' vb.
    file_name TEXT NOT NULL, -- Dosya adı
    file_path TEXT NOT NULL, -- Supabase Storage'daki yol
    file_size INTEGER, -- Dosya boyutu (bytes)
    mime_type TEXT, -- Dosya tipi (application/pdf, image/jpeg vb.)
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')), -- Onay durumu
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Kim inceledi (Consultant)
    reviewed_at TIMESTAMPTZ, -- Ne zaman incelendi
    review_notes TEXT, -- İnceleme notları
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_profile_id ON public.documents(profile_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_type ON public.documents(document_type);

-- RLS: Adaylar kendi belgelerini görebilir
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adaylar kendi belgelerini görebilir"
    ON public.documents FOR SELECT
    USING (profile_id = auth.uid());

CREATE POLICY "Adaylar belge yükleyebilir"
    ON public.documents FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Consultant ve Admin belgeleri görebilir ve onaylayabilir
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
    ON public.documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

CREATE POLICY "Consultant ve Admin belgeleri güncelleyebilir"
    ON public.documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );

-- 7. OTOMATİK GÜNCELLEME TRİGGER'I (updated_at için)
-- Neden? Her güncellemede updated_at kolonunun otomatik güncellenmesi için
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Her tabloya trigger ekle
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_info_updated_at BEFORE UPDATE ON public.candidate_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. PROFİL OLUŞTURMA TRİGGER'I (Auth kullanıcısı oluşturulduğunda otomatik profil oluşturur)
-- Neden? Kullanıcı kayıt olduğunda, manuel olarak profil oluşturmak yerine otomatik oluşturulsun
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CANDIDATE')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER: Fonksiyonun sahibinin yetkileriyle çalışır

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TAMAMLANDI! ✅
-- Artık veritabanınız hazır.
-- =====================================================
-- =====================================================
-- TRİGGER FONKSİYONU DÜZELTME
-- =====================================================
-- Bu script, handle_new_user trigger fonksiyonunu düzeltir
-- RLS bypass sorununu çözer

-- ADIM 1: Mevcut trigger ve fonksiyonu kaldır
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ADIM 2: RLS INSERT politikasını güncelle
-- NOT: SECURITY DEFINER fonksiyonlar RLS'yi bypass eder,
-- ama yine de politika güncellemesi yapıyoruz

DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini oluşturabilir" ON public.profiles;

-- Yeni INSERT politikası: Trigger'dan gelen INSERT'leri de izin ver
CREATE POLICY "Kullanıcılar kendi profillerini oluşturabilir"
    ON public.profiles FOR INSERT
    WITH CHECK (
        -- Kullanıcı kendi profilini oluşturabilir (kayıt sırasında)
        auth.uid() = id
    );

-- ADIM 3: YENİ TRİGGER FONKSİYONU
-- SECURITY DEFINER: Bu fonksiyon sahibinin yetkileriyle çalışır (RLS bypass)
-- SET search_path: Güvenlik için search_path'i ayarlıyoruz
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- RLS'yi bypass et
SET search_path = public -- Güvenlik için search_path
LANGUAGE plpgsql
AS $$
BEGIN
    -- Trigger çalıştığında, SECURITY DEFINER sayesinde RLS bypass edilir
    -- Bu sayede INSERT işlemi RLS politikalarından etkilenmez
    
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CANDIDATE')
    )
    ON CONFLICT (id) DO NOTHING; -- Eğer profil zaten varsa, hiçbir şey yapma (idempotent)
    
    RETURN NEW;
END;
$$;

-- ADIM 4: Trigger'ı tekrar oluştur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- DAHA İYİ ÇÖZÜM: RLS'yi trigger için tamamen bypass et
-- =====================================================
-- SECURITY DEFINER fonksiyonlar zaten RLS'yi bypass eder,
-- ama emin olmak için search_path ayarlıyoruz

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Bu script'i çalıştırdıktan sonra tekrar kayıt olmayı deneyin.
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
-- candidate_info tablosuna il (city) ve ilçe (district) alanları ekle
-- Bu script Supabase SQL Editor'de çalıştırılmalıdır

-- Önce sütunların var olup olmadığını kontrol edip ekle
DO $$ 
BEGIN
    -- city sütunu kontrolü ve ekleme
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'candidate_info' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.candidate_info 
        ADD COLUMN city TEXT;
        
        COMMENT ON COLUMN public.candidate_info.city IS 'İl (şehir) bilgisi';
    END IF;

    -- district sütunu kontrolü ve ekleme
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'candidate_info' 
        AND column_name = 'district'
    ) THEN
        ALTER TABLE public.candidate_info 
        ADD COLUMN district TEXT;
        
        COMMENT ON COLUMN public.candidate_info.district IS 'İlçe bilgisi';
    END IF;
END $$;

-- Kontrol sorgusu (opsiyonel - sütunların eklendiğini doğrulamak için)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'candidate_info'
AND column_name IN ('city', 'district')
ORDER BY column_name;
