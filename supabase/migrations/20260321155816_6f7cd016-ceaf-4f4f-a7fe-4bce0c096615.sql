
-- Tabela de permissões por role, por dono de empresa
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  route_key text NOT NULL,
  route_label text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, route_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Cada dono vê/gerencia apenas suas permissões
CREATE POLICY "Users can manage own role_permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff pode ler as permissões do seu dono (para o sidebar consultar)
CREATE POLICY "Staff can read owner permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (user_id = public.get_owner_id(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
