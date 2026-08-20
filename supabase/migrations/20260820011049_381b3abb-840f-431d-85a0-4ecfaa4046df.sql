DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Routines the signed-in app legitimately needs (client calls + RLS policy helpers)
GRANT EXECUTE ON FUNCTION public.compute_entrega_itens_completo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_primeira_data_vencimento(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dados_analise_giro_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_representante_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_route_permission(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_representante() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_staff_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_historico_giro_semanal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_dados_analise_giro() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_entrega_safe(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_entrega_safe(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.representante_update_agendamento(uuid, text, date) TO authenticated;

-- Login screen needs the rate limit check before authentication
GRANT EXECUTE ON FUNCTION public.check_rate_limit(inet, text, text, interval, integer) TO anon, authenticated;