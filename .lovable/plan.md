
# Vincular periodicidade ao toggle de reagendamento

## Comportamento

Quando o toggle "Desabilitar reagendamento automatico" estiver ativado:
- O campo "Periodicidade (dias)" fica desabilitado (disabled) e com valor 0
- Ao desativar o toggle, a periodicidade volta ao valor padrao (7)

## Alteracao

Arquivo unico: `src/components/clientes/ClienteFormDialog.tsx`

1. No handler do `onCheckedChange` do Switch, ao ativar o toggle, setar `periodicidadePadrao` para `0`. Ao desativar, restaurar para `7`.

2. No Input de periodicidade, adicionar `disabled={formData.desabilitarReagendamento}` para impedir edicao quando o toggle esta ativo.

3. No `clienteTemp` (objeto de save), garantir que `periodicidadePadrao` seja `0` quando `desabilitarReagendamento` for `true`.
