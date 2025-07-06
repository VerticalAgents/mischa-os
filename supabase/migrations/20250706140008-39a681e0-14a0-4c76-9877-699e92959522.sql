
-- Criar tabela para armazenar giros semanais personalizados por cliente e categoria
CREATE TABLE public.giros_semanais_personalizados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL,
  categoria_id integer NOT NULL,
  giro_semanal integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, categoria_id)
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.giros_semanais_personalizados ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo aos dados
CREATE POLICY "Permitir acesso completo a giros_semanais_personalizados" 
  ON public.giros_semanais_personalizados 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_giros_semanais_personalizados_updated_at
  BEFORE UPDATE ON public.giros_semanais_personalizados
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Adicionar comentários para documentar a tabela
COMMENT ON TABLE public.giros_semanais_personalizados IS 'Armazena giros semanais personalizados por cliente e categoria, sobrescrevendo o cálculo automático';
COMMENT ON COLUMN public.giros_semanais_personalizados.cliente_id IS 'ID do cliente';
COMMENT ON COLUMN public.giros_semanais_personalizados.categoria_id IS 'ID da categoria de produto';
COMMENT ON COLUMN public.giros_semanais_personalizados.giro_semanal IS 'Giro semanal personalizado definido pelo usuário';
