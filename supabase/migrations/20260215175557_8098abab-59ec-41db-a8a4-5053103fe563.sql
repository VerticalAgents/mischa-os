CREATE POLICY "Authenticated users can delete reagendamentos"
  ON public.reagendamentos_entre_semanas
  FOR DELETE
  TO authenticated
  USING (true);