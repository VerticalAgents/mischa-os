-- Garantir rendimento 60 e ativo
UPDATE public.receitas_base
SET rendimento = 60, ativo = true
WHERE ativo = true
  AND (
    LOWER(nome) = 'brownie tradicional'
    OR LOWER(nome) = 'brownie choco duo'
    OR LOWER(nome) = 'brownie stikadinho'
    OR LOWER(nome) = 'brownie meio amargo'
    OR LOWER(nome) = 'brownie doce de leite'
    OR LOWER(nome) = 'brownie avelã'
  );

-- Limpar itens antigos
DELETE FROM public.itens_receita
WHERE receita_id IN (
  SELECT id FROM public.receitas_base
  WHERE LOWER(nome) IN (
    'brownie tradicional','brownie choco duo','brownie stikadinho',
    'brownie meio amargo','brownie doce de leite','brownie avelã'
  )
);

-- ========== TRADICIONAL ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 1164.8::numeric),
  ('Chocolate em Pó 50% - Sicao', 411.3),
  ('Sorbitol em Pó', 81.9),
  ('Farinha de Trigo', 500.1),
  ('Propionato de Cálcio', 8),
  ('Sal', 4),
  ('Ovo em Pó (homogeneizado)', 548),
  ('Óleo de Soja', 576),
  ('Cobertura Ao Leite - Genuine', 616.9),
  ('Água', 21),
  ('Essência de Baunilha', 27),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie tradicional';

-- ========== CHOCO DUO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 1164.8::numeric),
  ('Chocolate em Pó 50% - Sicao', 411.3),
  ('Sorbitol em Pó', 81.9),
  ('Farinha de Trigo', 500.1),
  ('Propionato de Cálcio', 8),
  ('Sal', 4),
  ('Ovo em Pó (homogeneizado)', 548),
  ('Óleo de Soja', 576),
  ('Cobertura Branca Genuine', 616.9),
  ('Água', 21),
  ('Essência de Baunilha', 27),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie choco duo';

-- ========== STIKADINHO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 1164.8::numeric),
  ('Chocolate em Pó 50% - Sicao', 411.3),
  ('Sorbitol em Pó', 81.9),
  ('Farinha de Trigo', 500.1),
  ('Propionato de Cálcio', 8),
  ('Sal', 4),
  ('Ovo em Pó (homogeneizado)', 548),
  ('Óleo de Soja', 576),
  ('Stikadinho', 616.9),
  ('Água', 21),
  ('Essência de Baunilha', 27),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie stikadinho';

-- ========== MEIO AMARGO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 1235.8::numeric),
  ('Chocolate em Pó 50% - Sicao', 463.2),
  ('Cacau Black', 27.9),
  ('Sorbitol em Pó', 99.8),
  ('Farinha de Trigo', 562),
  ('Propionato de Cálcio', 8),
  ('Sal', 4),
  ('Ovo em Pó (homogeneizado)', 617.9),
  ('Óleo de Soja', 610.9),
  ('Cobertura Meio Amargo - Genuine', 280.5),
  ('Água', 21),
  ('Essência de Baunilha', 28),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie meio amargo';

-- ========== DOCE DE LEITE ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 590::numeric),
  ('Doce de Leite Tirol', 925),
  ('Açúcar Líquido Invertido', 80),
  ('Sorbitol em Pó', 80),
  ('Farinha de Trigo', 643),
  ('Propionato de Cálcio', 8),
  ('Sal', 21),
  ('Ovo em Pó (homogeneizado)', 380),
  ('Óleo de Soja', 275),
  ('Cobertura Branca Genuine', 909),
  ('Água', 21),
  ('Essência de Baunilha', 27),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie doce de leite';

-- ========== AVELÃ ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Açúcar Refinado'::text, 1117.7::numeric),
  ('Chocolate em Pó 50% - Sicao', 394.6),
  ('Sorbitol em Pó', 78.5),
  ('Farinha de Trigo', 479.8),
  ('Propionato de Cálcio', 8),
  ('Sal', 4),
  ('Ovo em Pó (homogeneizado)', 525.8),
  ('Óleo de Soja', 552.6),
  ('Nutella 3kg', 750),
  ('Água', 21),
  ('Essência de Baunilha', 27),
  ('Sorbato de Potássio', 21),
  ('Spray Desmoldante - Carlex', 2)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE LOWER(r.nome) = 'brownie avelã';