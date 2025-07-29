
-- Remove existing restrictive policies
DROP POLICY IF EXISTS "Only admins can modify representantes" ON public.representantes;
DROP POLICY IF EXISTS "Authenticated users can read representantes" ON public.representantes;

-- Create new policies that allow authenticated users to manage representantes
CREATE POLICY "Authenticated users can read representantes" 
ON public.representantes 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert representantes" 
ON public.representantes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update representantes" 
ON public.representantes 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete representantes" 
ON public.representantes 
FOR DELETE 
TO authenticated 
USING (true);
