-- =====================================================
-- ETAPA 1: Corrigir cache_analise_giro
-- =====================================================

-- Remover política permissiva existente
DROP POLICY IF EXISTS "Authenticated users can read cache_analise_giro" 
  ON public.cache_analise_giro;

-- =====================================================
-- ETAPA 2: Corrigir historico_giro_semanal_consolidado
-- =====================================================

-- Remover política permissiva existente
DROP POLICY IF EXISTS "Users can read historico_giro_semanal_consolidado" 
  ON public.historico_giro_semanal_consolidado;

-- Criar política admin-only para leitura
CREATE POLICY "Only admins can read historico_giro_semanal_consolidado"
  ON public.historico_giro_semanal_consolidado
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- ETAPA 3: Criar função SECURITY DEFINER para acessar 
-- a materialized view com verificação de admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_dados_analise_giro_admin()
RETURNS TABLE (
  cliente_id uuid,
  cliente_nome text,
  cnpj_cpf text,
  contato_email text,
  contato_telefone text,
  contato_nome text,
  endereco_entrega text,
  categorias_habilitadas jsonb,
  categoria_estabelecimento_nome text,
  representante_nome text,
  rota_entrega_nome text,
  status_cliente text,
  periodicidade_padrao integer,
  quantidade_padrao integer,
  meta_giro_semanal integer,
  giro_medio_historico numeric,
  giro_semanal_calculado numeric,
  giro_ultima_semana numeric,
  variacao_percentual numeric,
  desvio_padrao_giro numeric,
  semaforo_performance text,
  achievement_meta numeric,
  faturamento_semanal_previsto numeric,
  data_consolidacao timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    -- Retorna vazio para não-admins
    RETURN;
  END IF;

  -- Retorna dados para admins
  RETURN QUERY
  SELECT 
    d.cliente_id,
    d.cliente_nome,
    d.cnpj_cpf,
    d.contato_email,
    d.contato_telefone,
    d.contato_nome,
    d.endereco_entrega,
    d.categorias_habilitadas,
    d.categoria_estabelecimento_nome,
    d.representante_nome,
    d.rota_entrega_nome,
    d.status_cliente,
    d.periodicidade_padrao,
    d.quantidade_padrao,
    d.meta_giro_semanal,
    d.giro_medio_historico,
    d.giro_semanal_calculado,
    d.giro_ultima_semana,
    d.variacao_percentual,
    d.desvio_padrao_giro,
    d.semaforo_performance,
    d.achievement_meta,
    d.faturamento_semanal_previsto,
    d.data_consolidacao,
    d.created_at,
    d.updated_at
  FROM public.dados_analise_giro_materialized d;
END;
$$;