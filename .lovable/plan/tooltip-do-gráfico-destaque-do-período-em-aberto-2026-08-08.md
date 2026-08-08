# Tooltip do gráfico + destaque do período em aberto

## O que está errado hoje

1. **Tooltip colado / bagunçado** — o texto sai como `6.000 unOdara Alfajores` porque o formatador devolve valor e nome como duas partes que o tooltip cola uma na outra, sem espaço nem alinhamento. Também não há total do dia/semana/mês.
2. **"0 un Revenda Padrão"** — o gráfico cria uma entrada para toda categoria selecionada em todo bucket, mesmo quando não houve produção, e o tooltip lista essas categorias com zero. Não é erro de dado: naquele dia realmente não houve produção de Revenda Padrão.
3. **Período atual misturado com os fechados** — a última barra (dia/semana/mês corrente) aparece igual às demais, dando impressão de queda quando só está incompleta.

## O que vou fazer

**Tooltip novo (conteúdo próprio, não o padrão)**
- Cabeçalho com o rótulo do período (ex. "13/07" ou "Jul/26"); no bucket atual, um selo "em andamento".
- Uma linha por categoria: bolinha da cor, nome à esquerda, valor alinhado à direita com a unidade (`6.000 un`, `100 formas`, `82,5 kg`).
- **Ocultar categorias com zero**; se o bucket inteiro for zero, mostrar "Sem produção".
- Linha de **Total** separada por um divisor no pé.
- Categorias ordenadas por valor (maior primeiro).

**Período em aberto**
- Marcar o último bucket como parcial (hoje, semana corrente ou mês corrente).
- Barra parcial com preenchimento mais claro e contorno tracejado (mantendo a cor da categoria), em vez de sólida.
- Nota na legenda explicando: "barra tracejada = período em andamento".
- No KPI do mês, texto "mês em andamento" quando o mês corrente ainda não fechou (sem mudar cálculos).

## Detalhes técnicos

- `src/hooks/useProducaoDashboard.ts`: cada linha de `serieMensal` passa a carregar `parcial: boolean` (bucket que contém `hoje`); somas inalteradas.
- `src/components/pcp/dashboard/ProducaoEvolucaoChart.tsx`: substituir `ChartTooltipContent` por um tooltip local que filtra `value > 0`, ordena e soma o total; usar `<Cell>` por bucket em cada `<Bar>` para aplicar `fillOpacity`/`strokeDasharray` no bucket parcial; adicionar a nota de legenda.
- `src/components/pcp/dashboard/ProducaoKpiStrip.tsx`: nota "mês em andamento" no card do mês atual.
- Cores continuam vindo dos tokens HSL já usados no dashboard.