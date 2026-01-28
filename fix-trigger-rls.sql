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
