
-- Parte 1: Trigger para auto-ativar cliente ao confirmar entrega
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
      status_cliente = 'Ativo',
      ativo = true,
      ultima_data_reposicao_efetiva = NEW.data::date
    WHERE id = NEW.cliente_id
      AND status_cliente IN ('A ativar', 'Standby');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_status_on_entrega
  AFTER INSERT ON public.historico_entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_cliente_status_on_entrega();

-- Parte 2: Função para mover clientes para Standby (60+ dias) ou A ativar (sem entregas)
CREATE OR REPLACE FUNCTION public.auto_standby_clientes_inativos_60dias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clientes ativos cuja ultima entrega foi ha 60+ dias -> Standby
  UPDATE public.clientes
  SET status_cliente = 'Standby'
  WHERE status_cliente = 'Ativo'
    AND ultima_data_reposicao_efetiva IS NOT NULL
    AND ultima_data_reposicao_efetiva < (CURRENT_DATE - INTERVAL '60 days');

  -- Clientes ativos sem nenhuma entrega -> A ativar
  UPDATE public.clientes
  SET status_cliente = 'A ativar'
  WHERE status_cliente = 'Ativo'
    AND ultima_data_reposicao_efetiva IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.historico_entregas he
      WHERE he.cliente_id = clientes.id AND he.tipo = 'entrega'
    );
END;
$$;

-- Parte 3: Atualizar sync_cliente_status para não interferir com Standby/A ativar
CREATE OR REPLACE FUNCTION public.sync_cliente_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Se status_cliente mudou para Ativo, garantir que ativo = true
  IF NEW.status_cliente = 'Ativo' AND OLD.status_cliente != 'Ativo' THEN
    NEW.ativo = true;
  END IF;
  
  -- Se status_cliente mudou para Inativo, garantir que ativo = false
  IF NEW.status_cliente = 'Inativo' AND OLD.status_cliente != 'Inativo' THEN
    NEW.ativo = false;
  END IF;
  
  -- Se ativo mudou para false, e status era Ativo, mudar para Inativo
  -- Mas NÃO interferir com Standby ou A ativar
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.status_cliente = 'Ativo' THEN
    NEW.status_cliente = 'Inativo';
  END IF;
  
  -- Se ativo mudou para true e status era Inativo, mudar para Ativo
  IF NEW.ativo = true AND OLD.ativo = false AND NEW.status_cliente = 'Inativo' THEN
    NEW.status_cliente = 'Ativo';
  END IF;
  
  RETURN NEW;
END;
$$;
