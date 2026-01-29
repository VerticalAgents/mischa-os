
# Plano: Melhorias nos Filtros e Acoes em Massa da Expedicao

## 1. Novo Filtro "Ver Todos" na Aba Entregas Pendentes

### Alteracao no WeekNavigator.tsx
Adicionar botao "Ver Todos" ao lado do botao "Semana Atual" para permitir visualizar todos os agendamentos pendentes de confirmacao sem filtro de semana.

**Nova prop:**
- `modoVisualizacao: 'semana' | 'todos'`
- `onMudarModoVisualizacao: (modo: 'semana' | 'todos') => void`

**Novo visual:**
```
+------------------------------------------------------------+
| < | 20/01 - 26/01/2026 | > | [Semana Atual] | [Ver Todos] |
+------------------------------------------------------------+
```

### Alteracao no useExpedicaoUiStore.ts
Adicionar novo estado:
- `modoVisualizacaoAtrasados: 'semana' | 'todos'`
- `setModoVisualizacaoAtrasados: (modo: 'semana' | 'todos') => void`

### Alteracao no Despacho.tsx
Quando `modoVisualizacaoAtrasados === 'todos'`:
- Desabilitar navegacao por semana (setas)
- Mostrar todos os pedidos atrasados sem filtro de data

---

## 2. Botoes de Acoes em Massa na Aba Separacao de Pedidos

### Novos Componentes a Criar

**SeparacaoEmMassaDialog.tsx**
Modal similar ao DespachoEmMassaDialog para separacao em massa:
- Lista de pedidos com status 'Agendado' com checkbox
- Checkbox "Selecionar todos"
- Contador de selecionados
- Botao "Confirmar Separacao"

**GerarVendasEmMassaDialog.tsx**
Modal para gerar vendas no GestaoClick em massa:
- Lista de pedidos com checkbox (filtrar os que NAO tem gestaoclick_venda_id)
- Checkbox "Selecionar todos"
- Contador de selecionados
- Botao "Gerar Vendas"

### Alteracao no SeparacaoPedidos.tsx
Adicionar toolbar com botoes:
- **"Separar em Massa"** - Abre SeparacaoEmMassaDialog
- **"Gerar Vendas"** - Abre GerarVendasEmMassaDialog (nome atualizado)

### Alteracao no PedidoCard.tsx
Renomear botao "Gerar Venda GC" para **"Gerar Venda"** (linha ~318)

---

## 3. Melhorar Layout dos Filtros

### Alteracao no DespachoFilters.tsx
Redesign para layout mais funcional:
- Organizar em grupos logicos
- Melhor responsividade
- Indicadores visuais de filtros ativos

**Novo layout:**
```
+--------------------------------------------------------------+
| Busca                   | Status      | Representante | Total |
| [________________🔍]    | [Dropdown]  | [Dropdown]    | X ped |
+--------------------------------------------------------------+
```

### Criar SeparacaoFilters.tsx
Novo componente de filtros para aba Separacao com mesmo padrao:
- Campo de busca por texto
- Filtro por tipo de pedido (Padrao/Alterado)
- Filtro por data
- Filtro por representante

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/expedicao/components/WeekNavigator.tsx` | Adicionar botao "Ver Todos" |
| `src/hooks/useExpedicaoUiStore.ts` | Adicionar estado modoVisualizacaoAtrasados |
| `src/components/expedicao/Despacho.tsx` | Integrar modo "Ver Todos" |
| `src/components/expedicao/components/SeparacaoEmMassaDialog.tsx` | Criar |
| `src/components/expedicao/components/GerarVendasEmMassaDialog.tsx` | Criar |
| `src/components/expedicao/SeparacaoPedidos.tsx` | Adicionar toolbar e modais |
| `src/components/expedicao/PedidoCard.tsx` | Renomear botao para "Gerar Venda" |
| `src/components/expedicao/components/DespachoFilters.tsx` | Melhorar layout |
| `src/components/expedicao/components/SeparacaoFilters.tsx` | Criar |

---

## Detalhes Tecnicos

### SeparacaoEmMassaDialog Props
```typescript
interface SeparacaoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[]; // Pedidos com status 'Agendado'
  onConfirm: (pedidoIds: string[]) => Promise<void>;
}
```

### GerarVendasEmMassaDialog Props
```typescript
interface GerarVendasEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[]; // Pedidos sem gestaoclick_venda_id
  onConfirm: (pedidoIds: string[]) => Promise<void>;
  loading: boolean;
}
```

### Handler para Gerar Vendas em Massa (SeparacaoPedidos.tsx)
```typescript
const handleGerarVendasEmMassa = async (pedidoIds: string[]) => {
  for (const pedidoId of pedidoIds) {
    const pedido = pedidosFiltrados.find(p => p.id === pedidoId);
    if (pedido && !pedido.gestaoclick_venda_id) {
      await gerarVendaGC(pedidoId, pedido.cliente_id);
    }
  }
  await carregarPedidos();
};
```

---

## Fluxo de Usuario

### Separacao em Massa
1. Usuario acessa Expedicao > Separacao de Pedidos
2. Clica em "Separar em Massa"
3. Modal abre com pedidos 'Agendado'
4. Seleciona pedidos desejados
5. Clica "Confirmar Separacao"
6. Pedidos selecionados sao marcados como 'Separado'

### Gerar Vendas em Massa
1. Usuario acessa Expedicao > Separacao de Pedidos
2. Clica em "Gerar Vendas"
3. Modal abre com pedidos que NAO tem venda GC
4. Seleciona pedidos desejados
5. Clica "Gerar Vendas"
6. Sistema processa vendas sequencialmente no GestaoClick

### Ver Todos os Pendentes
1. Usuario acessa Expedicao > Despacho > Entregas Pendentes
2. Visualiza por semana (padrao)
3. Clica em "Ver Todos"
4. Navegacao por semana e desabilitada
5. Exibe todos os pedidos pendentes
6. Clica em "Semana Atual" para voltar ao modo filtrado
