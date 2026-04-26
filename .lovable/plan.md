## Problema

No mobile (390px), quatro blocos do Dashboard de Agendamentos estão mal adaptados:

1. **Produtos Necessários** — ícone + título grandes + toggle "Incluir previstos" ocupam muito espaço; o input de % quebra a linha.
2. **Produtos Entregues** — título "Produtos Entregues" quebra em duas linhas porque o bloco "Semana anterior" à direita rouba espaço.
3. **Distribuição por Status (pizza)** — header com switch "Agendamentos/Unidades" + ícone se sobrepõe ao título; labels do PieChart vazam para fora ("Agendar...", "viso: 27", "Agen…").
4. **Agendamentos por Dia da Semana (barras)** — eixo X mostra datas demais (20/04, 22/04, 24/04, 26/04) com fontes grandes; gráfico fica apertado.

## Correções

### 1. Cards "Produtos Necessários" e "Produtos Entregues" (`QuantidadesProdutosSemanal.tsx`, `EntregasRealizadasSemanal.tsx`)
- Reduzir tamanho do `CardTitle` no mobile (`text-base md:text-lg`) e do ícone (`h-4 w-4 md:h-5 md:w-5`).
- Forçar empilhamento vertical do header no mobile: título em cima, controles/indicador "Semana anterior" embaixo, alinhados à esquerda.
- Em "Produtos Necessários": colocar o switch "Incluir previstos" e o input "%" na mesma linha horizontal compacta abaixo do título no mobile.
- Em "Produtos Entregues": no mobile, mover "Semana anterior" para uma linha horizontal abaixo do título (sem `text-right`), em formato compacto: `Semana anterior: 370 ↗ 0%`.
- Reduzir padding interno do bloco azul/verde de total no mobile (`p-3 md:p-4`) e tamanho do número (`text-2xl md:text-3xl`).

### 2. Card "Distribuição por Status" (`AgendamentoDashboard.tsx` linhas ~1033-1104)
- Mudar `CardHeader` para `flex-col md:flex-row` no mobile, evitando sobreposição entre título e switch.
- Reduzir altura do gráfico no mobile (`h-64 md:h-80`).
- Remover labels do `Pie` no mobile (`label={isMobile ? false : ...}`) e habilitar `<Legend />` do recharts abaixo do gráfico para mostrar os status sem cortar texto.
- Reduzir `outerRadius` para 70 no mobile.

### 3. Card "Agendamentos por Dia da Semana" (`AgendamentoDashboard.tsx` linhas ~1107+)
- Reduzir altura no mobile (`h-64 md:h-80`).
- Diminuir fonte dos eixos (`tick={{ fontSize: 10 }}`) e usar formato curto (apenas `dd/MM` já está, mas reduzir tick size).
- Adicionar `interval={0}` ou `interval="preserveStartEnd"` e ajustar margens (`margin={{ left: -10, right: 10 }}`) para aproveitar espaço.

### 4. Detecção de mobile
- Reutilizar o hook existente `useIsMobile()` (já presente em `src/hooks/use-mobile.tsx`) para condicionar labels do PieChart.

## Arquivos a editar
- `src/components/agendamento/QuantidadesProdutosSemanal.tsx`
- `src/components/agendamento/EntregasRealizadasSemanal.tsx`
- `src/components/agendamento/AgendamentoDashboard.tsx`

## Fora do escopo
Não mexer em desktop — todas as mudanças são via classes responsivas (`md:`) ou condicionais por `useIsMobile`.