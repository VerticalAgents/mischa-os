
# Adicionar Confirmation Score nos Cards do Calendario Semanal

## Resumo

Integrar o badge de probabilidade de confirmacao (`ConfirmationScoreBadge`) nos cards de agendamentos "Previstos" no painel expandido do dia selecionado no Dashboard.

## Alteracoes

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

1. **Importar** o hook `useConfirmationScore` e o componente `ConfirmationScoreBadge`
2. **Chamar o hook** passando `agendamentosDiaSelecionado` (os agendamentos do dia expandido)
3. **Renderizar o badge** dentro do `renderCard` para agendamentos com status "Previsto", ao lado dos indicadores de entrega ja existentes

### Detalhes tecnicos

- O hook `useConfirmationScore` ja existe e recebe um array de `AgendamentoItem[]`, retornando `{ scores: Map<clienteId, ConfirmationScore>, loading: boolean }`
- O badge sera adicionado dentro do card, logo apos o componente `IndicadoresEntrega` que ja aparece para previstos
- O score e acessado via `scores.get(agendamento.cliente.id)`
- Nenhum arquivo novo precisa ser criado - apenas editar o Dashboard

### Posicionamento no card

```text
+--------------------------------------------------+
| Nome do Cliente                    [badges] [btn] |
| Quantidade: 120 unidades                          |
| [dias] [periodicidade] [frequencia]               |
| [ConfirmationScoreBadge]  <-- NOVO                |
+--------------------------------------------------+
```

O badge aparece apenas para cards com status "Previsto", pois sao os que precisam de confirmacao.
