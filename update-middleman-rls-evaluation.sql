-- Middleman'lerin EVALUATION, APPROVED, REJECTED statüsündeki adayları güncelleyememesi için RLS politikaları güncellemesi

-- 1. Candidate_info UPDATE policy'sini güncelle (EVALUATION, APPROVED, REJECTED statüsünde güncelleme yapılamaz)
DROP POLICY IF EXISTS "Middleman'ler aday bilgilerini güncelleyebilir" ON public.candidate_info;

CREATE POLICY "Middleman'ler aday bilgilerini güncelleyebilir"
ON public.candidate_info FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
);

-- 2. Candidate_info INSERT policy'sini güncelle (EVALUATION, APPROVED, REJECTED statüsünde ekleme yapılamaz)
DROP POLICY IF EXISTS "Middleman'ler aday bilgilerini oluşturabilir" ON public.candidate_info;

CREATE POLICY "Middleman'ler aday bilgilerini oluşturabilir"
ON public.candidate_info FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
);

-- 3. Documents INSERT policy'sini güncelle (EVALUATION, APPROVED, REJECTED statüsünde belge yüklenemez)
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini yükleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini yükleyebilir"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
);

-- 4. Documents UPDATE policy'sini güncelle (EVALUATION, APPROVED, REJECTED statüsünde belge güncellenemez)
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini güncelleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini güncelleyebilir"
ON public.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
);

-- 5. Documents DELETE policy'sini güncelle (EVALUATION, APPROVED, REJECTED statüsünde belge silinemez)
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini silebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini silebilir"
ON public.documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles 
      WHERE middleman_id = auth.uid()
      AND (application_status = 'NEW_APPLICATION' OR application_status = 'UPDATE_REQUIRED')
    )
  )
);
