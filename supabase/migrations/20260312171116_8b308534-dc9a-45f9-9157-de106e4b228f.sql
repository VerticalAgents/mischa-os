
-- 1. Update auto_standby function: add 90-day INATIVO rule + zero agendamento
CREATE OR REPLACE FUNCTION public.auto_standby_clientes_inativos_60dias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clientes STANDBY cuja ultima entrega foi ha 90+ dias -> INATIVO
  UPDATE public.clientes
  SET status_cliente = 'INATIVO', ativo = false
  WHERE status_cliente = 'STANDBY'
    AND ultima_data_reposicao_efetiva IS NOT NULL
    AND ultima_data_reposicao_efetiva < (CURRENT_DATE - INTERVAL '90 days');

  -- Zerar agendamentos dos clientes que acabaram de ficar INATIVO
  UPDATE public.agendamentos_clientes ac
  SET status_agendamento = 'Agendar',
      data_proxima_reposicao = NULL,
      quantidade_total = 0,
      itens_personalizados = NULL,
      updated_at = now()
  FROM public.clientes c
  WHERE ac.cliente_id = c.id
    AND c.status_cliente = 'INATIVO'
    AND c.ativo = false
    AND ac.status_agendamento != 'Agendar';

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

-- 2. Update entrega trigger to include REATIVAR
CREATE OR REPLACE FUNCTION public.auto_update_cliente_status_on_entrega()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tipo = 'entrega' THEN
    UPDATE public.clientes
    SET 
      status_cliente = 'ATIVO',
      ativo = true,
      ultima_data_reposicao_efetiva = NEW.data::date
    WHERE id = NEW.cliente_id
      AND status_cliente IN ('A_ATIVAR', 'STANDBY', 'REATIVAR');
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update sync_cliente_status to handle REATIVAR
CREATE OR REPLACE FUNCTION public.sync_cliente_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status_cliente = 'ATIVO' AND OLD.status_cliente != 'ATIVO' THEN
    NEW.ativo = true;
  END IF;
  
  IF NEW.status_cliente = 'INATIVO' AND OLD.status_cliente != 'INATIVO' THEN
    NEW.ativo = false;
  END IF;

  IF NEW.status_cliente = 'REATIVAR' AND OLD.status_cliente != 'REATIVAR' THEN
    NEW.ativo = true;
  END IF;
  
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.status_cliente = 'ATIVO' THEN
    NEW.status_cliente = 'INATIVO';
  END IF;
  
  IF NEW.ativo = true AND OLD.ativo = false AND NEW.status_cliente = 'INATIVO' THEN
    NEW.status_cliente = 'ATIVO';
  END IF;
  
  RETURN NEW;
END;
$$;
