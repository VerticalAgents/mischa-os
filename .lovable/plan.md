
# Plano: Aprimorar Botoes de Acoes em Massa na Expedicao

## Objetivo
Melhorar a experiencia das acoes em massa nas abas "Entregas Hoje" e "Entregas Pendentes", adicionando modais com selecao individual e seletor de data para confirmacao de entrega.

## Alteracoes de Nomenclatura

| Atual | Novo |
|-------|------|
| Despachar Todos | Despachar em Massa |
| Entregar Todos | Entregar em Massa |
| Retorno em Massa | *(Remover)* |

## Novos Componentes

### 1. DespachoEmMassaDialog
**Novo arquivo:** `src/components/expedicao/components/DespachoEmMassaDialog.tsx`

Modal para despacho em massa com:
- Lista de pedidos com checkbox para selecao individual
- Checkbox "Selecionar todos" no cabecalho
- Contador de selecionados/total
- Botoes Cancelar e Confirmar Despacho

```text
+--------------------------------------------------+
| Despachar em Massa                               |
| Selecione os pedidos que deseja despachar        |
+--------------------------------------------------+
| [x] Selecionar todos              3 de 5 selecionados |
+--------------------------------------------------+
| [x] Cliente A                                    |
| [x] Cliente B                                    |
| [ ] Cliente C                                    |
| [x] Cliente D                                    |
| [ ] Cliente E                                    |
+--------------------------------------------------+
|                    [Cancelar] [Confirmar (3)]    |
+--------------------------------------------------+
```

### 2. EntregaEmMassaDialog
**Novo arquivo:** `src/components/expedicao/components/EntregaEmMassaDialog.tsx`

Modal para entrega em massa com:
- Seletor de data para confirmacao (padrao: hoje)
- Lista de pedidos com checkbox para selecao individual
- Checkbox "Selecionar todos" no cabecalho
- Contador de selecionados/total
- Botoes Cancelar e Confirmar Entrega

```text
+--------------------------------------------------+
| Entregar em Massa                                |
| Selecione os pedidos e a data de entrega         |
+--------------------------------------------------+
| Data de Entrega: [29 de Janeiro de 2026]    [v]  |
+--------------------------------------------------+
| [x] Selecionar todos              4 de 4 selecionados |
+--------------------------------------------------+
| [x] Cliente A - Despachado                       |
| [x] Cliente B - Despachado                       |
| [x] Cliente C - Despachado                       |
| [x] Cliente D - Despachado                       |
+--------------------------------------------------+
|                    [Cancelar] [Confirmar (4)]    |
+--------------------------------------------------+
```

### 3. Hook useAcaoEmMassaDialog
**Novo arquivo:** `src/hooks/useAcaoEmMassaDialog.ts`

Hook reutilizavel para gerenciar estado dos modais:
- Estado de abertura do modal
- Conjunto de IDs selecionados
- Funcoes toggleEntrega, toggleAll
- Data selecionada (para entrega)
- Loading state

## Modificacoes em Arquivos Existentes

### src/components/expedicao/Despacho.tsx

**Remover:**
- Botao "Retorno em Massa" (linhas 356-364)

**Renomear:**
- "Despachar Todos" para "Despachar em Massa"
- "Entregar Todos" para "Entregar em Massa"

**Adicionar:**
- Estado para controlar abertura dos modais
- Importacao dos novos componentes Dialog
- Handler para abrir modal de despacho em massa
- Handler para abrir modal de entrega em massa
- Renderizacao dos modais no final do componente

**Logica de Filtragem nos Modais:**
- DespachoEmMassaDialog: Mostra pedidos com `substatus_pedido === 'Separado'`
- EntregaEmMassaDialog: Mostra pedidos com `substatus_pedido === 'Despachado'`

## Fluxo de Usuario

### Despacho em Massa
1. Usuario clica em "Despachar em Massa"
2. Modal abre com lista de pedidos SEPARADOS (prontos para despacho)
3. Usuario seleciona/deseleciona pedidos individuais
4. Usuario clica "Confirmar Despacho"
5. Sistema processa despacho para pedidos selecionados
6. Modal fecha e lista atualiza

### Entrega em Massa
1. Usuario clica em "Entregar em Massa"
2. Modal abre com lista de pedidos DESPACHADOS
3. Usuario seleciona data de entrega (padrao: hoje)
4. Usuario seleciona/deseleciona pedidos individuais
5. Usuario clica "Confirmar Entrega"
6. Sistema processa entrega para pedidos selecionados com a data escolhida
7. Modal fecha e lista atualiza

## Detalhes Tecnicos

### DespachoEmMassaDialog Props
```typescript
interface DespachoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[]; // Pedidos com status 'Separado'
  onConfirm: (pedidoIds: string[]) => Promise<void>;
}
```

### EntregaEmMassaDialog Props
```typescript
interface EntregaEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[]; // Pedidos com status 'Despachado'
  onConfirm: (pedidoIds: string[], dataEntrega: Date) => Promise<void>;
}
```

### Modificacao no useConfirmacaoEntrega
O hook `useConfirmacaoEntrega` ja aceita `dataEntrega` como parametro opcional na funcao `confirmarEntrega`. Para a entrega em massa, precisaremos:
1. Modificar `confirmarEntregaEmMassa` para aceitar uma data de entrega
2. Passar essa data para cada chamada de `process_entrega_safe`

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/expedicao/components/DespachoEmMassaDialog.tsx` | Criar |
| `src/components/expedicao/components/EntregaEmMassaDialog.tsx` | Criar |
| `src/hooks/useAcaoEmMassaDialog.ts` | Criar |
| `src/components/expedicao/Despacho.tsx` | Modificar |
| `src/hooks/useConfirmacaoEntrega.ts` | Modificar (adicionar dataEntrega ao massa) |
