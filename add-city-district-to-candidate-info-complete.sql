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
