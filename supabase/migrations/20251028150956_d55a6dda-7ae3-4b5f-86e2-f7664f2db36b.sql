
-- Atualizar registros do histórico de produção com nome desatualizado
UPDATE historico_producao
SET produto_nome = 'Mini Brownie Doce de Leite'
WHERE produto_nome = 'Mini Brownie Doce de Leite c/ Flor de Sal';
