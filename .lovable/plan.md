

# Correcao: Registrar reagendamento ao editar agendamento pelo modal

## Problema

O `AgendamentoEditModal` -- que e o modal usado ao clicar num card do calendario semanal (e em mais de 10 outros locais) -- **nao chama** `registrarReagendamentoEntreSemanas` ao salvar uma nova data. Ele apenas salva a nova data diretamente no banco.

A funcao de registro so e chamada em locais especificos:
- `ReagendamentoDialog.tsx` (botao "Reagendar" dedicado)
- `AgendamentoDashboard.tsx` (reagendamento em massa)
- `TodosAgendamentos.tsx` (reagendamento em massa)
- `AgendamentosAtrasados.tsx` (reagendamento automatico de atrasados)

Como o usuario editou a data pelo modal do card no calendario (que usa `AgendamentoEditModal`), nenhum log foi registrado.

## Solucao

Adicionar a chamada de `registrarReagendamentoEntreSemanas` dentro da funcao `handleSalvar` do `AgendamentoEditModal.tsx`, comparando a data original do agendamento com a nova data selecionada. O registro so acontece quando a data efetivamente muda.

## O que sera alterado

### `src/components/agendamento/AgendamentoEditModal.tsx`

Na funcao `handleSalvar` (linha 174), antes de salvar o agendamento:

1. Importar `registrarReagendamentoEntreSemanas` do utils
2. Comparar a data original (`agendamento.dataReposicao`) com a nova data (`dataReposicao`)
3. Se forem diferentes, chamar `registrarReagendamentoEntreSemanas(clienteId, dataOriginal, dataNova)`
4. O registro acontece de forma assincrona (sem bloquear o salvamento)

```text
handleSalvar():
  1. Validacoes existentes
  2. [NOVO] Se data mudou -> registrarReagendamentoEntreSemanas(clienteId, dataOriginal, dataNova)
  3. Salvar observacoes (existente)
  4. Salvar agendamento (existente)
  5. Resto do fluxo (existente)
```

## Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/components/agendamento/AgendamentoEditModal.tsx` | Importar e chamar `registrarReagendamentoEntreSemanas` quando a data muda |

Nenhum outro arquivo precisa ser alterado. A logica de classificacao (adiamento/adiantamento) e calculo de semanas ja esta implementada no utilitario.

