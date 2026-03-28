

## Plano: Filtro por Tipo de Logística no Despacho

### O que será feito
Adicionar um filtro multi-select de "Tipo de Logística" na aba de Despacho, com as opções: Própria, Retirada, Terceirizada e "Sem logística cadastrada" (para clientes sem `tipo_logistica`). O padrão visual e comportamento seguem o mesmo padrão do filtro de Representantes existente.

### Alterações

**1. `src/hooks/useExpedicaoStore.ts`**
- Adicionar `tipo_logistica?: string` à interface `PedidoExpedicao`
- Incluir `tipo_logistica` no `select` das queries de clientes (2 locais: `carregarPedidos` e `recarregarSilencioso`)
- Mapear `cliente?.tipo_logistica` ao montar o objeto pedido (2 locais)

**2. `src/components/expedicao/components/TipoLogisticaFilter.tsx`** (novo)
- Componente multi-select com Popover + Checkboxes, idêntico ao `RepresentantesFilter`
- Opções fixas: Própria, Terceirizada, Retirada + "Sem logística" (valor sentinela `"_sem_logistica"`)
- Ícone `Truck` em vez de `Users`

**3. `src/components/expedicao/components/DespachoFilters.tsx`**
- Adicionar props `filtroTipoLogistica: string[]` e `onFiltroTipoLogisticaChange`
- Incluir `TipoLogisticaFilter` no grid (mudar grid para `md:grid-cols-4`)
- Incrementar contagem de filtros ativos

**4. `src/components/expedicao/Despacho.tsx`**
- Adicionar state `filtroTipoLogistica: string[]` (inicialmente `[]`)
- Adicionar bloco de filtragem no `useMemo` de `pedidosFiltrados`:
  - `"_sem_logistica"` filtra pedidos onde `tipo_logistica` é null/undefined/vazio
  - Demais valores comparam diretamente com `pedido.tipo_logistica`
- Passar props ao `DespachoFilters`

### Valores do filtro
Os valores canônicos no banco são: `PROPRIA`, `TERCEIRIZADA`, `RETIRADA`. O filtro compara diretamente com esses valores. A opção "Sem logística" captura `null`, `undefined` ou string vazia.

