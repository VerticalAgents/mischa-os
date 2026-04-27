## Objetivo

Transformar os dois cards da Home do representante (`/rep/home`) em ferramentas de urgência operacional:

1. **Card amarelo** — Agendamentos previstos da **semana atual** (segunda a domingo), com um mini-bloco acima mostrando o **total de brownies** desses agendamentos.
2. **Card vermelho** — Agendamentos **pendentes** ("Agendar"/"Pendente"), renomeado para "Agendamentos pendentes", para o representante priorizar retomadas.

## Mudanças

### 1. `src/hooks/useRepDashboardData.ts`
- Substituir `proximos7Dias` por **`previstosSemanaAtual`**: filtrar agendamentos com `status_agendamento === "Previsto"` cuja `data_proxima_reposicao` esteja entre segunda e domingo da semana corrente (usar `startOfWeek`/`endOfWeek` do `date-fns`, `weekStartsOn: 1`).
- Adicionar **`totalBrowniesPrevistosSemana`**: soma de `quantidade_total` dos itens de `previstosSemanaAtual`.
- Renomear `pendentesConfirmacao` → **`agendamentosPendentes`**: filtrar somente `status_agendamento ∈ {"Agendar", "Pendente"}` (remover "Previsto" daqui, já que agora vai no card amarelo).
- Atualizar a interface `RepDashboardData` com os novos campos.

### 2. `src/pages/rep/RepHome.tsx`

**Card 1 — Previstos da semana (amarelo)**
- Título: `"Previstos da semana"` com ícone `Clock`.
- Acima da lista, um **bloco compacto** destacando: `"X brownies a confirmar esta semana"` (X = `totalBrowniesPrevistosSemana`).
- Estilo amarelo: borda + fundo suave usando tokens `border-yellow-400/60 bg-yellow-50` (header com `text-yellow-900`), badges dos itens em variante amarela.
- Vazio: `"Nenhum agendamento previsto para esta semana."`

**Card 2 — Agendamentos pendentes (vermelho)**
- Título: `"Agendamentos pendentes"` com ícone `AlertCircle`.
- Estilo vermelho usando o vermelho da marca (`#d1193a` via tokens existentes — borda `border-destructive/60`, fundo `bg-destructive/5`, badges `destructive`).
- Subtítulo no header: `"Retome esses clientes o quanto antes"` em texto pequeno.
- Vazio: `"Nenhum cliente pendente. 🎉"`

**Componente `AgendamentoList`**
- Aceitar uma prop opcional `tone: "warning" | "danger"` para colorir o badge de status de cada linha (amarelo no card 1, vermelho no card 2), mantendo o restante do layout.

### 3. Layout
- Manter ordem atual: KPIs → Card amarelo (previstos da semana) → Card vermelho (pendentes).
- O mini-bloco de "total de brownies" fica **dentro** do card amarelo, no topo do `CardContent`, antes da lista — com destaque visual (número grande, fundo amarelo um pouco mais saturado).

## Notas técnicas
- Tokens de cor: usar utilitários Tailwind compatíveis com o tema (`yellow-*` para alertas/avisos, `destructive` para o vermelho de marca já mapeado).
- Manter ordenação por `data_proxima_reposicao` ascendente nos dois cards.
- Manter `slice(0, 10)` para limitar a lista exibida (poderá ser revisto depois se necessário).
- Nenhuma migração de banco necessária — apenas mudança de filtros no hook e UI.
