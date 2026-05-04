# Separar gráfico de Evolução: Revenda x Food-Service

## Problema
Hoje o gráfico **Evolução da Produção por Categoria** mostra Revenda e Food-Service na mesma escala. Como Food-Service usa embalagens muito maiores (mini/nano em volumes pequenos), a barra verde fica praticamente invisível ao lado da Revenda.

## Solução

Dividir em **dois gráficos lado a lado** (em telas largas) ou empilhados (mobile), cada um com sua própria escala Y:

1. **Gráfico Revenda** — apenas unidades produzidas (mantém o que já existe).
2. **Gráfico Food-Service** — com um toggle local **Unidades / Peso (kg)**, já que peso é uma métrica mais fiel para embalagens grandes.

Ambos compartilham o mesmo seletor de timeframe (3/6/12/24 meses) que já existe.

## Mudanças em `src/components/pcp/HistoricoAnalytics.tsx`

### 1. Cálculo do peso no `useMemo` `dadosGraficoComparativo`
- Buscar `peso_unitario` dos produtos via `useSupabaseProdutos` (já usado em outros lugares do projeto).
- Para cada registro de histórico, calcular `pesoKg = (unidades_calculadas × peso_unitario_g) / 1000`.
- Retornar para cada mês: `{ mes, revendaUnidades, foodServiceUnidades, foodServicePesoKg }`.
- Se `peso_unitario` não estiver cadastrado para um produto, ele soma 0 no peso (com fallback silencioso) e log de aviso no console.

### 2. Estado novo
```ts
const [foodServiceMetrica, setFoodServiceMetrica] = useState<"unidades" | "peso">("unidades");
```

### 3. Layout — substituir o card único por dois cards em grid

```text
┌─────────────────────────────┬─────────────────────────────┐
│ Evolução Revenda            │ Evolução Food-Service       │
│ Últimos 12 meses ▾          │ [Unidades|Peso] 12 meses ▾  │
│ ▆ ▆ ▆ ▆ ▆ ▆ ▆ ▆ ▆ ▆ ▆ ▆     │ ▂ ▃ ▂ ▄ ▃ ▂ ▃ ▄ ▅ ▃ ▂ ▄    │
│ Y: Unidades                 │ Y: Unidades ou kg           │
└─────────────────────────────┴─────────────────────────────┘
```

- Wrapper: `grid gap-4 lg:grid-cols-2`.
- Cada card mantém `<ChartContainer>` + `<BarChart>` próprio com **uma única série**, com YAxis independente (ajusta automaticamente ao range dos dados).
- Cores mantidas: Revenda roxo `hsl(262 83% 58%)`, Food-Service verde `hsl(142 76% 36%)`.
- O toggle de métrica do Food-Service usa um pequeno `<Tabs>` ou um `<Select>` compacto no header do card. Vou usar `<Select>` para manter consistência com o seletor de meses já presente.
- Y-axis label: "Unidades Produzidas" no card Revenda; "Unidades Produzidas" ou "Peso (kg)" no card Food-Service conforme toggle.
- Tooltip formata números com `pt-BR`; quando peso, sufixo " kg" e 1 casa decimal.

### 4. Seletor de timeframe
Continua único (mantém `mesesGrafico`) e controla os dois gráficos simultaneamente. Posicionado no header do card da Revenda com label "Período aplicado aos dois gráficos" — ou duplicado em ambos para clareza visual. **Decisão**: duplicar o `<Select>` de meses em cada card (mesmo state controlando), assim cada card é visualmente autocontido.

### 5. Legenda
Como cada gráfico tem só uma série, remover a `<Legend />` (o título do card já identifica a categoria).

## Arquivos editados
- `src/components/pcp/HistoricoAnalytics.tsx` (único arquivo)

## Não muda
- Hook `useSupabaseHistoricoProducao` e tipo `RegistroHistorico` permanecem iguais.
- Lógica de categorização `mini/nano → foodservice` permanece.
- Cards de KPI, filtros de período (90 dias) e detalhes por produto não mudam.
