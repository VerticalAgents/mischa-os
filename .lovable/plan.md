
# Correcao: Reagendamentos entre semanas nao sendo registrados

## Problema identificado

A funcao `registrarReagendamentoEntreSemanas` em `src/utils/reagendamentoUtils.ts` tem um bug na linha 21-23:

```typescript
const semanasAdiadas = Math.abs(differenceInWeeks(dataNova, dataOriginal));
if (semanasAdiadas === 0) return; // <-- BUG AQUI
```

A funcao `differenceInWeeks` do date-fns conta **periodos completos de 7 dias** entre duas datas, nao semanas do calendario. Exemplo: se um pedido e movido de quinta-feira para a segunda-feira da semana seguinte (4 dias de diferenca), as semanas sao diferentes (o primeiro check na linha 17 passa corretamente), mas `differenceInWeeks` retorna 0 porque nao ha 7 dias completos entre as datas. O codigo entao faz `return` sem registrar nada.

## Solucao

Calcular `semanasAdiadas` usando a diferenca entre os **inicios das semanas** (que ja estao calculados nas variaveis `semanaOriginal` e `semanaNova`), em vez de usar as datas originais. Isso garante que qualquer mudanca entre semanas do calendario conta como pelo menos 1 semana. Tambem remover o check redundante `semanasAdiadas === 0`, pois o check anterior (`semanaOriginal === semanaNova`) ja cobre esse caso.

Alem disso, remover o cast `as any` na chamada `.from()` para usar o tipo correto da tabela gerada pelo Supabase, garantindo type-safety.

## Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/utils/reagendamentoUtils.ts` | Corrigir calculo de `semanasAdiadas` para usar diferenca entre inicios de semana; remover check redundante |

### Codigo corrigido

```typescript
// ANTES (bugado):
const semanasAdiadas = Math.abs(differenceInWeeks(dataNova, dataOriginal));
if (semanasAdiadas === 0) return;

// DEPOIS (correto):
const semanasAdiadas = Math.abs(differenceInWeeks(semanaNova, semanaOriginal));
// Nao precisa do check === 0 pois o check anterior ja garante semanas diferentes
```

Essa e a unica mudanca necessaria. O resto do fluxo (chamadas nos dialogs, hook de leitura, pagina) ja esta correto.
