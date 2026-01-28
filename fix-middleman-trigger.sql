-- Fix: check_middleman_role trigger fonksiyonunu SECURITY DEFINER olarak değiştir
-- Bu sayede RLS bypass edilir ve trigger içindeki SELECT sorgusu çalışır

CREATE OR REPLACE FUNCTION public.check_middleman_role()
RETURNS TRIGGER 
SECURITY DEFINER -- RLS'i bypass et
SET search_path = public
AS $$
BEGIN
    -- Eğer middleman_id NULL ise veya değişmemişse, kontrol yapma (izinli)
    IF NEW.middleman_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Eğer middleman_id değişmemişse (UPDATE'de), kontrol yapma
    IF TG_OP = 'UPDATE' AND OLD.middleman_id = NEW.middleman_id THEN
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
