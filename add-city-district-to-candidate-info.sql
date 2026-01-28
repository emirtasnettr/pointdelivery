-- candidate_info tablosuna il (city) ve ilçe (district) alanları ekle

ALTER TABLE public.candidate_info 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Açıklama
COMMENT ON COLUMN public.candidate_info.city IS 'İl (şehir) bilgisi';
COMMENT ON COLUMN public.candidate_info.district IS 'İlçe bilgisi';
