

## Plano: Incorporar permissão de edição (can_edit) em todas as páginas

### Diagnóstico
O sistema tem duas camadas:
1. **`EditPermissionProvider`** — já envolve 5 páginas (Agendamento, Expedição, Estoque, PCP, Precificação) com o valor correto de `canEdit`
2. **`useEditPermission()`** — **nunca é consumido por nenhum componente**. Nenhum botão, formulário ou ação verifica `canEdit` antes de renderizar

Além disso, **9 páginas** não têm sequer o `EditPermissionProvider`: GestaoFinanceira, DashboardAnalytics, AnaliseGiro, GestaoComercial, Clientes, ControleTrocas, Reagendamentos, Mapas, Configuracoes.

### Estratégia

**Parte 1 — Adicionar `EditPermissionProvider` às 9 páginas faltantes**

Cada página recebe `useRoutePermission` + `EditPermissionProvider` envolvendo o conteúdo, seguindo o mesmo padrão já usado em Agendamento.tsx.

| Página | Route key |
|--------|-----------|
| GestaoFinanceira | `/gestao-financeira` |
| DashboardAnalytics | `/dashboard-analytics` |
| AnaliseGiro | `/analise-giro` |
| GestaoComercial | `/gestao-comercial` |
| Clientes | `/clientes` |
| ControleTrocas | `/controle-trocas` |
| Reagendamentos | `/reagendamentos` |
| Mapas | `/mapas` |
| Configuracoes | `/configuracoes` |

**Parte 2 — Consumir `useEditPermission` nos componentes com ações de escrita**

Para cada componente que possui botões de criar/editar/excluir, importar `useEditPermission` e:
- **Esconder** o botão quando `!canEdit` (para botões "Novo X", "Adicionar")
- **Desabilitar** (`disabled={!canEdit}`) para ações inline (editar/excluir em tabelas)

Componentes-alvo por página (os que possuem ações de escrita identificadas):

| Página | Componentes com ações de edição |
|--------|-------------------------------|
| Agendamento | `AgendamentoDashboard` (confirmar entrega, editar agendamento), `TodosAgendamentos` |
| Expedição | `DespachoPedidos`, componentes de confirmação |
| Estoque | `EstoqueTab` (novo insumo, editar, excluir), `MovimentacoesTab` |
| PCP | `HistoricoProducaoTab`, `ProducaoDiariaTab`, `PlanejamentoProducao` |
| Precificação | `InsumosTab` (novo insumo, editar), `ProdutosFinaisTab`, `ProporcoesTab` |
| Gestão Financeira | `CustosTab` (adicionar custo, editar), `ParcelamentosTab` |
| Gestão Comercial | `FunilLeads`, `Distribuidores`, `Parceiros`, `RepresentantesOptimized` |
| Clientes | `Clientes.tsx` (novo cliente, editar, excluir, bulk actions), `ClienteDetailsView` |
| Controle de Trocas | `TrocasDashboard`, `TrocasHistoricoTable` |
| Reagendamentos | `ReagendamentosTable` (excluir) |
| Configurações | `ConfiguracoesTabs` e sub-tabs |

**Padrão aplicado em cada componente:**
```tsx
import { useEditPermission } from "@/contexts/EditPermissionContext";

// Dentro do componente:
const { canEdit } = useEditPermission();

// Botão "Novo X" — esconder quando sem permissão:
{canEdit && <Button onClick={...}>Novo Item</Button>}

// Botão inline de editar/excluir — desabilitar:
<Button disabled={!canEdit} onClick={...}>Editar</Button>
```

### Páginas somente leitura (sem mudança interna)
- **DashboardAnalytics** e **AnaliseGiro** — são painéis analíticos sem ações de escrita. Recebem o Provider por consistência mas nenhum componente interno precisa de mudança.
- **Mapas** — visualização apenas.

### Arquivos alterados (~25-30 arquivos)
- 9 páginas: adicionar Provider
- ~15-20 componentes: consumir `useEditPermission` e guardar botões de edição

### Desktop e funcionalidade preservados
Admins continuam com `canEdit: true` em todas as rotas — sem impacto. Staff com `can_edit: false` verão os dados mas sem botões de criar/editar/excluir.

