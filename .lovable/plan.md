

# Fix: Status automático não está funcionando

## Causa raiz

**Dois problemas encontrados:**

### 1. Case mismatch nos valores de status
O banco armazena os status em **MAIÚSCULAS com underscore**: `ATIVO`, `STANDBY`, `A_ATIVAR`, `INATIVO`.
As funções SQL criadas comparam com **mixed case e espaço**: `'Ativo'`, `'Standby'`, `'A ativar'`.
Como PostgreSQL é case-sensitive em comparações de strings, **nenhuma condição é satisfeita**.

### 2. `ultima_data_reposicao_efetiva` não foi preenchida para clientes existentes
Todos os clientes têm esse campo como `NULL`, mesmo os que possuem entregas registradas. O trigger só funciona para entregas **novas** (futuras). Sem backfill, a função de 60 dias nunca encontra registros para atualizar.

## Solução

### Migration SQL com 3 partes:

**Parte 1: Backfill** - Popular `ultima_data_reposicao_efetiva` com base na última entrega de cada cliente em `historico_entregas`:
```sql
UPDATE clientes SET ultima_data_reposicao_efetiva = sub.ultima
FROM (
  SELECT cliente_id, MAX(data)::date as ultima
  FROM historico_entregas WHERE tipo = 'entrega'
  GROUP BY cliente_id
) sub
WHERE clientes.id = sub.cliente_id
  AND clientes.ultima_data_reposicao_efetiva IS NULL;
```

**Parte 2: Corrigir as 2 funções** (`auto_standby_clientes_inativos_60dias` e `auto_update_cliente_status_on_entrega`) para usar os valores corretos: `'ATIVO'`, `'STANDBY'`, `'A_ATIVAR'`, `'INATIVO'`.

**Parte 3: Corrigir `sync_cliente_status`** com os mesmos valores corretos.

### Frontend: Corrigir `ClienteFormDialog.tsx`
O bloqueio de seleção de "Ativo" para clientes em Standby também usa os valores errados (`'Standby'`, `'A ativar'`). Corrigir para `'STANDBY'`, `'A_ATIVAR'`.

### Frontend: Corrigir `clienteVisibilidade.ts`
O helper `isClienteVisivelAgendamento` compara com `'Standby'`, `'A ativar'`, `'Inativo'`. Corrigir para valores uppercase.

## Arquivos alterados
1. **Nova migration SQL**: backfill + recriar funções com case correto
2. **`src/components/agendamento/utils/clienteVisibilidade.ts`**: uppercase values
3. **`src/components/clientes/ClienteFormDialog.tsx`**: uppercase values

