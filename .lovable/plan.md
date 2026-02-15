

# Remover "Quantidade Padrao" da UI e usar 30 como fallback universal

## Resumo

O campo `quantidadePadrao` sera removido do formulario de cadastro e da tela de detalhes do cliente. No codigo, todos os pontos que usam `cliente.quantidadePadrao` como fallback passarao a usar uma constante `PEDIDO_MINIMO = 30`. O campo continua existindo no banco de dados e no tipo TypeScript (sem breaking changes), mas nao sera mais editavel.

## Constante global

Criar uma constante em `src/utils/constants.ts`:

```typescript
export const PEDIDO_MINIMO_UNIDADES = 30;
```

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/utils/constants.ts` | Criar arquivo com `PEDIDO_MINIMO_UNIDADES = 30` |
| `src/components/clientes/ClienteFormDialog.tsx` | Remover campo "Quantidade Padrao" do formulario. Manter `quantidadePadrao: 30` como valor fixo no save |
| `src/components/clientes/ClienteDetalhesInfo.tsx` | Remover exibicao de "Quantidade Padrao" |
| `src/components/agendamento/ConfirmacaoReposicaoTab.tsx` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |
| `src/components/agendamento/NovaConfirmacaoReposicaoTab.tsx` | Trocar `agendamento.cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |
| `src/components/expedicao/hooks/useAgendamentoActions.ts` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |
| `src/components/clientes/GiroMetaForm.tsx` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` na funcao de calculo |
| `src/utils/calculations.ts` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |
| `src/utils/giroCalculations.ts` | Atualizar `calcularGiroSemanalPadrao` e `calcularMetaGiroSemanal` para usar 30 como default |
| `src/hooks/useFaturamentoPrevisto.ts` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |
| `src/pages/financeiro/Custos.tsx` | Trocar `cliente.quantidadePadrao` por `PEDIDO_MINIMO_UNIDADES` |

## O que NAO muda

- O campo `quantidadePadrao` continua no tipo `Cliente` e na tabela do banco (sem migracao)
- O `useClienteStore` continua lendo o campo do banco (backward compatibility)
- O `clienteDataSanitizer` continua mapeando o campo (sem quebrar clientes existentes)
- O campo sera salvo como `30` por padrao para novos clientes

