

# Plano: Melhorar Seção Superior da Página de Separação

## Objetivo
Reorganizar a parte superior da página de Separação para:
1. Reduzir o card de produtos necessários (metade esquerda) com layout igual ao PCP
2. Mover botões de ação para a metade direita
3. Adicionar seletor de semana ao filtro de data

---

## 1. Redesign do Card de Produtos Necessários

### Componente: `ResumoQuantidadeProdutos.tsx`

Substituir o layout atual (grid horizontal largo) pelo design do PCP:

**Layout Atual:**
```
+------------------------------------------------------------------+
| Produtos necessários para separação          Total: X unidades   |
| [Grid horizontal com 5 cards de produtos lado a lado]            |
+------------------------------------------------------------------+
```

**Novo Layout (igual ao PCP):**
```
+--------------------------------+
| Quantidade Total Necessária    |
| 1378                           |
| [38 pedidos]                   |
+--------------------------------+
| Detalhes por Produto      [^]  |
+--------------------------------+
| 📦 Brownie Avelã         [358] |
| 📦 Brownie Stikadinho    [352] |
| 📦 Brownie Choco Duo     [267] |
| 📦 Brownie Oreo Cream    [180] |
+--------------------------------+
```

**Estrutura:**
- Card compacto com largura de 50% (lado esquerdo)
- Bloco de destaque com total e badge de pedidos
- Collapsible para detalhes por produto (igual ProjecaoProducaoTab)
- Lista vertical de produtos com nome e quantidade em Badge

---

## 2. Card de Ações à Direita

### Novo Componente: `SeparacaoActionsCard.tsx`

Card que agrupa todos os botões de ação no lado direito:

```
+--------------------------------+
| Ações                          |
+--------------------------------+
| [📋 Separar em Massa]          |
| [📤 Gerar Vendas]              |
| [🖨️ Listas de Expedição]       |
| [🏷️ Etiquetas]                 |
| [🔄 Atualizar]                 |
+--------------------------------+
```

**Props:**
- onSepararEmMassa
- onGerarVendas
- pedidosFiltrados (para PrintingActions)
- onAtualizar
- isLoading

---

## 3. Seletor de Período (Dia ou Semana)

### Alterações no `useExpedicaoUiStore.ts`

Adicionar estados para controlar modo de visualização na separação:

```typescript
// Novos estados
modoDataSeparacao: 'dia' | 'semana';
semanaSeparacao: string; // ISO date

// Novas ações
setModoDataSeparacao: (modo: 'dia' | 'semana') => void;
setSemanaSeparacao: (data: Date) => void;
```

### Alterações no `SeparacaoFilters.tsx`

Substituir o input de data simples por um seletor combinado:

**Novo Layout do Filtro de Data:**
```
+------------------------------------------------+
| [Dia ▼] [Semana ▼]                             |
| [<] 26/01 - 01/02/2026 [>] | [Semana Atual]   |
+------------------------------------------------+
```

**Comportamento:**
- Modo "Dia": Input de data como está hoje
- Modo "Semana": WeekNavigator com navegação por setas

### Integração com WeekNavigator

Reutilizar o componente `WeekNavigator` existente dentro do SeparacaoFilters quando o modo for "semana".

---

## 4. Alterações no `SeparacaoPedidos.tsx`

### Layout Principal

Reorganizar para:

```
+-------------------------------------------------------+
|  [Card Produtos Necessários]  |  [Card Ações]         |
|  (50% largura)                |  (50% largura)        |
+-------------------------------------------------------+
| Título: Separação de Pedidos  | Badge: X pedidos      |
+-------------------------------------------------------+
| [Filtros com seletor de semana]                       |
+-------------------------------------------------------+
| Lista de Pedidos...                                   |
+-------------------------------------------------------+
```

### Lógica de Filtragem por Semana

```typescript
// Quando modoDataSeparacao === 'semana'
const matchData = modoDataSeparacao === 'dia'
  ? (!filtroData || format(pedido.data_prevista_entrega, "yyyy-MM-dd") === filtroData)
  : (dataPedido >= inicioSemana && dataPedido <= fimSemana);
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/expedicao/components/ResumoQuantidadeProdutos.tsx` | Redesign completo com layout estilo PCP |
| `src/components/expedicao/components/SeparacaoActionsCard.tsx` | Criar novo componente |
| `src/components/expedicao/components/SeparacaoFilters.tsx` | Adicionar seletor dia/semana com WeekNavigator |
| `src/hooks/useExpedicaoUiStore.ts` | Adicionar estados para modo semana na separação |
| `src/components/expedicao/SeparacaoPedidos.tsx` | Reorganizar layout e integrar novos componentes |

---

## Detalhes de Implementação

### ResumoQuantidadeProdutos (novo design)

```typescript
interface ResumoQuantidadeProdutosProps {
  pedidos: any[];
  className?: string; // Para controlar largura externamente
}

// Estrutura interna:
// - Collapsible para detalhes
// - Badge com total de pedidos
// - Lista vertical com ícones Package
// - Indicadores de estoque mantidos
```

### SeparacaoActionsCard

```typescript
interface SeparacaoActionsCardProps {
  onSepararEmMassa: () => void;
  onGerarVendas: () => void;
  onAtualizar: () => void;
  isLoading: boolean;
  pedidosFiltrados: any[]; // Para passar ao PrintingActions
}
```

### SeparacaoFilters (com seletor de período)

Novas props:
```typescript
interface SeparacaoFiltersProps {
  // ... props existentes
  modoData: 'dia' | 'semana';
  semanaSelecionada: Date;
  onModoDataChange: (modo: 'dia' | 'semana') => void;
  onSemanaSelecionadaChange: (data: Date) => void;
}
```

---

## Fluxo de Usuário

### Visualizar por Dia (padrão atual)
1. Modo "Dia" selecionado
2. Input de data aparece normalmente
3. Filtro mostra pedidos do dia selecionado

### Visualizar por Semana
1. Usuário clica em "Semana"
2. Input de data é substituído pelo WeekNavigator
3. Navegação por setas para mudar semana
4. Filtro mostra pedidos de toda a semana selecionada
5. Botão "Semana Atual" volta para semana corrente

---

## Considerações de Design

- Card de produtos usa cores primary/10 para destaque (igual PCP)
- Collapsible fechado por padrão para economizar espaço
- Botões de ação agrupados verticalmente com espaçamento consistente
- Grid responsivo: em mobile os cards ficam empilhados
- Transição suave entre modos dia/semana no filtro

