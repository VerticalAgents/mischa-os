
# Corrigir calendario do "Entregar em Massa"

## Problema

O `PopoverContent` do calendario no `EntregaEmMassaDialog.tsx` (linha 141) nao tem `z-[100]` nem `onInteractOutside`, o mesmo fix que foi aplicado nos outros modais.

## Alteracao

### `src/components/expedicao/components/EntregaEmMassaDialog.tsx` (linha 141)

De:
```tsx
<PopoverContent className="w-auto p-0" align="start">
```

Para:
```tsx
<PopoverContent className="w-auto p-0 z-[100]" align="start" onInteractOutside={(e) => e.stopPropagation()}>
```

Apenas 1 linha alterada, mesma correcao ja aplicada nos outros 4 arquivos.
