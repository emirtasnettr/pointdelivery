-- Middleman'lerin aday adına işlem yapabilmesi için RLS politikaları

-- 1. Middleman'ler kendi adaylarının bilgilerini güncelleyebilir
DROP POLICY IF EXISTS "Middleman'ler aday bilgilerini güncelleyebilir" ON public.candidate_info;

CREATE POLICY "Middleman'ler aday bilgilerini güncelleyebilir"
ON public.candidate_info FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 2. Middleman'ler kendi adayları için bilgi oluşturabilir
DROP POLICY IF EXISTS "Middleman'ler aday bilgilerini oluşturabilir" ON public.candidate_info;

CREATE POLICY "Middleman'ler aday bilgilerini oluşturabilir"
ON public.candidate_info FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND candidate_info.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 3. Middleman'ler kendi adaylarının belgelerini görebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini görebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini görebilir"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 4. Middleman'ler kendi adayları için belge yükleyebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini yükleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini yükleyebilir"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 5. Middleman'ler kendi adaylarının belgelerini güncelleyebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini güncelleyebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini güncelleyebilir"
ON public.documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);

-- 6. Middleman'ler kendi adaylarının belgelerini silebilir
DROP POLICY IF EXISTS "Middleman'ler aday belgelerini silebilir" ON public.documents;

CREATE POLICY "Middleman'ler aday belgelerini silebilir"
ON public.documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'MIDDLEMAN'
    AND documents.profile_id IN (
      SELECT id FROM public.profiles WHERE middleman_id = auth.uid()
    )
  )
);
