CREATE OR REPLACE FUNCTION public.get_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.staff_accounts
       WHERE staff_user_id = _user_id AND ativo = true LIMIT 1),
    (SELECT owner_id FROM public.representante_accounts
       WHERE auth_user_id = _user_id AND ativo = true LIMIT 1),
    _user_id
  )
$$;