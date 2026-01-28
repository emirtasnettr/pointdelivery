-- add-is-active-to-profiles.sql
-- profiles tablosuna is_active kolonu ekler.
-- Supabase SQL Editor'de çalıştırın.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Mevcut kayıtları varsayılan aktif yap
UPDATE public.profiles
SET is_active = true
WHERE is_active IS NULL;

-- İsteğe bağlı: nullable bırakmak yerine NOT NULL + default kullanmak için:
-- ALTER TABLE public.profiles ALTER COLUMN is_active SET NOT NULL;
-- ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT true;
