-- Adicionar campos temporários na tabela agendamentos_clientes
ALTER TABLE agendamentos_clientes 
ADD COLUMN IF NOT EXISTS observacoes_agendamento TEXT,
ADD COLUMN IF NOT EXISTS trocas_pendentes JSONB DEFAULT '[]'::jsonb;

-- Adicionar campo de trocas realizadas no histórico de entregas
ALTER TABLE historico_entregas 
ADD COLUMN IF NOT EXISTS trocas_realizadas JSONB DEFAULT '[]'::jsonb;

-- Criar tabela de motivos de troca
CREATE TABLE IF NOT EXISTS motivos_troca (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir motivos padrão
INSERT INTO motivos_troca (nome) VALUES ('Vencimento'), ('Produto amassado')
ON CONFLICT DO NOTHING;

-- Habilitar RLS na tabela motivos_troca
ALTER TABLE motivos_troca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para motivos_troca (admin-only)
CREATE POLICY "Only admins can read motivos_troca" ON motivos_troca
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert motivos_troca" ON motivos_troca
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update motivos_troca" ON motivos_troca
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete motivos_troca" ON motivos_troca
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de histórico de trocas para estatísticas
CREATE TABLE IF NOT EXISTS trocas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  historico_entrega_id UUID REFERENCES historico_entregas(id),
  produto_id UUID REFERENCES produtos_finais(id),
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  motivo_id INTEGER REFERENCES motivos_troca(id),
  motivo_nome TEXT NOT NULL,
  data_troca TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela trocas
ALTER TABLE trocas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para trocas (admin-only)
CREATE POLICY "Only admins can read trocas" ON trocas
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert trocas" ON trocas
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update trocas" ON trocas
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete trocas" ON trocas
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trocas_cliente_id ON trocas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trocas_data_troca ON trocas(data_troca);
CREATE INDEX IF NOT EXISTS idx_trocas_motivo_id ON trocas(motivo_id);