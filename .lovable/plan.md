## Objetivo

No dialog "Entregar em Massa" (aba Despacho), permitir confirmar a entrega de cada pedido usando a **própria data de agendamento (`data_prevista_entrega`)**, em vez de obrigar uma data única para todos.

## Mudanças

### 1. `EntregaEmMassaDialog.tsx`
- Adicionar um toggle/switch no topo: **"Usar a data de agendamento de cada pedido"** (ligado por padrão, já que é o caso mais comum).
- Quando **ligado**: oculta o seletor de "Data de Entrega" único e mostra um aviso curto ("Cada pedido será entregue na sua data agendada: 03/06, 05/06, etc.").
- Quando **desligado**: mostra o seletor de data atual (comportamento existente) aplicado a todos os pedidos.
- Em cada linha da lista de pedidos, manter a data exibida (`03/06`) para o usuário ver qual data será usada.
- Mudar a assinatura de `onConfirm` para aceitar opcionalmente "usar data do agendamento":
  - `onConfirm(pedidoIds: string[], dataEntrega: Date | null, usarDataAgendamento: boolean)`

### 2. `Despacho.tsx` — `handleConfirmarEntregaEmMassa`
- Repassar a nova flag e, quando `usarDataAgendamento === true`, incluir `data_prevista_entrega` de cada pedido no payload enviado ao hook.

### 3. `useConfirmacaoEntrega.ts` — `confirmarEntregaEmMassa`
- Aceitar opção `{ usarDataAgendamento?: boolean }` além do `dataEntrega` opcional.
- No loop que chama `process_entrega_safe`, calcular `p_data_entrega` por pedido:
  - Se `usarDataAgendamento` → usar `pedido.data_prevista_entrega.toISOString()`.
  - Senão → usar `dataEntrega.toISOString()` (comportamento atual).
  - Se nenhum disponível → `null` (servidor usa default).
- Adicionar `data_prevista_entrega?: Date | string` ao tipo `PedidoEntrega` consumido pela função.

### Detalhes técnicos
- Nenhuma mudança em RPC/banco: `process_entrega_safe` já aceita `p_data_entrega` por chamada.
- Manter validações de estoque consolidado como estão.
- UI: usar `Switch` do shadcn já existente; manter design minimalista atual do dialog.
