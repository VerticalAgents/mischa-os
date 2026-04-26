## Problema

No modal "Nova Movimentação" usado em `/estoque/insumos?tab=produtos` (ex.: Brownie Avelã), o tipo **Ajuste** apresenta dois bugs:

1. **Não salva quando o valor digitado é `0`**  
   O guard `if (!quantidade || parseFloat(quantidade) <= 0) return;` aborta silenciosamente para qualquer valor `≤ 0`, impedindo zerar o estoque.

2. **Não respeita o saldo final informado para produtos**  
   O `saldoAtual` só é carregado quando `tipoItem === 'insumo'`. Para **produto**, ele permanece `0`, então a lógica `diferenca = quantidadeFinal - saldoAtual` calcula a diferença contra zero e gera uma **entrada** somando ao estoque atual em vez de ajustá-lo ao valor desejado. Resultado: o saldo final fica diferente do número digitado.

Além disso, o card "Informações do Insumo" (que mostra o saldo atual) é renderizado apenas para insumos — quando o usuário ajusta um produto, ele não vê o saldo atual nem o cálculo "Entrada/Saída de X" que ajuda a conferir.

## Correções (arquivo `src/components/estoque/MovimentacaoEstoqueModal.tsx`)

1. **Carregar `saldoAtual` também para produtos**  
   - Importar `obterSaldoProduto` de `useMovimentacoesEstoqueProdutos`.
   - No `useEffect` de abertura, chamar `obterSaldoProduto(itemId)` quando `tipoItem === 'produto'` (paralelo ao caminho de insumo).

2. **Permitir quantidade `0` no Ajuste**  
   - Trocar o guard de submissão por algo como:
     - Se `tipo === 'ajuste'`: aceitar `quantidade` desde que seja um número válido `>= 0` (string vazia continua bloqueada).
     - Para `entrada`/`saida`: manter o requisito `> 0`.
   - Ajustar também o `disabled` do botão Salvar para não bloquear quando `quantidade === '0'` em modo ajuste.

3. **Exibir o saldo atual do produto no modal**  
   - Mostrar uma linha simplificada "Saldo atual: X un" também para produtos (sem categoria/volume_bruto, que são específicos de insumo). Mantém o usuário ciente do valor base do ajuste.
   - O cálculo "Entrada de X / Saída de X / Sem alteração" abaixo do input já funcionará automaticamente quando `saldoAtual` estiver carregado para produto, usando "unidades" como unidade padrão.

4. **Tratamento de produto com saldo igual ao desejado**  
   - O fluxo `diferenca === 0` já fecha o modal corretamente; após a correção #1 isso funcionará para zerar (digitar 0 quando saldo já é 0) sem inserir movimentação desnecessária.

## Resultado esperado

- Ao escolher Ajuste para um produto e digitar `0`, o sistema gera uma **saída** equivalente ao saldo atual e o estoque vai a zero.
- Ao digitar qualquer outro número N, o estoque do produto fica exatamente em N (entrada se N > saldo atual, saída se N < saldo atual).
- O usuário enxerga o saldo atual antes de confirmar, evitando ambiguidade.

Sem mudanças de banco; apenas alterações no componente do modal.
