-- 1) Permissão para uso do agente de IA (proprietário/staff, nunca representantes)
CREATE OR REPLACE FUNCTION public.can_use_agent_ia(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (
      SELECT 1 FROM public.representante_accounts
      WHERE auth_user_id = _user_id AND ativo = true
    )
    AND (
      public.has_role(_user_id, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.staff_accounts
        WHERE staff_user_id = _user_id AND ativo = true
      )
      OR EXISTS (
        SELECT 1 FROM public.staff_accounts WHERE owner_id = _user_id
      )
      OR EXISTS (
        SELECT 1 FROM public.representante_accounts WHERE owner_id = _user_id
      )
    )
$$;

REVOKE ALL ON FUNCTION public.can_use_agent_ia(uuid) FROM anon, authenticated;

-- 2) Verificação de permissão dentro de process_entrega_safe
CREATE OR REPLACE FUNCTION public.assert_can_process_entrega(p_agendamento_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF public.is_owner_or_staff() THEN
    RETURN;
  END IF;

  IF public.is_representante() AND EXISTS (
    SELECT 1
    FROM public.agendamentos_clientes a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE a.id = p_agendamento_id
      AND c.representante_id = public.get_my_representante_id()
  ) THEN
    RETURN;
  END IF;

  RAISE EXCEPTION 'Acesso não autorizado a este agendamento';
END;
$$;
