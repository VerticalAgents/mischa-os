# Refatoração da aba Despacho

## Objetivo

Substituir as 3 sub-abas atuais (Entregas de Hoje / Entregas Pendentes / Separação Antecipada) por **presets de período** unificados, com filtros consistentes com a aba Separação, e transformar "antecipada" em um **badge visual** no card.

## Estado atual

- `src/components/expedicao/Despacho.tsx` recebe prop `tipoFiltro: "hoje" | "atrasadas" | "antecipada"` vinda das 3 sub-abas em `EntregasTab` (ou equivalente no `Expedicao.tsx`)
- Cada sub-aba renderiza o mesmo componente com filtro diferente vindo do `useExpedicaoStore` (`getPedidosParaDespacho`, `getPedidosAtrasados`, `getPedidosSeparadosAntecipados`)
- Já existe `WeekNavigator` usado quando `tipoFiltro === "atrasadas"` e modo `'semana'`
- Já existe `filtroRepresentantes` e `filtroTipoLogistica` no UI store

## Mudanças propostas

### 1. Remover sub-abas, adicionar barra de presets

Na aba **Despacho**, no topo (acima dos cards Resumo/Ações), uma barra única de presets:

```text
[ Hoje ] [ Esta semana ] [ Atrasados ] [ Todos ]    [filtros: rep, logística, status, busca]
```

- **Hoje** → entregas com `data_prevista_entrega = hoje` (não entregues)
- **Esta semana** → entregas da semana atual (dom-sáb), não entregues
- **Atrasados** → `data_prevista_entrega < hoje` e ainda não entregues
- **Todos** → tudo que está em fluxo de despacho (qualquer data, não entregue)

Estado salvo no `useExpedicaoUiStore`: `presetDespacho: 'hoje' | 'semana' | 'atrasados' | 'todos'` (default `'hoje'`).

### 2. Badge "Separação Antecipada" no PedidoCard

- No `PedidoCard`, quando `substatus_pedido === 'Separado'` **E** `data_prevista_entrega > hoje` → exibir badge âmbar/azul "Separação Antecipada" no header do card.
- Isso elimina a necessidade da sub-aba dedicada — o pedido antecipado aparece naturalmente quando o usuário filtra "Esta semana" ou "Todos".

### 3. Filtro de status do pedido

Adicionar select de status (já existe `filtroTipo` parcialmente) com opções claras:
`Todos · Agendado · Separado · Despachado`

### 4. Adaptar ResumoStatusCard e DespachoActionsCard

- `ResumoStatusCard` passa a receber o preset ativo e mostra contagens por status do conjunto filtrado.
- `DespachoActionsCard` mantém ações, mas habilita/desabilita botões conforme há pedidos no preset (ex: "Despachar em Massa" só ativo se houver Separados no filtro atual).

### 5. Limpeza

- Remover do `EntregasTab` (ou wrapper que monta as 3 sub-abas) as `Tabs/TabsList/TabsTrigger`.
- Manter as 3 funções do store (`getPedidosParaDespacho`, `getPedidosAtrasados`, `getPedidosSeparadosAntecipados`) — ainda úteis internamente como helpers de seleção.
- A lógica de "antecipada" deixa de existir como filtro de aba, vira só badge no card.

## Detalhes técnicos

**Arquivos a tocar:**
- `src/components/expedicao/Despacho.tsx` — remover prop `tipoFiltro`, usar `presetDespacho` do store
- `src/pages/Expedicao.tsx` (ou wrapper das sub-abas) — remover `Tabs` interno e renderizar `<Despacho />` direto
- `src/components/expedicao/PedidoCard.tsx` — adicionar badge "Separação Antecipada" condicional
- `src/components/expedicao/components/DespachoFilters.tsx` — adicionar barra de presets + select de status
- `src/components/expedicao/components/ResumoStatusCard.tsx` — adaptar título/conteúdo ao preset
- `src/components/expedicao/components/DespachoActionsCard.tsx` — ajustar habilitação dos botões
- `src/hooks/useExpedicaoUiStore.ts` — adicionar `presetDespacho` + setter, bump `version`

**Filtros (aplicados em cascata sobre `pedidos` do store):**
1. Filtro do preset (hoje/semana/atrasados/todos) sobre `data_prevista_entrega`
2. Excluir já entregues (`substatus !== 'Entregue'`)
3. Filtros de busca, status, representante, logística

**Badge antecipada:**
- Cor: âmbar (`bg-amber-100 text-amber-800` via token) para não conflitar com badges de status
- Tooltip: "Separado para entrega em DD/MM"

## Fora de escopo

- Filtro por rota de entrega (pode ser feito depois)
- Mudanças no fluxo de despacho/entrega em massa
- Mudanças nas outras abas (Separação, Documentos, Rota, Histórico, Dashboard)
