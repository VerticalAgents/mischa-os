

# Corrigir registro de Choco Duo e prevenir inconsistencias futuras

## Diagnostico

O registro de producao do Brownie Choco Duo (ID: `f41d54c9-3df0-43f8-8bb8-9dcff048d31c`, 4 formas, 160 unidades) esta com status "Registrado", porem todas as movimentacoes de estoque ja foram criadas:

- 1 entrada de produto (160 unidades)
- 9 saidas de insumos (consumo de receita)

Ou seja, uma confirmacao anterior executou com sucesso as movimentacoes de estoque, mas falhou na ultima etapa (atualizar o status do registro para "Confirmado"). Como o codigo verifica idempotencia pela existencia de movimentacoes, ao tentar confirmar novamente ele rejeita com "Producao ja confirmada".

## Correcoes

### 1. Corrigir o dado inconsistente (SQL direto)

Atualizar o status do registro para "Confirmado" e registrar a data de confirmacao, ja que todas as movimentacoes de estoque ja existem.

### 2. Melhorar a logica de confirmacao no codigo

No hook `useConfirmacaoProducao.ts`, quando a verificacao de idempotencia detectar que ja existem movimentacoes mas o status ainda e "Registrado", em vez de rejeitar com erro, o codigo deve **apenas atualizar o status para "Confirmado"** (ja que o trabalho principal ja foi feito). Isso torna o sistema resiliente a falhas parciais.

A mudanca sera na secao que verifica movimentacoes existentes (por volta da linha 50): se encontrar movimentacoes existentes, verificar o status do registro. Se for "Registrado", atualizar para "Confirmado" e retornar sucesso. Se ja for "Confirmado", manter o comportamento atual de rejeicao.

## Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar - corrigir status do registro `f41d54c9` |
| `src/hooks/useConfirmacaoProducao.ts` | Modificar - tratar caso de confirmacao parcial |

