-- 1. Novo insumo: Açúcar Líquido Invertido (10kg = R$70 → R$0,007/g)
INSERT INTO public.insumos (user_id, nome, categoria, volume_bruto, unidade_medida, custo_medio, estoque_atual, estoque_minimo, estoque_ideal)
SELECT 
  (SELECT user_id FROM public.insumos LIMIT 1),
  'Açúcar Líquido Invertido',
  'Matéria Prima',
  10000,
  'g',
  0.007,
  0, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.insumos WHERE LOWER(nome) = LOWER('Açúcar Líquido Invertido')
);

-- 2. Inativa receitas descontinuadas
UPDATE public.receitas_base
SET ativo = false
WHERE LOWER(nome) LIKE '%nesquik%'
   OR LOWER(nome) LIKE '%oreo%'
   OR LOWER(nome) LIKE '%pistache%';

-- 3. Remove receita de teste
DELETE FROM public.itens_receita
WHERE receita_id IN (SELECT id FROM public.receitas_base WHERE LOWER(nome) = LOWER('Brownie Tradicional (60 un)'));

DELETE FROM public.receitas_base
WHERE LOWER(nome) = LOWER('Brownie Tradicional (60 un)');

-- 4. Atualiza rendimento das 6 receitas principais para 60
UPDATE public.receitas_base
SET rendimento = 60, ativo = true
WHERE ativo = true
  AND (
    LOWER(nome) LIKE '%tradicional%'
    OR LOWER(nome) LIKE '%choco duo%'
    OR LOWER(nome) LIKE '%stikadinho%' OR LOWER(nome) LIKE '%stickadinho%'
    OR LOWER(nome) LIKE '%meio amargo%'
    OR LOWER(nome) LIKE '%doce de leite%'
    OR LOWER(nome) LIKE '%avela%' OR LOWER(nome) LIKE '%avelã%'
  );

-- 5. Limpa itens antigos das 6 receitas
DELETE FROM public.itens_receita
WHERE receita_id IN (
  SELECT id FROM public.receitas_base
  WHERE ativo = true
    AND (
      LOWER(nome) LIKE '%tradicional%'
      OR LOWER(nome) LIKE '%choco duo%'
      OR LOWER(nome) LIKE '%stikadinho%' OR LOWER(nome) LIKE '%stickadinho%'
      OR LOWER(nome) LIKE '%meio amargo%'
      OR LOWER(nome) LIKE '%doce de leite%'
      OR LOWER(nome) LIKE '%avela%' OR LOWER(nome) LIKE '%avelã%'
    )
);

-- ========== TRADICIONAL ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 800),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND LOWER(r.nome) LIKE '%tradicional%';

-- ========== CHOCO DUO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 800),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8),
  ('Gotas de Chocolate Branco', 600)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND LOWER(r.nome) LIKE '%choco duo%';

-- ========== STIKADINHO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 800),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8),
  ('Stikadinho', 600)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND (LOWER(r.nome) LIKE '%stikadinho%' OR LOWER(r.nome) LIKE '%stickadinho%');

-- ========== MEIO AMARGO ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 1400),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND LOWER(r.nome) LIKE '%meio amargo%';

-- ========== DOCE DE LEITE (Opção B: massa + topping separados) ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 800),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8),
  ('Doce de Leite Tirol', 900),
  ('Cobertura Branca', 300)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND LOWER(r.nome) LIKE '%doce de leite%';

-- ========== AVELÃ ==========
INSERT INTO public.itens_receita (receita_id, insumo_id, quantidade)
SELECT r.id, i.id, q.quantidade FROM (VALUES
  ('Manteiga sem sal', 800),
  ('Chocolate Meio Amargo', 800),
  ('Açúcar Refinado', 700),
  ('Açúcar Líquido Invertido', 100),
  ('Ovos', 480),
  ('Farinha de Trigo', 360),
  ('Cacau em Pó', 80),
  ('Sal', 8),
  ('Creme de Avelã', 900)
) AS q(insumo_nome, quantidade)
CROSS JOIN public.receitas_base r
JOIN public.insumos i ON LOWER(i.nome) = LOWER(q.insumo_nome)
WHERE r.ativo = true AND (LOWER(r.nome) LIKE '%avela%' OR LOWER(r.nome) LIKE '%avelã%');