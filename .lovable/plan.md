## Objetivo

1. Ocultar a aba **Financeiro** dentro do detalhe do cliente quando o usuário for um representante.
2. Adicionar três novos indicadores no topo da aba **Análise de Giro** do cliente (visíveis tanto para admin quanto para representante):
   - **Dias desde a última entrega**
   - **Periodicidade configurada** (em dias)
   - **Periodicidade real** (em dias, calculada a partir do histórico)

## Mudanças

### 1. Ocultar aba "Financeiro" para representantes

Arquivo: `src/components/clientes/ClienteDetalhesTabs.tsx`

- Adicionar uma prop opcional `hideFinanceiro?: boolean` no componente.
- Quando `hideFinanceiro` for `true`:
  - Remover a entrada "Financeiro" do array de tabs mobile.
  - Mudar o grid desktop de `grid-cols-5` para `grid-cols-4` e remover o `TabsTrigger` de "financeiro".
  - Remover o `TabsContent` de "financeiro".

Arquivo: `src/pages/rep/RepClientes.tsx`

- Identificar onde o `ClienteDetailsView` (ou `ClienteDetalhesTabs`) é renderizado para o representante e propagar `hideFinanceiro={true}`. Caso o representante use `ClienteDetailsView`, adicionaremos a prop nele também e repassaremos para `ClienteDetalhesTabs`.

Arquivo: `src/components/clientes/ClienteDetailsView.tsx`

- Adicionar prop `hideFinanceiro?: boolean` e repassá-la para `ClienteDetalhesTabs`.

### 2. Novos indicadores na Análise de Giro

Arquivo: `src/components/clientes/AnaliseGiro.tsx`

Adicionar uma nova grade de 3 cards acima da grade existente de métricas de giro, com:

- **Última Entrega**: dias desde a última entrega (ex.: "5 dias atrás"). Usa `frequenciaInfo.ultimaEntrega` do hook `useFrequenciaRealEntregas` e calcula `differenceInDays(hoje, ultimaEntrega)`. Se não houver entrega, mostrar "Sem entregas".
- **Periodicidade Configurada**: `cliente.periodicidadePadrao` em dias, com a label da faixa (ex.: "7 dias - Semanal"). Reutilizar `getFaixaLabel` se existir, ou exibir simples.
- **Periodicidade Real**: `frequenciaInfo.frequenciaReal` em dias. Aplicar coloração por divergência usando `getCorDivergencia(periodicidadeConfig, frequenciaReal)` já existente em `useFrequenciaRealEntregas.ts`. Mostrar ícone de tendência (TrendingUp/Down/Minus) e valor. Se `null`, exibir "Dados insuficientes".

Reutilizar componente existente `GiroMetricCard` para manter consistência visual, ou criar uma pequena variação inline se necessário.

Hook a ser chamado:
```ts
const { data: frequenciasMap } = useFrequenciaRealEntregas([cliente.id]);
const freqInfo = frequenciasMap?.get(cliente.id);
```

## Detalhes técnicos

- O hook `useFrequenciaRealEntregas` já retorna `{ frequenciaReal, numeroEntregas, primeiraEntrega, ultimaEntrega }` por cliente, portanto não há necessidade de novas queries no Supabase.
- A função `getCorDivergencia` já está exportada do mesmo arquivo do hook e pode ser usada para colorir o card de periodicidade real (verde/amarelo/vermelho conforme divergência ≤20%, ≤40%, >40%).
- A detecção do representante será via prop explícita `hideFinanceiro` (não via contexto), mantendo o componente reutilizável para o admin.

## Arquivos editados

- `src/components/clientes/ClienteDetalhesTabs.tsx`
- `src/components/clientes/ClienteDetailsView.tsx`
- `src/pages/rep/RepClientes.tsx`
- `src/components/clientes/AnaliseGiro.tsx`