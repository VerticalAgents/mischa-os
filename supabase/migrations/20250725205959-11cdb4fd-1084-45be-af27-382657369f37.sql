
-- Primeiro, vamos identificar e corrigir os dados inconsistentes
-- Clientes com ativo = false mas status_cliente = "Ativo" devem ter ativo = true
UPDATE clientes 
SET ativo = true, updated_at = now()
WHERE ativo = false AND status_cliente = 'Ativo';

-- Clientes com ativo = true mas status_cliente = "Inativo" devem ter ativo = false
UPDATE clientes 
SET ativo = false, updated_at = now()
WHERE ativo = true AND status_cliente = 'Inativo';

-- Criar uma função para detectar inconsistências futuras
CREATE OR REPLACE FUNCTION check_cliente_status_consistency()
RETURNS TABLE(
  id uuid,
  nome text,
  ativo boolean,
  status_cliente text,
  inconsistencia text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    c.ativo,
    c.status_cliente,
    CASE 
      WHEN c.ativo = false AND c.status_cliente = 'Ativo' THEN 'Campo ativo false mas status_cliente Ativo'
      WHEN c.ativo = true AND c.status_cliente = 'Inativo' THEN 'Campo ativo true mas status_cliente Inativo'
      ELSE 'Outros problemas'
    END as inconsistencia
  FROM clientes c
  WHERE 
    (c.ativo = false AND c.status_cliente = 'Ativo') OR
    (c.ativo = true AND c.status_cliente = 'Inativo');
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para manter consistência entre os campos
CREATE OR REPLACE FUNCTION sync_cliente_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status_cliente mudou para Ativo, garantir que ativo = true
  IF NEW.status_cliente = 'Ativo' AND OLD.status_cliente != 'Ativo' THEN
    NEW.ativo = true;
  END IF;
  
  -- Se status_cliente mudou para Inativo, garantir que ativo = false
  IF NEW.status_cliente = 'Inativo' AND OLD.status_cliente != 'Inativo' THEN
    NEW.ativo = false;
  END IF;
  
  -- Se ativo mudou para false, garantir que status_cliente não seja Ativo
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.status_cliente = 'Ativo' THEN
    NEW.status_cliente = 'Inativo';
  END IF;
  
  -- Se ativo mudou para true, garantir que status_cliente não seja Inativo
  IF NEW.ativo = true AND OLD.ativo = false AND NEW.status_cliente = 'Inativo' THEN
    NEW.status_cliente = 'Ativo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_sync_cliente_status ON clientes;
CREATE TRIGGER trigger_sync_cliente_status
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION sync_cliente_status();
