

# Toggle para desabilitar reagendamento automatico

## Resumo

Adicionar um campo booleano `desabilitar_reagendamento` na tabela `clientes` e um toggle no bloco "Configuracoes Comerciais" do cadastro. Quando ativado, ao confirmar uma entrega, o agendamento volta para status "Agendar" com data zerada (null), em vez de criar automaticamente o proximo agendamento.

## Alteracoes

### 1. Banco de dados

Adicionar coluna na tabela `clientes`:

```sql
ALTER TABLE clientes ADD COLUMN desabilitar_reagendamento boolean DEFAULT false;
```

### 2. Atualizar a funcao RPC `process_entrega_safe`

Modificar o bloco final de reagendamento para verificar o flag:

```sql
-- Reagendamento: verificar preferencia do cliente
IF (SELECT desabilitar_reagendamento FROM public.clientes WHERE id = v_cliente_id) = true THEN
  UPDATE public.agendamentos_clientes
  SET 
    data_proxima_reposicao = NULL,
    status_agendamento = 'Agendar',
    substatus_pedido = 'Agendado',
    updated_at = now()
  WHERE id = p_agendamento_id;
ELSE
  UPDATE public.agendamentos_clientes
  SET 
    data_proxima_reposicao = (current_date + make_interval(days => v_periodicidade)),
    status_agendamento = 'Previsto',
    substatus_pedido = 'Agendado',
    updated_at = now()
  WHERE id = p_agendamento_id;
END IF;
```

### 3. Tipo TypeScript (`src/types/index.ts`)

Adicionar ao interface `Cliente`:

```typescript
desabilitarReagendamento?: boolean;
```

### 4. Sanitizador (`src/utils/clienteDataSanitizer.ts`)

Adicionar mapeamento do campo `desabilitarReagendamento` para `desabilitar_reagendamento` no objeto de saida.

### 5. Store (`src/hooks/useClienteStore.ts`)

No `transformDbRowToCliente`, mapear `row.desabilitar_reagendamento` para `desabilitarReagendamento`.

### 6. Agendamento utils (`src/hooks/agendamento/utils.ts`)

Mapear o campo no builder de cliente do agendamento.

### 7. Form default (`src/components/clientes/ClienteFormDialog.tsx`)

- Adicionar `desabilitarReagendamento: false` no `getDefaultFormData`
- Adicionar ao `clienteTemp`
- No bloco "Configuracoes Comerciais", adicionar um toggle (Switch) com label "Desabilitar reagendamento automatico" e uma descricao curta explicando o comportamento

### 8. UI do toggle

O toggle ficara no card "Configuracoes Comerciais", abaixo da periodicidade e status:

```text
+--------------------------------------------------+
| Configuracoes Comerciais                          |
|                                                   |
| [Periodicidade (dias)]    [Status]                |
|                                                   |
| [Toggle] Desabilitar reagendamento automatico     |
|   Ao confirmar entrega, o agendamento volta para  |
|   "Agendar" sem data definida                     |
+--------------------------------------------------+
```

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Adicionar coluna `desabilitar_reagendamento` |
| Migracao SQL | Recriar funcao `process_entrega_safe` com condicional |
| `src/types/index.ts` | Adicionar `desabilitarReagendamento?: boolean` |
| `src/utils/clienteDataSanitizer.ts` | Mapear campo no output |
| `src/hooks/useClienteStore.ts` | Mapear no `transformDbRowToCliente` |
| `src/hooks/agendamento/utils.ts` | Mapear campo |
| `src/components/clientes/ClienteFormDialog.tsx` | Adicionar toggle no bloco Comerciais |

