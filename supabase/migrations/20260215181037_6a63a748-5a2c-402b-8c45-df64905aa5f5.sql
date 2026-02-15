
ALTER TABLE public.reagendamentos_entre_semanas
  ADD COLUMN agendamento_id uuid REFERENCES agendamentos_clientes(id);

CREATE POLICY "Authenticated users can update reagendamentos"
  ON public.reagendamentos_entre_semanas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
