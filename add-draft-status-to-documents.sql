-- Belgeler tablosuna DRAFT status'u ekle
-- Adaylar belge yüklediğinde DRAFT olacak, gönderilince PENDING olacak

-- Önce mevcut CHECK constraint'i kaldır
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_status_check;

-- Yeni CHECK constraint ekle (DRAFT, PENDING, APPROVED, REJECTED)
ALTER TABLE public.documents 
ADD CONSTRAINT documents_status_check 
CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED'));

-- Mevcut PENDING belgeleri DRAFT yap (opsiyonel - isterseniz mevcut belgeleri PENDING olarak bırakabilirsiniz)
-- UPDATE public.documents SET status = 'DRAFT' WHERE status = 'PENDING';

-- Veya mevcut belgeleri PENDING olarak bırak (zaten gönderilmiş sayılır)
-- Bu durumda yeni yüklenen belgeler DRAFT olacak
