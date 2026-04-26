## Refinar layout dos blocos diários no Calendário Semanal (mobile)

Reestruturar cada bloco de dia no calendário semanal para ter duas linhas no mobile, com melhor distribuição do espaço. No desktop o layout vertical empilhado permanece igual.

### Novo layout mobile

```text
┌─────────────────────────────────────────────┐
│ Segunda-feira                            12 │  ← linha 1: dia da semana (esq) | data numérica (dir)
├─────────────────────────────────────────────┤
│ [ 3 Confirmados ][ 2 Previstos ][ 1 Entr. ]│  ← linha 2: badges lado a lado dividindo a largura total
└─────────────────────────────────────────────┘
```

- Linha 1: dia da semana à esquerda, data numérica à direita (alinhamento `justify-between`).
- Linha 2: badges ocupando toda a largura, divididos igualmente pelo número de badges visíveis (`grid grid-cols-N` dinâmico, ou `flex-1` em cada badge).
- Quando não houver agendamentos, exibir o "Livre" centralizado nessa segunda linha.

### Detalhes técnicos

Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx` (bloco do Calendário Semanal por volta da linha 1182).

- Trocar o container atual (`grid grid-cols-3 items-center` no mobile) por um `flex flex-col` no mobile, mantendo `md:flex md:flex-col md:text-center` para desktop.
- Linha 1: `<div className="flex items-center justify-between md:flex-col md:gap-1">` contendo o nome do dia e a data numérica. No desktop, manter empilhado e centralizado (data abaixo do dia).
- Linha 2: container dos badges usando `flex w-full gap-1` no mobile (cada badge com `flex-1` para dividir a largura igualmente). No desktop, manter `md:flex-wrap md:justify-center` com badges em `md:w-full`.
- Remover classes que forçavam grid 3-colunas no mobile.
- Estado "Livre" (`dia.total === 0 && dia.realizadas === 0`): exibir centralizado na linha 2 (`text-center w-full`).

Sem alterações de dados, hooks ou lógica — apenas reestruturação de classes Tailwind no JSX desse bloco.
