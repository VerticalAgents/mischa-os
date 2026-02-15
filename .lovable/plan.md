

# Ajuste da tabela geral de clientes

## Remover colunas

Remover as seguintes colunas da tabela de clientes:
- **Giro Semanal** - remover de `columnOptions` e de `defaultColumns`
- **Endereço** - remover de `columnOptions` e de `defaultColumns`
- **Qtde. Padrao** - remover de `columnOptions` e de `defaultColumns`

Tambem remover os cases correspondentes no `getColumnValue` do `ClientesTable.tsx` (`giroSemanal`, `enderecoEntrega`, `quantidadePadrao`) e o import de `calcularGiroSemanalPadrao` que ficara sem uso.

## Evitar corte de colunas

Para resolver o problema de colunas cortadas:
- Adicionar `whitespace-nowrap` nas celulas (`TableCell`) para evitar quebra de texto
- Garantir que o container da tabela tenha `overflow-x-auto` para scroll horizontal quando necessario (ja existe no componente `Table`)
- Aplicar `min-w-max` na tabela para que ela nao comprima as colunas

## Arquivos alterados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Clientes.tsx` | Remover `giroSemanal`, `enderecoEntrega` e `quantidadePadrao` de `columnOptions` e `defaultColumns` |
| `src/components/clientes/ClientesTable.tsx` | Remover cases `giroSemanal`, `enderecoEntrega`, `quantidadePadrao` do `getColumnValue`. Remover import e funcao `calcularGiroSemanalCliente`. Adicionar `whitespace-nowrap` nas celulas e `min-w-max` na tabela para evitar corte |

