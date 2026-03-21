

## Plano: Adaptar UI mobile/tablet para todas as abas Operacionais

### Problema central
O componente `TabsList` usa `inline-flex` sem scroll horizontal, fazendo as abas ficarem apertadas/cortadas em telas menores. Além disso, grids fixos (7 colunas no calendário, 5 nos KPIs) não se adaptam.

### Mudanças

**1. `src/components/ui/tabs.tsx` — TabsList com scroll horizontal**
- Adicionar `overflow-x-auto` e `scrollbar-hide` ao TabsList base
- Adicionar `flex-nowrap` para impedir quebra de linha
- TabsTrigger ganha `shrink-0` para não encolher
- Isso corrige TODAS as páginas que usam Tabs de uma vez, sem quebrar desktop

**2. `src/components/agendamento/AgendamentoDashboard.tsx` — Calendário e filtros responsivos**
- Calendário Semanal: `grid-cols-3 sm:grid-cols-4 md:grid-cols-7` (3 colunas no mobile, 7 no desktop)
- Barra de filtros: empilhar verticalmente no mobile (`flex-col sm:flex-row`)
- Navegador de semana: `min-w-[140px]` no mobile, texto menor
- KPI cards: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`
- Gráficos: já usam `grid-cols-1 lg:grid-cols-2`, ok
- Card Probabilidade de Confirmação: empilhar header no mobile (`flex-col sm:flex-row`)
- Breakdown faixas: `flex-wrap` para não cortar no mobile

**3. `src/pages/Expedicao.tsx` — Sub-tabs de despacho**
- Sub-TabsList interna: adicionar `overflow-x-auto` (mesma correção do componente base já cobre)
- Nenhuma mudança extra necessária se o TabsList base for corrigido

**4. `src/pages/PCP.tsx` — Padding duplicado**
- Remover `container mx-auto py-6` do wrapper (já está dentro do AppLayout container)
- Manter consistência com as outras páginas que usam `space-y-6`

**5. `src/pages/Reagendamentos.tsx` — Padding mobile**
- Reduzir `p-6` para `p-3 sm:p-6` para não desperdiçar espaço no mobile

**6. `src/pages/Estoque.tsx` / `src/pages/EstoqueInsumos.tsx`**
- Já responsivos (usam `grid-cols-1 md:grid-cols-2` e `grid-cols-3`), sem mudanças

**7. `src/pages/ControleTrocas.tsx`**
- Já usa `space-y-6` simples, sem mudanças necessárias

### Resumo de arquivos
| Arquivo | Mudança |
|---------|---------|
| `src/components/ui/tabs.tsx` | Scroll horizontal no TabsList + shrink-0 nos triggers |
| `src/components/agendamento/AgendamentoDashboard.tsx` | Grid responsivo calendário, filtros, KPIs, card probabilidade |
| `src/pages/PCP.tsx` | Remover container/padding duplicado |
| `src/pages/Reagendamentos.tsx` | Padding responsivo |

### O que NÃO muda (desktop preservado)
- Todas as classes responsivas usam breakpoints (`sm:`, `md:`, `lg:`) — desktop mantém layout atual
- TabsList no desktop continua `inline-flex` normal (scroll só ativa quando necessário)
- Grids mantêm colunas originais nos breakpoints `md`/`lg`

