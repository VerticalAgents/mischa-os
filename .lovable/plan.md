
# Plano: Filtro por Semana na Aba "Entregas Pendentes"

## Objetivo
Adicionar um navegador de semanas na aba "Entregas Pendentes" (despacho > atrasadas), similar ao existente no Dashboard de Agendamentos, permitindo filtrar os pedidos pendentes por período semanal.

## Componentes Afetados

### 1. Criar Componente de Navegação de Semana
**Novo arquivo:** `src/components/expedicao/components/WeekNavigator.tsx`

Componente reutilizável para navegação entre semanas, seguindo o padrão do AgendamentoDashboard:
- Botões de navegação (semana anterior / próxima)
- Botão "Hoje" para voltar à semana atual
- Display do período selecionado (ex: "20/01 - 26/01/2026")
- Indicador visual quando está na semana atual

```
┌──────────────────────────────────────────────────────────┐
│  ◀  │  20/01 - 26/01/2026  │  ▶  │  [Semana Atual]      │
└──────────────────────────────────────────────────────────┘
```

### 2. Modificar Store de UI da Expedição
**Arquivo:** `src/hooks/useExpedicaoUiStore.ts`

Adicionar estado persistente para a semana selecionada nas entregas pendentes:
- `semanaAtrasados: Date` - data de referência da semana
- `setSemanaAtrasados: (date: Date) => void`

### 3. Atualizar Componente Despacho
**Arquivo:** `src/components/expedicao/Despacho.tsx`

Para o `tipoFiltro === "atrasadas"`:
- Importar e renderizar o `WeekNavigator`
- Consumir `semanaAtrasados` do store de UI
- Filtrar os pedidos atrasados pela semana selecionada usando `startOfWeek` e `endOfWeek`
- Manter comportamento "todos os atrasados" como padrão, com opção de filtrar por semana

### 4. Atualizar Filtros de Despacho
**Arquivo:** `src/components/expedicao/components/DespachoFilters.tsx`

Adicionar prop opcional para integrar o navegador de semana no layout de filtros existente.

## Lógica de Filtragem

```text
Pedidos Atrasados (antes de hoje)
        │
        ▼
┌─────────────────────────────┐
│  Filtro por Semana          │
│  (startOfWeek ≤ data ≤      │
│   endOfWeek da semana       │
│   selecionada)              │
└─────────────────────────────┘
        │
        ▼
Pedidos da semana selecionada
```

## Implementação Detalhada

### WeekNavigator.tsx
```typescript
interface WeekNavigatorProps {
  semanaAtual: Date;
  onSemanaChange: (data: Date) => void;
  onVoltarHoje: () => void;
  ehSemanaAtual: boolean;
}
```

Props:
- `semanaAtual`: Data de referência para a semana atual
- `onSemanaChange`: Callback ao navegar para outra semana
- `onVoltarHoje`: Callback para voltar à semana atual
- `ehSemanaAtual`: Boolean indicando se está na semana atual (para desabilitar botão)

### useExpedicaoUiStore.ts (adições)
```typescript
// Novo estado
semanaAtrasados: Date;

// Nova ação  
setSemanaAtrasados: (data: Date) => void;
```

### Despacho.tsx (modificações)
1. Importar `startOfWeek`, `endOfWeek`, `subWeeks`, `addWeeks`, `isSameDay` do date-fns
2. Consumir `semanaAtrasados` e `setSemanaAtrasados` do store
3. Criar funções `navegarSemanaAnterior` e `navegarProximaSemana`
4. Aplicar filtro adicional nos `pedidosBase` quando `tipoFiltro === "atrasadas"`
5. Renderizar `WeekNavigator` apenas para entregas pendentes

## Fluxo de Usuário

1. Usuário acessa Expedição > Despacho > Entregas Pendentes
2. Por padrão, vê a semana atual (ou últimos 7 dias de atraso)
3. Pode navegar para semanas anteriores usando as setas
4. Ao clicar em "Semana Atual", volta para a visualização padrão
5. O filtro de semana funciona em conjunto com os filtros existentes (texto, status, representante)

## Persistência
O estado da semana selecionada será persistido no localStorage através do `useExpedicaoUiStore` que já usa `zustand/persist`, garantindo que o usuário mantenha sua seleção ao navegar entre abas.
