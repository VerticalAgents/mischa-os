-- 1) Adicionar 'representante' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'representante';

-- 2) Tabela representante_accounts
CREATE TABLE IF NOT EXISTS public.representante_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  representante_id integer NOT NULL REFERENCES public.representantes(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  login_email text NOT NULL,
  senha_acesso text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(representante_id),
  UNIQUE(auth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_representante_accounts_auth_user
  ON public.representante_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_representante_accounts_representante
  ON public.representante_accounts(representante_id);

ALTER TABLE public.representante_accounts ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER trg_representante_accounts_updated_at
  BEFORE UPDATE ON public.representante_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Funções helper
CREATE OR REPLACE FUNCTION public.is_representante()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.representante_accounts
    WHERE auth_user_id = auth.uid() AND ativo = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_representante_id()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT representante_id FROM public.representante_accounts
  WHERE auth_user_id = auth.uid() AND ativo = true
  LIMIT 1;
$$;

-- 4) RLS para representante_accounts
CREATE POLICY "Admins manage representante_accounts"
  ON public.representante_accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Representante reads own account"
  ON public.representante_accounts FOR SELECT
  USING (auth_user_id = auth.uid());

-- 5) RLS adicionais para representantes (lê o próprio registro)
CREATE POLICY "Representante reads own representante row"
  ON public.representantes FOR SELECT
  USING (
    public.is_representante()
    AND id = public.get_my_representante_id()
  );

-- 6) RLS adicionais para clientes
CREATE POLICY "Representante reads own clientes"
  ON public.clientes FOR SELECT
  USING (
    public.is_representante()
    AND representante_id = public.get_my_representante_id()
  );

CREATE POLICY "Representante inserts own clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (
    public.is_representante()
    AND representante_id = public.get_my_representante_id()
  );

CREATE POLICY "Representante updates own clientes"
  ON public.clientes FOR UPDATE
  USING (
    public.is_representante()
    AND representante_id = public.get_my_representante_id()
  )
  WITH CHECK (
    public.is_representante()
    AND representante_id = public.get_my_representante_id()
  );

-- 7) RLS adicionais para agendamentos_clientes (apenas SELECT; UPDATE bloqueado)
CREATE POLICY "Representante reads own agendamentos"
  ON public.agendamentos_clientes FOR SELECT
  USING (
    public.is_representante()
    AND cliente_id IN (
      SELECT id FROM public.clientes
      WHERE representante_id = public.get_my_representante_id()
    )
  );

-- 8) RPC para representante atualizar SOMENTE status e data do agendamento
CREATE OR REPLACE FUNCTION public.representante_update_agendamento(
  p_agendamento_id uuid,
  p_status_agendamento text DEFAULT NULL,
  p_data_proxima_reposicao date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rep_id integer;
  v_cliente_rep_id integer;
BEGIN
  -- Verifica se o caller é representante
  v_rep_id := public.get_my_representante_id();
  IF v_rep_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: apenas representantes podem usar esta função';
  END IF;

  -- Verifica se o agendamento pertence a um cliente do representante
  SELECT c.representante_id INTO v_cliente_rep_id
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_rep_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento não encontrado';
  END IF;

  IF v_cliente_rep_id <> v_rep_id THEN
    RAISE EXCEPTION 'Acesso negado: este agendamento não pertence aos seus clientes';
  END IF;

  -- Atualiza apenas os campos permitidos (ignora os que vierem null)
  UPDATE public.agendamentos_clientes
  SET
    status_agendamento = COALESCE(p_status_agendamento, status_agendamento),
    data_proxima_reposicao = COALESCE(p_data_proxima_reposicao, data_proxima_reposicao),
    updated_at = now()
  WHERE id = p_agendamento_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.representante_update_agendamento(uuid, text, date) TO authenticated;