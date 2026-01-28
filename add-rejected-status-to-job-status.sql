-- =====================================================
-- JOB_STATUS ENUM'UNA REJECTED DEĞERİ EKLEME
-- =====================================================
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- İş ilanı reddetme özelliği için gerekli
-- =====================================================

-- REJECTED değerini job_status enum'ına ekle
-- NOT: PostgreSQL'de enum'a yeni değer eklemek için ALTER TYPE kullanılır
-- Ancak eğer enum zaten var ise ve içinde REJECTED yok ise ekler
DO $$ 
BEGIN
    -- REJECTED değeri zaten var mı kontrol et
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'REJECTED'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'job_status')
    ) THEN
        -- REJECTED değerini ekle
        ALTER TYPE job_status ADD VALUE 'REJECTED';
    END IF;
END $$;

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık job_status enum'unda REJECTED değeri var
-- İş ilanları reddedilebilir
-- =====================================================
