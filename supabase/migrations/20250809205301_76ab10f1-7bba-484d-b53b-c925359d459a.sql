
-- Criar tabela de feature flags se não existir
CREATE TABLE IF NOT EXISTS public.app_feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir as flags necessárias
INSERT INTO public.app_feature_flags (flag_name, enabled, description)
VALUES 
  ('auto_baixa_entrega', true, 'Baixa automática no estoque quando entrega é confirmada'),
  ('auto_baixa_entrega_shadow', true, 'Log shadow para telemetria de baixa automática')
ON CONFLICT (flag_name) DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- Função para obter feature flag
CREATE OR REPLACE FUNCTION public.get_feature_flag(flag_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.app_feature_flags WHERE flag_name = $1 LIMIT 1),
    false
  );
$$;

-- Função compute_entrega_itens que calcula itens da entrega baseado no histórico
CREATE OR REPLACE FUNCTION public.compute_entrega_itens(p_entrega_id UUID)
RETURNS TABLE(produto_id UUID, quantidade INTEGER)
LANGUAGE PLPGSQL
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'produto_id')::UUID as produto_id,
    COALESCE((item->>'quantidade')::INTEGER, 0) as quantidade
  FROM public.historico_entregas he,
       jsonb_array_elements(he.itens) as item
  WHERE he.id = p_entrega_id
    AND he.tipo = 'entrega'
    AND item->>'produto_id' IS NOT NULL
    AND (item->>'quantidade')::INTEGER > 0;
END;
$$;

-- Função para processar entrega automaticamente
CREATE OR REPLACE FUNCTION public.process_entrega(p_entrega_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE 
  rec RECORD; 
  v_exists BOOLEAN;
BEGIN
  -- Verificar se a feature flag está ativada
  IF public.get_feature_flag('auto_baixa_entrega') = false THEN 
    RETURN; 
  END IF;

  -- Verificar se já foi processada (idempotência)
  SELECT EXISTS (
    SELECT 1 FROM public.movimentacoes_estoque_produtos
    WHERE referencia_tipo = 'entrega' AND referencia_id = p_entrega_id
  ) INTO v_exists;
  
  IF v_exists THEN 
    RETURN; 
  END IF;

  -- Verificar saldos antes de processar
  FOR rec IN SELECT * FROM public.compute_entrega_itens(p_entrega_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
        rec.produto_id, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Criar movimentações de saída
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, 
    t.quantidade, 
    'saida', 
    now(), 
    'entrega', 
    p_entrega_id, 
    'Baixa automática - entrega confirmada'
  FROM public.compute_entrega_itens(p_entrega_id) t;
END;
$$;

-- Trigger para processar entregas automaticamente
CREATE OR REPLACE FUNCTION public.trigger_process_entrega()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- Só processar se for tipo 'entrega'
  IF NEW.tipo = 'entrega' THEN
    PERFORM public.process_entrega(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela historico_entregas
DROP TRIGGER IF EXISTS after_insert_historico_entregas ON public.historico_entregas;
CREATE TRIGGER after_insert_historico_entregas
  AFTER INSERT ON public.historico_entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_entrega();

-- Políticas RLS para a tabela de feature flags
ALTER TABLE public.app_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags" ON public.app_feature_flags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view feature flags" ON public.app_feature_flags
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Adicionar constraint única para evitar duplicação de movimentações
ALTER TABLE public.movimentacoes_estoque_produtos 
ADD CONSTRAINT IF NOT EXISTS ux_mov_prod_ref 
UNIQUE (referencia_tipo, referencia_id, produto_id);
