-- Adicionar coluna gestaoclick_produto_id à tabela produtos_finais
ALTER TABLE public.produtos_finais 
ADD COLUMN IF NOT EXISTS gestaoclick_produto_id TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.produtos_finais.gestaoclick_produto_id IS 'ID do produto no GestaoClick para sincronização de vendas';

-- Atualizar os IDs dos produtos conforme mapeamento
UPDATE public.produtos_finais SET gestaoclick_produto_id = '001' WHERE nome ILIKE '%Mini Brownie Tradicional%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '002' WHERE nome ILIKE '%Mini Brownie Doce de Leite%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '010' WHERE nome ILIKE '%Nano Brownie Tradicional%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '1' WHERE nome ILIKE '%Brownie Avelã%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '2' WHERE nome ILIKE '%Brownie Stikadinho%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '3' WHERE nome ILIKE '%Brownie Oreo Cream%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '4' WHERE nome ILIKE '%Brownie Choco Duo%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '5' WHERE nome ILIKE '%Brownie Tradicional%' AND nome NOT ILIKE '%Mini%' AND nome NOT ILIKE '%Nano%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '6' WHERE nome ILIKE '%Brownie Meio Amargo%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '7' WHERE nome ILIKE '%Brownie Nesquik%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '8' WHERE nome ILIKE '%Brownie Pistache%';
UPDATE public.produtos_finais SET gestaoclick_produto_id = '999' WHERE nome ILIKE '%Alfajor Tradicional%';