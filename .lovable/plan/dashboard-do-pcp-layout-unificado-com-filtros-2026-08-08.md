# Dashboard do PCP: layout unificado com filtros

## O que muda

Hoje o dashboard tem cards separados por categoria (Revenda, Food-Service e o card de Private Label que acabei de adicionar), cada um com seu próprio total e seus próprios gráficos. Isso fica repetitivo e esconde o total real da fábrica.

A proposta é um dashboard único, com dois filtros no topo que valem para **tudo** na tela:

- **Unidade de medida:** Formas / Unidades / Peso (kg)
- **Categorias:** seleção múltipla (Revenda Padrão, Food Service, Especiais, Odara Alfajores, Morena Cacau), com "Todas" por padrão

Trocar a unidade reescreve todos os números, gráficos e eixos. Trocar as categorias refiltra todo o dashboard.

## Novo layout (inspirado no dashboard de Agendamento)

```text
[ Filtros: Período | Unidade de medida | Categorias ]

[ KPI Produzido ] [ KPI Mês atual ] [ KPI vs ano ant. ] [ KPI Média/semana ]

[ Evolução da produção (barras por mês, 3/6/12/24 meses) ]

[ Produção por categoria         ] [ Produção por produto        ]
[ (barras horizontais + % share) ] [ (ranking com barra de %)    ]
```

- Barra de filtros compacta no topo, no mesmo espírito da barra de filtros do Agendamento (linha única no desktop, empilhada no mobile).
- Faixa de KPIs em cards pequenos e densos, com variação vs. período anterior (seta verde/vermelha).
- Um único gráfico de evolução, com uma barra por categoria selecionada (empilhada), em vez de dois gráficos duplicados.
- Bloco "Produção por categoria" substitui os cards fixos de Revenda/Food-Service/Private Label: as categorias aparecem dinamicamente, então categorias novas entram sozinhas.
- Bloco "Produção por produto" mantém o detalhamento e o toggle "Apenas com proporção" (hoje só existe no card de Revenda).
- Cores por categoria via tokens HSL do design system; Private Label continua com o roxo já usado no resto do sistema.

## Detalhes técnicos

- Reescrever `src/components/pcp/HistoricoAnalytics.tsx` como composição de subcomponentes em `src/components/pcp/dashboard/` (barra de filtros, faixa de KPIs, gráfico de evolução, bloco por categoria, bloco por produto), para o arquivo não voltar a passar de 700 linhas.
- Criar um hook `useProducaoDashboard` que centraliza a agregação: recebe período, unidade e categorias selecionadas e devolve KPIs, série mensal e quebras por categoria/produto. Fonte de dados: `historico_producao` (via `useSupabaseHistoricoProducao`) cruzado com `produtos_finais` (via `useSupabaseProdutos`) para `categoria_id`, `cliente_id` e `peso_unitario`.
- Métricas: formas = `formas_producidas`; unidades = `unidades_calculadas`; peso (kg) = `unidades_calculadas * peso_unitario / 1000`. Produtos sem `peso_unitario` cadastrado ficam de fora do modo peso e o card mostra um aviso discreto de quantos produtos foram ignorados.
- A categorização passa a ser sempre por `categoria_id` do produto (não mais por palavra no nome, que era o motivo de a Odara cair dentro de "Revenda" no gráfico).
- Registros sem `produto_id` ou sem categoria entram em um grupo "Sem categoria", visível no filtro.
- Filtro de categorias no padrão dos filtros já existentes (`RepresentantesFilter` / `RotasFilter`), com `selectedIds` + `onSelectionChange`.
- Manter os KPIs de Taxa de Confirmação e Rendimento Médio, movidos para a faixa de KPIs.
- Nenhuma mudança de banco de dados.
