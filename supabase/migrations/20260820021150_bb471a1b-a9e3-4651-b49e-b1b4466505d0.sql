CREATE TABLE public.saldos_contas_bancarias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  conta_bancaria_id text NOT NULL,
  nome_conta text,
  saldo_inicial numeric NOT NULL DEFAULT 0,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saldos_contas_bancarias_unico UNIQUE (user_id, conta_bancaria_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saldos_contas_bancarias TO authenticated;
GRANT ALL ON public.saldos_contas_bancarias TO service_role;

ALTER TABLE public.saldos_contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saldos_contas_select" ON public.saldos_contas_bancarias
FOR SELECT TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "saldos_contas_insert" ON public.saldos_contas_bancarias
FOR INSERT TO authenticated
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "saldos_contas_update" ON public.saldos_contas_bancarias
FOR UPDATE TO authenticated
USING (user_id = public.get_owner_id(auth.uid()))
WITH CHECK (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "saldos_contas_delete" ON public.saldos_contas_bancarias
FOR DELETE TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

CREATE TRIGGER update_saldos_contas_bancarias_updated_at
BEFORE UPDATE ON public.saldos_contas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();