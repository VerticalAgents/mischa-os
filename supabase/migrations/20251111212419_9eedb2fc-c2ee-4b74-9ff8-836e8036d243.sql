-- Tabela: tipos_parcelamento
CREATE TABLE tipos_parcelamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor_hex TEXT DEFAULT '#D4A574',
  icone TEXT DEFAULT 'CreditCard',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT nome_tipo_unico UNIQUE (nome)
);

-- RLS Policies para tipos_parcelamento
ALTER TABLE tipos_parcelamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar tipos_parcelamento" ON tipos_parcelamento
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários autenticados podem ler tipos_parcelamento" ON tipos_parcelamento
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- Trigger para updated_at em tipos_parcelamento
CREATE TRIGGER update_tipos_parcelamento_updated_at
  BEFORE UPDATE ON tipos_parcelamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir tipos padrão
INSERT INTO tipos_parcelamento (nome, descricao, cor_hex, icone) VALUES
  ('Estrutura', 'Investimentos em estrutura física', '#8B5CF6', 'Building'),
  ('Reforma', 'Obras e reformas', '#F59E0B', 'Hammer'),
  ('Equipamentos', 'Compra de equipamentos', '#3B82F6', 'Laptop'),
  ('Mobiliário', 'Móveis e decoração', '#10B981', 'Sofa'),
  ('Tecnologia', 'TI e sistemas', '#6366F1', 'Server'),
  ('Marketing', 'Investimentos em marketing', '#EC4899', 'Megaphone'),
  ('Outros', 'Outros parcelamentos', '#6B7280', 'Package');

-- Tabela: cartoes_credito
CREATE TABLE cartoes_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ultimos_digitos TEXT NOT NULL,
  bandeira TEXT NOT NULL CHECK (bandeira IN ('Visa', 'Mastercard', 'Elo', 'Amex', 'Outros')),
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
  limite_credito NUMERIC(10,2) DEFAULT 0,
  cor_identificacao TEXT DEFAULT '#D4A574',
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT nome_cartao_unico UNIQUE (nome)
);

-- RLS Policies para cartoes_credito
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar cartoes_credito" ON cartoes_credito
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários autenticados podem ler cartoes_credito" ON cartoes_credito
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = true);

-- Trigger para updated_at em cartoes_credito
CREATE TRIGGER update_cartoes_credito_updated_at
  BEFORE UPDATE ON cartoes_credito
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: parcelamentos
CREATE TABLE parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_parcelamento_id UUID NOT NULL REFERENCES tipos_parcelamento(id) ON DELETE RESTRICT,
  cartao_id UUID NOT NULL REFERENCES cartoes_credito(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL CHECK (valor_total > 0),
  numero_parcelas INTEGER NOT NULL CHECK (numero_parcelas > 0 AND numero_parcelas <= 60),
  data_compra DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance em parcelamentos
CREATE INDEX idx_parcelamentos_tipo ON parcelamentos(tipo_parcelamento_id);
CREATE INDEX idx_parcelamentos_cartao ON parcelamentos(cartao_id);
CREATE INDEX idx_parcelamentos_status ON parcelamentos(status);
CREATE INDEX idx_parcelamentos_data_compra ON parcelamentos(data_compra);

-- RLS Policies para parcelamentos
ALTER TABLE parcelamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar parcelamentos" ON parcelamentos
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários autenticados podem ler parcelamentos" ON parcelamentos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at em parcelamentos
CREATE TRIGGER update_parcelamentos_updated_at
  BEFORE UPDATE ON parcelamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela: parcelas
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL CHECK (numero_parcela > 0),
  valor_parcela NUMERIC(10,2) NOT NULL CHECK (valor_parcela > 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT parcela_unica_por_parcelamento UNIQUE (parcelamento_id, numero_parcela)
);

-- Índices para performance em parcelas
CREATE INDEX idx_parcelas_parcelamento ON parcelas(parcelamento_id);
CREATE INDEX idx_parcelas_status ON parcelas(status);
CREATE INDEX idx_parcelas_data_vencimento ON parcelas(data_vencimento);
CREATE INDEX idx_parcelas_data_pagamento ON parcelas(data_pagamento);

-- RLS Policies para parcelas
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar parcelas" ON parcelas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários autenticados podem ler parcelas" ON parcelas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at em parcelas
CREATE TRIGGER update_parcelas_updated_at
  BEFORE UPDATE ON parcelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função: Gerar Parcelas Automaticamente
CREATE OR REPLACE FUNCTION gerar_parcelas_automaticamente()
RETURNS TRIGGER AS $$
DECLARE
  v_valor_parcela NUMERIC(10,2);
  v_valor_ultima_parcela NUMERIC(10,2);
  v_data_vencimento DATE;
  v_dia_vencimento INTEGER;
  v_dia_fechamento INTEGER;
  v_contador INTEGER;
BEGIN
  -- Buscar informações do cartão
  SELECT dia_vencimento, dia_fechamento
  INTO v_dia_vencimento, v_dia_fechamento
  FROM cartoes_credito
  WHERE id = NEW.cartao_id;

  -- Calcular valor da parcela (arredondar para baixo)
  v_valor_parcela := FLOOR((NEW.valor_total / NEW.numero_parcelas) * 100) / 100;
  
  -- Calcular valor da última parcela (para compensar arredondamento)
  v_valor_ultima_parcela := NEW.valor_total - (v_valor_parcela * (NEW.numero_parcelas - 1));

  -- Calcular primeira data de vencimento
  -- Se a compra foi após o fechamento, primeira parcela vence no próximo ciclo
  IF EXTRACT(DAY FROM NEW.data_compra) > v_dia_fechamento THEN
    v_data_vencimento := DATE_TRUNC('month', NEW.data_compra) + 
                         INTERVAL '2 months' + 
                         (v_dia_vencimento - 1) * INTERVAL '1 day';
  ELSE
    v_data_vencimento := DATE_TRUNC('month', NEW.data_compra) + 
                         INTERVAL '1 month' + 
                         (v_dia_vencimento - 1) * INTERVAL '1 day';
  END IF;

  -- Gerar as parcelas
  FOR v_contador IN 1..NEW.numero_parcelas LOOP
    INSERT INTO parcelas (
      parcelamento_id,
      numero_parcela,
      valor_parcela,
      data_vencimento,
      status
    ) VALUES (
      NEW.id,
      v_contador,
      CASE WHEN v_contador = NEW.numero_parcelas 
           THEN v_valor_ultima_parcela 
           ELSE v_valor_parcela 
      END,
      v_data_vencimento,
      'pendente'
    );

    -- Avançar para o próximo mês
    v_data_vencimento := v_data_vencimento + INTERVAL '1 month';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para gerar parcelas ao criar parcelamento
CREATE TRIGGER trigger_gerar_parcelas
  AFTER INSERT ON parcelamentos
  FOR EACH ROW
  EXECUTE FUNCTION gerar_parcelas_automaticamente();

-- Função: Atualizar Status do Parcelamento
CREATE OR REPLACE FUNCTION atualizar_status_parcelamento()
RETURNS TRIGGER AS $$
DECLARE
  v_total_parcelas INTEGER;
  v_parcelas_pagas INTEGER;
BEGIN
  -- Contar total de parcelas e parcelas pagas
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'pago')
  INTO v_total_parcelas, v_parcelas_pagas
  FROM parcelas
  WHERE parcelamento_id = COALESCE(NEW.parcelamento_id, OLD.parcelamento_id);

  -- Atualizar status do parcelamento
  IF v_parcelas_pagas = v_total_parcelas THEN
    UPDATE parcelamentos
    SET status = 'quitado', updated_at = NOW()
    WHERE id = COALESCE(NEW.parcelamento_id, OLD.parcelamento_id);
  ELSIF v_parcelas_pagas > 0 THEN
    UPDATE parcelamentos
    SET status = 'ativo', updated_at = NOW()
    WHERE id = COALESCE(NEW.parcelamento_id, OLD.parcelamento_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar status quando parcela é paga/modificada
CREATE TRIGGER trigger_atualizar_status_parcelamento
  AFTER UPDATE OR DELETE ON parcelas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_parcelamento();

-- Função: Marcar Parcelas Atrasadas
CREATE OR REPLACE FUNCTION marcar_parcelas_atrasadas()
RETURNS void AS $$
BEGIN
  UPDATE parcelas
  SET status = 'atrasado', updated_at = NOW()
  WHERE status = 'pendente' 
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;