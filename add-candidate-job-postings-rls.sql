-- =====================================================
-- ADAYLARIN İŞ İLANLARINI GÖREBİLMESİ İÇİN RLS POLİTİKASI
-- =====================================================
-- Adaylar, kendilerine atanmış iş ilanlarını görebilmeli
-- =====================================================

-- Adaylar kendilerine atanmış iş ilanlarını görebilir
DROP POLICY IF EXISTS "Adaylar kendilerine atanmış iş ilanlarını görebilir" ON public.job_postings;

CREATE POLICY "Adaylar kendilerine atanmış iş ilanlarını görebilir"
    ON public.job_postings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'CANDIDATE'
        )
        AND EXISTS (
            SELECT 1 FROM public.job_assignments
            WHERE job_assignments.job_posting_id = job_postings.id
            AND job_assignments.candidate_id = auth.uid()
        )
    );

-- =====================================================
-- TAMAMLANDI! ✅
-- =====================================================
-- Artık adaylar, kendilerine atanmış iş ilanlarını görebilecek
-- =====================================================
