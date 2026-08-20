-- Desfazer a produção confirmada de "Brownie Doce de Leite" (18/08/2026, 20 formas)
DELETE FROM public.movimentacoes_estoque_produtos
WHERE produto_id = '585d8ceb-5d93-4380-aa3d-7c3133f211d8'
  AND tipo = 'entrada'
  AND quantidade = 1200
  AND data_movimentacao = '2026-08-18 11:21:41.239+00';

-- Estorna o consumo de insumos dessa produção
DELETE FROM public.movimentacoes_estoque_insumos
WHERE referencia_id = 'f65bba69-e65b-4fc5-a536-a01cb6468883'
  AND referencia_tipo = 'producao';

-- Remove as reposições automáticas criadas só para viabilizar essa produção
DELETE FROM public.movimentacoes_estoque_insumos
WHERE referencia_id = 'f65bba69-e65b-4fc5-a536-a01cb6468883'
  AND referencia_tipo = 'ajuste_producao';

-- Remove o registro de produção
DELETE FROM public.historico_producao
WHERE id = 'f65bba69-e65b-4fc5-a536-a01cb6468883';