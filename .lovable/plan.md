
# Corrigir seletor de data nos modais de agendamento

## Problema

O calendario (date picker) dentro dos modais de agendamento nao funciona corretamente: nao e possivel navegar entre meses e ao clicar em uma data, o clique "atravessa" o calendario e fecha o modal. Isso acontece porque o Popover do calendario dentro de um Dialog do Radix UI tem conflitos de eventos.

## Solucao

Dois ajustes em cada modal afetado:

1. Adicionar `pointer-events-auto` na classe do Calendar para garantir interatividade
2. Adicionar `onInteractOutside={(e) => e.preventDefault()}` no `PopoverContent` para evitar que cliques no calendario fechem o popover/dialog

## Arquivos alterados

### 1. `src/components/agendamento/AgendamentoEditModal.tsx` (linhas 367-374)

Atualizar o PopoverContent e Calendar:
```typescript
<PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.preventDefault()}>
  <Calendar
    mode="single"
    selected={dataReposicao}
    onSelect={setDataReposicao}
    locale={ptBR}
    initialFocus
    className={cn("p-3 pointer-events-auto")}
  />
</PopoverContent>
```

### 2. `src/components/agendamento/ReagendamentoDialog.tsx` (linhas 208-217)

Mesmo ajuste:
```typescript
<PopoverContent className="w-auto p-0" onInteractOutside={(e) => e.preventDefault()}>
  <CalendarComponent
    mode="single"
    selected={dataSelecionada}
    onSelect={setDataSelecionada}
    disabled={(date) => date < new Date() || disableWeekends(date)}
    initialFocus
    className={cn("p-3 pointer-events-auto")}
  />
</PopoverContent>
```

### 3. `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` (linhas 259-267)

Adicionar `onInteractOutside` (ja tem `pointer-events-auto`):
```typescript
<PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.preventDefault()}>
```

### 4. `src/components/agendamento/EditarAgendamentoDialog.tsx`

Este modal usa `<Input type="date">` nativo, entao nao e afetado.

Total: 3 arquivos com alteracoes minimas.
