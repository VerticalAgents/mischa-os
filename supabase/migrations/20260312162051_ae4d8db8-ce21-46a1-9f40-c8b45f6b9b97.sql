
-- Parte 1: Backfill ultima_data_reposicao_efetiva from historico_entregas
UPDATE clientes SET ultima_data_reposicao_efetiva = sub.ultima
FROM (
  SELECT cliente_id, MAX(data)::date as ultima
  FROM historico_entregas WHERE tipo = 'entrega'
  GROUP BY cliente_id
) sub
WHERE clientes.id = sub.cliente_id
  AND clientes.ultima_data_reposicao_efetiva IS NULL;

-- Parte 2: Fix auto_update_cliente_status_on_entrega with correct case
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
      AND status_cliente IN ('A_ATIVAR', 'STANDBY');
  END IF;
  RETURN NEW;
END;
$$;

-- Parte 3: Fix auto_standby_clientes_inativos_60dias with correct case
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

-- Parte 4: Fix sync_cliente_status with correct case
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
  
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.status_cliente = 'ATIVO' THEN
    NEW.status_cliente = 'INATIVO';
  END IF;
  
  IF NEW.ativo = true AND OLD.ativo = false AND NEW.status_cliente = 'INATIVO' THEN
    NEW.status_cliente = 'ATIVO';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Parte 5: Fix default value for status_cliente
ALTER TABLE clientes ALTER COLUMN status_cliente SET DEFAULT 'ATIVO';
