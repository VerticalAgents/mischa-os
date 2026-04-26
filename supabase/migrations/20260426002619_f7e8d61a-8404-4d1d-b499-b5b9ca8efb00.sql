-- Corrigir registros de Mini e Nano Brownie reconstruidos
-- Mini: rendimento real = 2 un/forma
-- Nano: rendimento real = 4 un/forma

-- Mini Brownie Tradicional
UPDATE historico_producao SET formas_producidas = 19, unidades_calculadas = 38, rendimento_usado = 2, unidades_previstas = 38
WHERE id = '409616be-3adb-4224-86e3-5baf46739f0f';
UPDATE historico_producao SET formas_producidas = 22, unidades_calculadas = 44, rendimento_usado = 2, unidades_previstas = 44
WHERE id = 'd7c858df-7875-4be1-b1a2-bf01ef2c93ef';
UPDATE historico_producao SET formas_producidas = 20, unidades_calculadas = 40, rendimento_usado = 2, unidades_previstas = 40
WHERE id = 'de3055c3-0d2f-4f40-878e-560947fda9b8';

-- Nano Brownie Tradicional
UPDATE historico_producao SET formas_producidas = 1, unidades_calculadas = 4, rendimento_usado = 4, unidades_previstas = 4
WHERE id = '180439c5-b6aa-4864-bb26-3d92fc60fa74';
UPDATE historico_producao SET formas_producidas = 1, unidades_calculadas = 4, rendimento_usado = 4, unidades_previstas = 4
WHERE id = '3b815623-bc1c-4e47-9220-c249686becdf';
UPDATE historico_producao SET formas_producidas = 1, unidades_calculadas = 4, rendimento_usado = 4, unidades_previstas = 4
WHERE id = '3ad3295f-fde6-41bb-9ecc-f28052e9cfcc';
UPDATE historico_producao SET formas_producidas = 1, unidades_calculadas = 4, rendimento_usado = 4, unidades_previstas = 4
WHERE id = 'b68021d7-ecb7-4414-b9d2-de1dca8d107b';
UPDATE historico_producao SET formas_producidas = 2, unidades_calculadas = 8, rendimento_usado = 4, unidades_previstas = 8
WHERE id = 'a3f2f6f2-622e-40a7-b73a-207b9799363c';