
# Corrigir fechamento do calendario ao clicar fora

## Problema

O `onInteractOutside={(e) => e.preventDefault()}` impede que o Popover feche ao clicar fora, porque bloqueia todas as interacoes externas. Precisamos permitir o fechamento do Popover mas impedir que o clique propague para o Dialog (que fecharia o modal).

## Solucao

Trocar `e.preventDefault()` por `e.stopPropagation()` nos 3 arquivos. Isso permite que o Popover feche normalmente ao clicar fora, mas impede que o evento chegue ao Dialog pai.

## Arquivos alterados

### 1. `src/components/agendamento/AgendamentoEditModal.tsx` (linha 367)

De:
```typescript
onInteractOutside={(e) => e.preventDefault()}
```
Para:
```typescript
onInteractOutside={(e) => e.stopPropagation()}
```

### 2. `src/components/agendamento/ReagendamentoDialog.tsx` (linha 208)

Mesma troca de `preventDefault` para `stopPropagation`.

### 3. `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` (linha 259)

Mesma troca de `preventDefault` para `stopPropagation`.
