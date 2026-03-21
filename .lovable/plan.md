

## Plano: Grid de abas mobile/tablet para todas as páginas com tabs

### Padrão a aplicar
Mesmo padrão já usado no `Agendamento.tsx`: grid 2 colunas no mobile/tablet (`<lg`), `TabsList` horizontal original no desktop (`lg+`).

### Páginas que precisam da mudança (9 arquivos)

| Página | Abas | Situação atual |
|--------|------|---------------|
| `Expedicao.tsx` | 8 + 3 sub-tabs | `TabsList` horizontal, scroll |
| `GestaoFinanceira.tsx` | 7 | `grid-cols-7` — impossível no mobile |
| `DashboardAnalytics.tsx` | 7 | horizontal com overflow-x-auto |
| `AnaliseGiro.tsx` | 5 | `grid-cols-5` — apertado |
| `Precificacao.tsx` | 4 | `grid-cols-4` |
| `GestaoComercial.tsx` | 4 | horizontal |
| `PCP.tsx` | 4 | horizontal |
| `EstoqueInsumos.tsx` | 3 | `grid-cols-3` |
| `ClienteDetalhesTabs.tsx` | 5 | `grid-cols-5` — apertado |

### Mudança por arquivo

Para cada um:
1. Adicionar bloco `<div className="grid grid-cols-2 gap-2 lg:hidden">` com botões estilizados (ativo: `bg-background shadow-sm`, inativo: `bg-muted`)
2. Adicionar `hidden lg:inline-flex` (ou `hidden lg:grid`) ao `TabsList` existente para escondê-lo no mobile
3. Sub-tabs (Expedição despacho) recebem o mesmo tratamento
4. Manter `TabsContent` inalterado — controlado pelo `value` do `Tabs`

### Páginas SEM tabs (sem mudanças)
- Reagendamentos, ControleTrocas, Clientes, Mapas

### Desktop preservado
Todas as classes usam `lg:` — desktop não muda.

