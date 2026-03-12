-- 1. Recriar função SEM a lógica de 90 dias e SEM zerar agendamentos
CREATE OR REPLACE FUNCTION public.auto_standby_clientes_inativos_60dias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clientes ativos cuja ultima entrega foi ha 60+ dias -> Standby
  UPDATE public.clientes
  SET status_cliente = 'STANDBY'
  WHERE status_cliente = 'ATIVO'
    AND ultima_data_reposicao_efetiva IS NOT NULL
    AND ultima_data_reposicao_efetiva < (CURRENT_DATE - INTERVAL '60 days');

  -- Clientes ativos sem nenhuma entrega -> A ativar
  UPDATE public.clientes
  SET status_cliente = 'A_ATIVAR'
  WHERE status_cliente = 'ATIVO'
    AND ultima_data_reposicao_efetiva IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.historico_entregas he
      WHERE he.cliente_id = clientes.id AND he.tipo = 'entrega'
    );
END;
$$;

-- 2. Reverter clientes que foram inativados automaticamente de volta para STANDBY
UPDATE public.clientes
SET status_cliente = 'STANDBY', ativo = true
WHERE status_cliente = 'INATIVO'
  AND ultima_data_reposicao_efetiva IS NOT NULL;