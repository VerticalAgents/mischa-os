
INSERT INTO public.movimentacoes_estoque_insumos (insumo_id, tipo, quantidade, data_movimentacao, observacao)
SELECT i.id, 'saida', saldo_insumo(i.id), now(), 'Zerar estoque (ajuste manual em massa)'
FROM public.insumos i
WHERE saldo_insumo(i.id) <> 0;
