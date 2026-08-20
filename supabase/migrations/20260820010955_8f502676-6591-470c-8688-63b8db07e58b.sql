-- 1. Stock movements: remove permissive policies
DROP POLICY IF EXISTS "Users can insert movimentacoes_estoque_insumos" ON public.movimentacoes_estoque_insumos;
DROP POLICY IF EXISTS "Users can select movimentacoes_estoque_insumos" ON public.movimentacoes_estoque_insumos;
DROP POLICY IF EXISTS "mov_ins_insert" ON public.movimentacoes_estoque_insumos;
DROP POLICY IF EXISTS "mov_ins_select" ON public.movimentacoes_estoque_insumos;

DROP POLICY IF EXISTS "Users can insert movimentacoes_estoque_produtos" ON public.movimentacoes_estoque_produtos;
DROP POLICY IF EXISTS "Users can select movimentacoes_estoque_produtos" ON public.movimentacoes_estoque_produtos;
DROP POLICY IF EXISTS "mov_prod_insert" ON public.movimentacoes_estoque_produtos;
DROP POLICY IF EXISTS "mov_prod_select" ON public.movimentacoes_estoque_produtos;

-- 2. Parcelamentos / parcelas: scope to owner of the card
DROP POLICY IF EXISTS "Usuários autenticados podem ler parcelamentos" ON public.parcelamentos;
CREATE POLICY "Owner or staff can view parcelamentos"
ON public.parcelamentos FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cartoes_credito c
    WHERE c.id = parcelamentos.cartao_id
      AND c.user_id = public.get_owner_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Usuários autenticados podem ler parcelas" ON public.parcelas;
CREATE POLICY "Owner or staff can view parcelas"
ON public.parcelas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parcelamentos p
    JOIN public.cartoes_credito c ON c.id = p.cartao_id
    WHERE p.id = parcelas.parcelamento_id
      AND c.user_id = public.get_owner_id(auth.uid())
  )
);

-- 3. Reagendamentos: owner/staff, or representante for own clients
DROP POLICY IF EXISTS "Authenticated users can view reagendamentos" ON public.reagendamentos_entre_semanas;
DROP POLICY IF EXISTS "Authenticated users can insert reagendamentos" ON public.reagendamentos_entre_semanas;
DROP POLICY IF EXISTS "Authenticated users can update reagendamentos" ON public.reagendamentos_entre_semanas;
DROP POLICY IF EXISTS "Authenticated users can delete reagendamentos" ON public.reagendamentos_entre_semanas;

CREATE POLICY "Owner staff or rep can view reagendamentos"
ON public.reagendamentos_entre_semanas FOR SELECT TO authenticated
USING (
  public.is_owner_or_staff()
  OR EXISTS (
    SELECT 1 FROM public.clientes cl
    WHERE cl.id = reagendamentos_entre_semanas.cliente_id
      AND public.is_representante()
      AND cl.representante_id = public.get_my_representante_id()
  )
);

CREATE POLICY "Owner staff or rep can insert reagendamentos"
ON public.reagendamentos_entre_semanas FOR INSERT TO authenticated
WITH CHECK (
  public.is_owner_or_staff()
  OR EXISTS (
    SELECT 1 FROM public.clientes cl
    WHERE cl.id = reagendamentos_entre_semanas.cliente_id
      AND public.is_representante()
      AND cl.representante_id = public.get_my_representante_id()
  )
);

CREATE POLICY "Owner or staff can update reagendamentos"
ON public.reagendamentos_entre_semanas FOR UPDATE TO authenticated
USING (public.is_owner_or_staff())
WITH CHECK (public.is_owner_or_staff());

CREATE POLICY "Owner or staff can delete reagendamentos"
ON public.reagendamentos_entre_semanas FOR DELETE TO authenticated
USING (public.is_owner_or_staff());

-- 4. Remove blanket read policies
DROP POLICY IF EXISTS "Users can view produtos" ON public.produtos;
CREATE POLICY "Owner or staff can view produtos"
ON public.produtos FOR SELECT TO authenticated
USING (public.is_owner_or_staff());

DROP POLICY IF EXISTS "Users can view rendimentos_receita_produto" ON public.rendimentos_receita_produto;

DROP POLICY IF EXISTS "Users can view sabores" ON public.sabores;
CREATE POLICY "Owner or staff can view sabores"
ON public.sabores FOR SELECT TO authenticated
USING (public.is_owner_or_staff());

DROP POLICY IF EXISTS "Authenticated users can read subcategorias_produto" ON public.subcategorias_produto;

-- 5. Materialized view out of the API
REVOKE ALL ON public.dados_analise_giro_materialized FROM anon, authenticated;

-- 6. Fix mutable search_path
ALTER FUNCTION public.adicionar_meses_com_dia_fixo(date, integer, integer) SET search_path = public;
ALTER FUNCTION public.atualizar_status_parcelamento() SET search_path = public;
ALTER FUNCTION public.gerar_parcelas_automaticamente() SET search_path = public;
ALTER FUNCTION public.marcar_parcelas_atrasadas() SET search_path = public;
ALTER FUNCTION public.saldo_insumo(uuid) SET search_path = public;
ALTER FUNCTION public.saldo_produto(uuid) SET search_path = public;

-- 7. Restrict SECURITY DEFINER functions callable by anon (keep rate limiting for login screen)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND p.proname NOT IN ('check_rate_limit', 'handle_new_user')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
  END LOOP;
END $$;

-- 8. Internal encryption/maintenance routines must not be callable from the browser
REVOKE EXECUTE ON FUNCTION public.encrypt_sensitive_data(text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_sensitive_data(text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.auto_standby_clientes_inativos_60dias() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_parcelas_atrasadas() FROM authenticated, anon;