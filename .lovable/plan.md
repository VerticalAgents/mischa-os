# Toggle "Incluir previstos" com dois modos

Quando o toggle "Incluir previstos" for ativado, abrir uma escolha entre dois modos de simulação:

1. **Apenas prováveis** — contabiliza 100% das unidades dos agendamentos previstos cujo score de confirmação seja `> 85` (badge verde "Confirmado Provável").
2. **Percentual customizado** — comportamento atual: usuário define um % (1–100) aplicado a todos os previstos da semana.

## Onde mexer

### `src/components/agendamento/AgendamentoDashboard.tsx`
- Adicionar estado `modoPrevistos: 'provaveis' | 'percentual'` (default `'provaveis'`).
- Passar `modoPrevistos`, `setModoPrevistos` e `scoresSemanais` para `QuantidadesProdutosSemanal`.
- No cálculo de `totalUnidadesSemana` (linhas 639–652), quando `modoPrevistos === 'provaveis'`: somar 100% das unidades apenas dos previstos com `scoresSemanais.get(cliente.id).score > 85`. Quando `'percentual'`: manter lógica atual com `percentualPrevistos`.
- Atualizar os labels descritivos (linhas 937, 942) para refletir o modo ativo (ex.: "Confirmados + previstos prováveis + entregues").
- Em `handleTogglePrevistos`: ao ligar, manter default em `'provaveis'`; só pedir percentual quando o usuário trocar.

### `src/components/agendamento/QuantidadesProdutosSemanal.tsx`
- Receber novas props: `modoPrevistos`, `onChangeModoPrevistos`, e um `Map<clienteId, score>` para filtrar prováveis.
- Adicionar UI de seleção do modo (RadioGroup ou dois botões pequenos) logo abaixo/ao lado do switch, visível apenas quando `incluirPrevistos === true`.
  - Opção 1: "Apenas prováveis (verde)" — esconde input de %.
  - Opção 2: "Percentual" — mostra input numérico atual.
- No `useMemo` de `produtosOrdenados` (linhas 110–131):
  - Modo `provaveis`: filtrar `agendamentosPrevistosSemana` por score > 85, refazer `fetchQuantidades` apenas para esse subset (ou aplicar filtro durante o merge somando 100%).
  - Modo `percentual`: manter cálculo atual.
- Ajustar `CardDescription` (linha 148) e mensagem vazia (187) conforme o modo.
- Ajustar `totalPedidos` (137) para contar apenas os previstos prováveis quando modo `'provaveis'`.

## Detalhes técnicos

- O score já existe em `scoresSemanais` (Map por `cliente.id`) calculado em `AgendamentoDashboard.tsx:444` via `useConfirmationScore(previstosSemanais)`.
- Threshold "provável" = `score > 85`, alinhado com `useConfirmationScore.ts:184` (`nivel === 'alto'`) e o badge verde mostrado em `ExplicacaoConfirmationScore.tsx`.
- Para evitar refetch duplicado de quantidades em `QuantidadesProdutosSemanal`, manter o fetch geral dos previstos da semana e apenas filtrar quais agendamentos contribuem no merge final, baseado em scores recebidos via prop.
- Nada de mudança de schema/DB.
