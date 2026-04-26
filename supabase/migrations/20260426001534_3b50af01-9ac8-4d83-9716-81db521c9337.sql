
INSERT INTO historico_producao (
  data_producao, produto_id, produto_nome,
  formas_producidas, unidades_calculadas,
  rendimento_usado, unidades_previstas,
  status, confirmado_em, origem, observacoes
)
WITH itens_expandidos AS (
  SELECT 
    date_trunc('week', he.data)::date AS semana,
    (item->>'produto_id')::uuid AS produto_id,
    SUM((item->>'quantidade')::int) AS unidades_entregues
  FROM historico_entregas he
  CROSS JOIN LATERAL jsonb_array_elements(he.itens) AS item
  WHERE he.data >= '2026-03-09' AND he.data < '2026-04-20'
  GROUP BY 1, 2
),
com_receita AS (
  SELECT 
    ie.semana,
    ie.produto_id,
    pf.nome AS produto_nome,
    COALESCE(rb.rendimento, 60) AS rendimento,
    ie.unidades_entregues,
    GREATEST(1, CEIL(ie.unidades_entregues::numeric / COALESCE(rb.rendimento, 60))::int) AS formas
  FROM itens_expandidos ie
  JOIN produtos_finais pf ON pf.id = ie.produto_id
  JOIN componentes_produto cp ON cp.produto_id = ie.produto_id AND cp.tipo = 'receita'
  JOIN receitas_base rb ON rb.id = cp.item_id
)
SELECT 
  semana AS data_producao,
  produto_id,
  produto_nome,
  formas AS formas_producidas,
  formas * rendimento AS unidades_calculadas,
  rendimento AS rendimento_usado,
  formas * rendimento AS unidades_previstas,
  'Confirmado' AS status,
  now() AS confirmado_em,
  'Reconstrução histórica' AS origem,
  'Reconstruído a partir das entregas da semana ' || to_char(semana, 'DD/MM') || ' a ' || to_char(semana + 6, 'DD/MM/YYYY') AS observacoes
FROM com_receita
ORDER BY semana, produto_nome;
