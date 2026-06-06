## Objetivo
1. Mostrar de forma minimalista no card do pedido (Separação e Despacho) quando houver **trocas pendentes** e/ou **observação temporária** (observacoes_agendamento).
2. Ordenar as trocas na impressão da Lista de Separação usando a mesma regra dos produtos (`ordenarItensPorOrdemCategoria` baseada na ordem das categorias/produtos).

## Mudanças

### 1. `src/components/expedicao/PedidoCard.tsx`
- Estender `PedidoCardProps.pedido` com `observacoes_agendamento?: string` e `trocas_pendentes?: Array<{produto_nome; quantidade; motivo_nome?}>` (já chegam via `usePedidoConverter`).
- No `CardHeader`, ao lado dos badges existentes (TipoPedido, Antecipada, substatus), adicionar de forma minimalista:
  - **Badge de Trocas**: ícone `RefreshCw` + contagem (ex: `2 trocas`) quando `trocas_pendentes?.length > 0`. Estilo outline em tom amber, com `title` listando produtos+motivos para tooltip.
  - **Badge de Observação**: ícone `MessageSquare` (lucide) quando houver `observacoes_agendamento`, com `title` mostrando o texto completo.
- Funciona tanto em Separação quanto Despacho (mesmo componente).

### 2. `src/components/expedicao/components/PrintingActions.tsx`
- Em `imprimirListaSeparacao`, antes de iterar `trocasPendentes` na renderização (linha ~317), aplicar `ordenarItensPorOrdemCategoria(trocasPendentes, proporcoes)` — assim as trocas seguem a mesma ordem da aba Produtos, igual aos itens normais (`buildProdutosParaExibir` já faz isso).
- Sem mudanças visuais na coluna; apenas reordenação.

## Fora do escopo
- Sem alterações em banco, RLS, ou lógica de confirmação de entrega.
- Sem alterações em `usePedidoConverter.ts` (campos já passam adiante).
