-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj_cpf TEXT,
  endereco_entrega TEXT,
  link_google_maps TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  contato_email TEXT,
  origem TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'Visitados',
    'EfetivadosImediato',
    'ContatosCapturados',
    'ChamadosWhatsApp',
    'RespostaWhatsApp',
    'EfetivadosWhatsApp',
    'Perdidos'
  )),
  representante_id INTEGER REFERENCES public.representantes(id),
  categoria_estabelecimento_id INTEGER REFERENCES public.categorias_estabelecimento(id),
  quantidade_estimada INTEGER,
  periodicidade_estimada INTEGER,
  observacoes TEXT,
  data_visita TIMESTAMP WITH TIME ZONE,
  data_contato_whatsapp TIMESTAMP WITH TIME ZONE,
  data_resposta TIMESTAMP WITH TIME ZONE,
  motivo_perda TEXT,
  cliente_convertido_id UUID REFERENCES public.clientes(id),
  data_conversao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_representante ON public.leads(representante_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- RLS Policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads"
  ON public.leads
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();