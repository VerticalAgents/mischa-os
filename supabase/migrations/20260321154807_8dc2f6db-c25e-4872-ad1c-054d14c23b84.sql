
-- Tabela staff_accounts para vincular funcionários aos donos de empresa
CREATE TABLE public.staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'producao',
  nome text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, staff_user_id)
);

ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;

-- Donos veem e gerenciam apenas seus próprios funcionários
CREATE POLICY "Owners can manage own staff"
ON public.staff_accounts FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Adicionar owner_id na user_roles para saber a quem o producao pertence
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Função helper: retorna o owner_id se for staff, ou o próprio user_id se for dono
CREATE OR REPLACE FUNCTION public.get_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.staff_accounts WHERE staff_user_id = _user_id AND ativo = true LIMIT 1),
    _user_id
  )
$$;

-- Trigger para updated_at na staff_accounts
CREATE TRIGGER update_staff_accounts_updated_at
BEFORE UPDATE ON public.staff_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
