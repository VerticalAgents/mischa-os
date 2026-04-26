## Problema

Ao usar o Ajuste de Estoque para zerar Brownie Avelã, o estoque físico foi corretamente para `0` no banco, mas a coluna "Saldo Real" da tela ficou em **−418**. Motivo:

- A coluna "Saldo Real" da página de Estoque mostra `saldoAtual − quantidadeSeparada − quantidadeDespachada` (pedidos já separados/despachados que ainda não baixaram o físico).
- O modal de Ajuste usava apenas o `saldoAtual` (físico bruto) como referência. Ao zerar, gravou saída do físico inteiro, mas as 418 unidades de pedidos pendentes continuam descontando na exibição.

A decisão é: **o Ajuste deve usar o Saldo Real como base**, para que o número final digitado pelo usuário corresponda ao que ele vê na tela (e zerar realmente signifique "Saldo Real = 0").

## Correções

### 1. `src/components/estoque/MovimentacaoEstoqueModal.tsx`
- Receber o `saldoReal` do produto como prop opcional (`saldoReferencia?: number`) — quando informado, é ele que vira `saldoAtual` para fins do cálculo de ajuste.
- Continuar buscando `saldo_produto` como fallback caso a prop não venha (compatibilidade com EstoqueProdutosTab antigo, EstoqueInsumosTab e Precificacao).
- Para insumos, manter o comportamento atual (sem expedição envolvida, segue usando `saldo_insumo`).
- Renomear o rótulo da linha do card para "Saldo disponível (real)" quando estamos usando Saldo Real, para deixar claro ao usuário.
- A diferença `quantidadeFinal − saldoReferencia` continua sendo registrada como entrada/saída no banco, mantendo a contabilidade do físico coerente. Ex.: saldo físico 1388, separados/despachados 418, saldo real 970. Usuário ajusta para 0 → grava saída de 970 → físico passa a 418, saldo real passa a 0.

### 2. `src/components/estoque/tabs/EstoqueProdutosTab.tsx`
- Passar `saldoReferencia={produto.saldoReal}` ao `MovimentacaoEstoqueModal`. O `produto` selecionado já vem do hook `useEstoqueComExpedicao` com `saldoReal` calculado.
- Após o ajuste, manter o `carregarSaldos()` atual no `handleCloseModal` para refletir o novo estado.

### 3. (Sem mudanças em `EstoqueInsumosTab.tsx` e `precificacao/EstoqueTab.tsx`)
Esses outros usos continuam usando o saldo físico, que é o correto para insumos e para a tela de precificação.

## Comportamento esperado após o fix

- Card do modal mostra: "Saldo disponível (real): 970 unidades" (no caso atual de Brownie Avelã, depois de tudo se reverter; ou o número equivalente em qualquer outro produto).
- Usuário digita `0` → sistema grava saída de 970 → físico vai a 418, Saldo Real vai a 0, status "Sem estoque".
- Usuário digita `N` → Saldo Real final = N exatamente.
- Não modifica banco nem RPCs; é apenas reinterpretação no frontend.

## Observação adicional

Não vou re-corrigir automaticamente o estado atual (Brownie Avelã com físico 0 e separados/despachados de 418). Para corrigir o caso já registrado, basta após o deploy abrir o modal e digitar `0` novamente — agora ele baseia o ajuste no Saldo Real (que está em −418), interpretando como "subir até 0" e gravará uma entrada de 418 unidades para igualar.
