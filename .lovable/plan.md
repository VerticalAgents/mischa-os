

# Corrigir calendario nao funcional no site publicado

## Problema real

O `PopoverContent` do calendario usa `z-50`, o mesmo z-index do `DialogOverlay` e `DialogContent`. No site publicado, a ordem de renderizacao do DOM faz o overlay do Dialog ficar por cima do Popover do calendario, bloqueando cliques nos dias e nas setas de navegacao de mes. No editor nao acontece por diferencas no ambiente de preview.

## Solucao

Nos 3 arquivos que usam calendario dentro de Dialog/Modal, adicionar uma classe de z-index mais alto no `PopoverContent` para garantir que ele fique acima do overlay do Dialog.

Trocar:
```tsx
<PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
```
Por:
```tsx
<PopoverContent className="w-auto p-0 z-[100]" align="start" onInteractOutside={(e) => e.stopPropagation()}>
```

## Arquivos alterados

### 1. `src/components/agendamento/AgendamentoEditModal.tsx` (linha 367)
Adicionar `z-[100]` ao className do PopoverContent.

### 2. `src/components/agendamento/ReagendamentoDialog.tsx` (linha 208)
Adicionar `z-[100]` ao className do PopoverContent.

### 3. `src/components/agendamento/ReagendamentoEmMassaDialog.tsx` (linha 259)
Adicionar `z-[100]` ao className do PopoverContent.

### 4. `src/components/expedicao/PedidoCard.tsx` (linha ~540)
Tambem usa calendario dentro de popover -- aplicar a mesma correcao para consistencia.

