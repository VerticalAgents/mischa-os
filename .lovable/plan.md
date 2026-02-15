# Card Explicativo do Calculo de Probabilidade no Menu Reagendamentos

## Resumo

Adicionar um card/accordion expansivel na pagina `/reagendamentos` que explica detalhadamente como funciona o calculo de probabilidade de confirmacao de agendamento.

## Alteracoes

### Arquivo: `src/pages/Reagendamentos.tsx`

Adicionar um novo componente `ExplicacaoConfirmationScore` entre o header e os cards de resumo. Sera um `Collapsible` (ou Accordion) com titulo "Como funciona o Calculo de Probabilidade?" que expande para mostrar a explicacao completa.

### Novo arquivo: `src/components/reagendamentos/ExplicacaoConfirmationScore.tsx`

Card com as seguintes secoes:

1. **O que e o Score** - Explicacao geral (0-100%, verde/amarelo/vermelho)
2. **Baseline de Cadencia (peso principal)**
  - Analisa as ultimas entregas do cliente (84 dias)
  - Calcula o intervalo medio entre entregas
  - Se o agendamento esta no prazo esperado: 95%
  - Penalidade de -2% por dia de atraso alem da cadencia
  - Clientes com poucas entregas recebem peso reduzido
3. **Penalidade por Volatilidade**
  - Cada reagendamento vinculado ao pedido: -15%
  - Se o reagendamento foi feito com menos de 24h de antecedencia: -10% extra
4. **Vetor de Tendencia**
  - Se o cliente costuma adiantar pedidos: bonus de +5%
  - Se o pedido atual tem 2+ adiamentos: penalidade de -20%
5. **Cold Start (clientes novos)**
  - 0 entregas: score fixo de 70%
  - 1 entrega: score fixo de 80%
6. **Faixas de classificacao**
  - Tabela visual com as 3 faixas (Verde >85%, Amarelo 50-84%, Vermelho <50%)

### Design

- Usar `Collapsible` do Radix com icone `Info` ou `HelpCircle`
- Comecara fechado por padrao para nao poluir a tela
- Usar `Card` com fundo sutil para diferenciar do conteudo principal
- Secoes internas com titulos em negrito e icones correspondentes (TrendingUp, TrendingDown, Clock, AlertTriangle)
- Tabela de faixas com badges coloridos iguais aos usados no ConfirmationScoreBadge

Por fim, alem disso tudo acima eu quero um tool top que mostre a explicaçao do calculo individual de cada card do calendario semanal,