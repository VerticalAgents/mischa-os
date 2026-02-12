
# Agrupar pedidos previstos por representante no calendario semanal

## O que muda

No painel expandido do dia selecionado (quando voce clica em um dia do calendario), os agendamentos com status "Previsto" passarao a ser agrupados por representante. Cada grupo tera um cabecalho com o nome do representante e a contagem de previstos daquele representante.

Agendamentos "Agendados" (confirmados) continuam aparecendo primeiro, sem agrupamento, como ja funciona hoje. A hierarquia visual sera:

1. Agendados (confirmados) - lista normal, sem agrupamento
2. Previstos agrupados por representante - cada grupo com cabecalho

## Alteracoes

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

**Logica** (no bloco de `useMemo` ou inline): Separar os agendamentos do dia em dois grupos:
- `agendados`: status "Agendado" (mantidos como lista simples)
- `previstosPorRepresentante`: agrupar os "Previsto" usando `cliente.representanteId`, cruzando com a lista de `representantes` ja carregada para obter o nome. Clientes sem representante ficam em um grupo "Sem representante".

**Renderizacao**: No trecho que lista os agendamentos do dia (por volta da linha 1162-1238):
- Primeiro renderizar os agendados normalmente
- Depois iterar sobre os grupos de previstos, exibindo para cada grupo:
  - Um cabecalho com o nome do representante e a quantidade (ex: "Joao Silva (3 previstos)")
  - Os cards dos clientes previstos daquele representante, identicos ao formato atual

Nenhum arquivo novo sera criado. A unica mudanca sera na logica de agrupamento e renderizacao dentro do `AgendamentoDashboard.tsx`, usando os dados de `representantes` que ja estao disponiveis no componente.
