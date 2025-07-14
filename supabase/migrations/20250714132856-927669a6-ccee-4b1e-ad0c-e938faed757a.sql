
-- Alterar a coluna giro_semanal para aceitar valores decimais
ALTER TABLE public.giros_semanais_personalizados 
ALTER COLUMN giro_semanal TYPE numeric(10,2);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.giros_semanais_personalizados.giro_semanal 
IS 'Giro semanal personalizado (permite valores decimais como 0.5 para produtos vendidos mensalmente)';
