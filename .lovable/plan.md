

# Automacao: Inativo 90+ dias + Status "Reativar"

## Resumo

1. Clientes com 90+ dias sem entrega passam automaticamente para **Inativo** (`ativo = false`), e seu agendamento e zerado (status "Agendar", sem data, 0 unidades).
2. Novo status de cliente: **"Reativar"** -- aplicado quando um agendamento e criado manualmente para um cliente Inativo. Diferencia de "A ativar" (nunca teve entrega).
3. Quando a entrega desse cliente "Reativar" for confirmada, ele volta para "Ativo" (trigger existente ja cobre isso, so precisa incluir "REATIVAR" na lista).

## Alteracoes

### 1. Migration SQL

**Atualizar `auto_standby_clientes_inativos_60dias`** (renomear nao e necessario, basta adicionar logica):
- Adicionar regra: clientes com `ultima_data_reposicao_efetiva < CURRENT_DATE - 90 days` e `status_cliente = 'STANDBY'` passam para `'INATIVO'` com `ativo = false`.
- Ao mover para INATIVO, zerar o agendamento correspondente em `agendamentos_clientes`: `status_agendamento = 'Agendar'`, `data_proxima_reposicao = NULL`, `quantidade_total = 0`.

**Atualizar `auto_update_cliente_status_on_entrega`**:
- Incluir `'REATIVAR'` na lista de status que sao convertidos para `'ATIVO'` ao confirmar entrega.

**Atualizar `sync_cliente_status`**:
- Incluir `'REATIVAR'` como status que nao interfere (nao deve ser sobrescrito pelo trigger de sync).

### 2. Frontend: Adicionar status "Reativar"

**`src/types/index.ts`** (linha 1): Adicionar `'Reativar'` ao tipo `StatusCliente`.

**`src/types/cliente-dto.ts`**:
- Adicionar `'REATIVAR'` ao enum `StatusCliente` zod.
- Adicionar mapeamentos em `STATUS_CLIENTE_MAP`, `STATUS_CLIENTE_LABELS`.

**`src/hooks/useClienteStore.ts`** (linha 119-125): Adicionar `'REATIVAR': 'Reativar'` ao `canonicalToUiStatus`.

**`src/utils/clienteDataSanitizer.ts`**: Adicionar `'REATIVAR'` a `VALID_STATUS` e mapeamentos.

### 3. Frontend: Ao criar agendamento para cliente Inativo, setar status "Reativar"

**`src/hooks/agendamento/actions.ts`** -- na funcao `salvarAgendamento`: Ao salvar agendamento para um cliente cujo `status_cliente = 'INATIVO'`, automaticamente atualizar o `status_cliente` do cliente para `'REATIVAR'` e `ativo = true`.

Alternativamente, fazer isso via trigger no banco: ao inserir/atualizar `agendamentos_clientes` com `status_agendamento != 'Agendar'` para um cliente INATIVO, mudar status para REATIVAR. Porem, e mais simples fazer no frontend na action `salvarAgendamento`.

### 4. Frontend: Visibilidade no dashboard

**`src/components/agendamento/utils/clienteVisibilidade.ts`**: Adicionar `'Reativar'` (e o canonical `'REATIVAR'` se necessario) a lista de status visiveis.

### 5. Frontend: Bloquear edicao manual

**`src/components/clientes/ClienteFormDialog.tsx`**: Adicionar `'REATIVAR'` a lista de status que bloqueiam selecao manual de "Ativo".

### 6. Dashboard contadores

Verificar `src/components/dashboard-analytics/` para incluir contagem de clientes "Reativar" nos contadores (provavelmente junto com "A ativar").

## Fluxo completo

```text
Cliente novo (sem entregas) --> A_ATIVAR
Entrega confirmada           --> ATIVO
60 dias sem entrega          --> STANDBY
90 dias sem entrega          --> INATIVO (agendamento zerado)
Agendamento criado manual    --> REATIVAR
Entrega confirmada           --> ATIVO
```

