-- Consultant ve Admin'lerin sadece gönderilmiş belgeleri görmesi için RLS policy güncellemesi
-- DRAFT belgeleri consultant'lar göremez

-- Önce mevcut policy'yi kaldır
DROP POLICY IF EXISTS "Consultant ve Admin belgeleri görebilir" ON public.documents;

-- Yeni policy: Sadece DRAFT olmayan belgeleri görebilirler
CREATE POLICY "Consultant ve Admin belgeleri görebilir"
    ON public.documents FOR SELECT
    USING (
        status != 'DRAFT' AND -- DRAFT belgeleri gösterme
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('CONSULTANT', 'ADMIN')
        )
    );
