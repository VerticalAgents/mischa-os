## Objetivo

Tornar o **Ajuste de Estoque de Insumos** equivalente ao de Produtos: botão dedicado, modal já aberto no modo "Ajuste", aceitando 0 para zerar e calculando automaticamente a diferença (entrada/saída) a partir do saldo atual.

## Situação atual

- O modal `MovimentacaoEstoqueModal` já é genérico e suporta ajuste para insumos (calcula delta, aceita 0, cria entrada ou saída automaticamente).
- Na aba **Estoque de Insumos**, porém, o usuário precisa clicar em "Movimentar" e trocar manualmente o tipo para "Ajuste" — não há botão direto.
- Para insumos não existe "Saldo Real" (não há separados/despachados pendentes); o saldo de referência é o próprio saldo físico (`saldo_insumo`), que já é o que o modal usa por padrão.
- A trigger `prevent_negative_insumo` só bloqueia saídas maiores que o saldo — não impede zerar.

## Mudanças

### 1. `src/components/estoque/tabs/EstoqueInsumosTab.tsx`
- Adicionar um novo botão **"Ajustar"** (ícone `Pencil` ou `Settings2`) na coluna Ações de cada insumo, ao lado de "Movimentar".
- Ao clicar, abrir o `MovimentacaoEstoqueModal` com uma nova prop `tipoInicial="ajuste"` para que o tipo já venha pré-selecionado.
- Reaproveita o mesmo estado `insumoSelecionado` e o mesmo `handleCloseModal` que já recarrega os saldos.

### 2. `src/components/estoque/MovimentacaoEstoqueModal.tsx`
- Adicionar prop opcional `tipoInicial?: MovTipo` (default `'entrada'`).
- Inicializar `useState<MovTipo>(tipoInicial)` e resetar para `tipoInicial` no `resetForm`.
- Sincronizar com `useEffect` quando o modal abre, para refletir o valor da prop.
- Nenhuma mudança na lógica de cálculo do ajuste — ela já trata o caso `quantidade = 0` e gera saída pelo delta correto.

### 3. (Opcional) Texto do card de Insumos no modal
- O card "Informações do Insumo" já mostra "Saldo atual" — sem mudanças.
- Quando o tipo for "ajuste", a label do input já vira "Quantidade Final (unidade)" e mostra o resumo "Entrada de X" / "Saída de X" / "Sem alteração" — funciona igual aos produtos.

## Resultado esperado

- Na aba de Insumos, o usuário clica em **"Ajustar"** → modal abre direto no modo Ajuste mostrando o saldo atual → digita o saldo final desejado (incluindo 0) → sistema cria automaticamente a movimentação de entrada ou saída com o delta exato → saldo da tabela atualiza.
- Comportamento idêntico ao já implementado na aba de Estoque de Produtos.

## Detalhes técnicos

- Não requer mudanças no banco (RPC `saldo_insumo`, trigger `prevent_negative_insumo` e tabela `movimentacoes_estoque_insumos` já cobrem o cenário).
- Mantém retrocompatibilidade: `tipoInicial` é opcional; chamadas existentes do modal continuam abrindo com tipo "entrada".
