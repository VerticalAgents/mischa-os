-- Adicionar coluna de ordenamento por categoria aos produtos finais
ALTER TABLE produtos_finais 
ADD COLUMN ordem_categoria INTEGER DEFAULT NULL;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX idx_produtos_finais_categoria_ordem 
ON produtos_finais(categoria_id, ordem_categoria NULLS LAST);