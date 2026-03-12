

# Automacao de Status do Cliente (Ativo / Standby / A ativar)

## Resumo das Regras

| Status | Condicao |
|--------|----------|
| **A ativar** | Cliente cadastrado, nenhuma entrega registrada em `historico_entregas` |
| **Ativo** | Ultima entrega confirmada foi ha menos de 60 dias |
| **Standby** | Ultima entrega confirmada foi ha 60 dias ou mais |
| **Em analise** | Mantido como esta (manual) |
| **Inativo** | Mantido como esta (manual, exclusivo do dashboard) |

## Estrategia de Implementacao

A melhor abordagem e uma **database function + trigger** que roda automaticamente quando uma entrega e confirmada (insert em `historico_entregas`), combinada com uma **funcao periodica** que verifica clientes que passaram dos 60 dias e os move para Standby.

### Parte 1: Trigger no banco - Ao confirmar entrega

Criar trigger em `historico_entregas` que, ao inserir uma entrega (tipo = 'entrega'):
1. Atualiza `ultima_data_reposicao_efetiva` do cliente
2. Se o cliente estava em "A ativar" ou "Standby", muda para "Ativo" e seta `ativo = true`

Isso garante que ao confirmar entrega, o cliente volta automaticamente para Ativo.

```sql
CREATE OR REPLACE FUNCTION public.auto_update_cliente_status_on_entrega()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tipo = 'entrega' THEN
    UPDATE public.clientes
    SET 
      status_cliente = 'Ativo',
      ativo = true,
      ultima_data_reposicao_efetiva = NEW.data
    WHERE id = NEW.cliente_id
      AND status_cliente IN ('A ativar', 'Standby');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_status_on_entrega
  AFTER INSERT ON public.historico_entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_cliente_status_on_entrega();
```

### Parte 2: Funcao para mover clientes para Standby (60+ dias)

Funcao que pode ser chamada periodicamente (via cron ou no frontend ao carregar):

```sql
CREATE OR REPLACE FUNCTION public.auto_standby_clientes_inativos_60dias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Clientes ativos cuja ultima entrega foi ha 60+ dias -> Standby
  UPDATE public.clientes
  SET status_cliente = 'Standby'
  WHERE status_cliente = 'Ativo'
    AND ultima_data_reposicao_efetiva IS NOT NULL
    AND ultima_data_reposicao_efetiva < (CURRENT_DATE - INTERVAL '60 days');

  -- Clientes ativos sem nenhuma entrega -> A ativar
  UPDATE public.clientes
  SET status_cliente = 'A ativar'
  WHERE status_cliente = 'Ativo'
    AND ultima_data_reposicao_efetiva IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.historico_entregas he
      WHERE he.cliente_id = clientes.id AND he.tipo = 'entrega'
    );
END;
$$;
```

### Parte 3: Chamar a funcao de standby automatico no frontend

No `useClienteStore.carregarClientes`, apos carregar os clientes, chamar `supabase.rpc('auto_standby_clientes_inativos_60dias')`. Isso garante que toda vez que a lista de clientes e carregada, os status sao atualizados.

### Parte 4: Atualizar visibilidade no dashboard de agendamento

Atualizar `isClienteVisivelAgendamento` para incluir "A ativar":

```ts
export const isClienteVisivelAgendamento = (cliente) => {
  if (cliente.statusCliente === 'Inativo') return false;
  return cliente.ativo === true || 
    cliente.statusCliente === 'Standby' || 
    cliente.statusCliente === 'A ativar';
};
```

### Parte 5: Atualizar o trigger `sync_cliente_status`

O trigger existente `sync_cliente_status` sincroniza `ativo` e `status_cliente`. Precisa ser ajustado para nao interferir com Standby (Standby pode ter `ativo = true` para fins de visibilidade, ou precisamos definir: Standby = `ativo = false`?).

Pela logica atual, Standby com `ativo = false` faz sentido e ja esta tratado no `isClienteVisivelAgendamento`. O trigger existente so converte Ativo<->Inativo, entao nao interfere.

### Parte 6: Impedir edicao manual para Ativo se em Standby

No frontend, quando o usuario tenta editar o status de um cliente que esta em Standby, bloquear a opcao "Ativo" (so pode voltar a Ativo via entrega confirmada). Isso sera feito no componente de edicao de cliente, desabilitando o select de status ou mostrando mensagem explicativa.

## Arquivos alterados

1. **Migration SQL**: Criar trigger + funcoes no banco
2. **`src/hooks/useClienteStore.ts`**: Chamar RPC apos carregar clientes
3. **`src/components/agendamento/utils/clienteVisibilidade.ts`**: Incluir "A ativar"
4. **`src/components/clientes/ClienteForm.tsx`** (ou equivalente): Bloquear edicao manual de status Standby->Ativo

## Riscos e mitigacoes

- **Trigger existente `sync_cliente_status`**: Nao interfere pois so trata Ativo<->Inativo
- **`get_clientes_basic_info`**: Filtra por `ativo = true`, clientes Standby com `ativo = false` nao aparecerao nessa funcao. Mas o `carregarClientes` usa `select('*')` direto, entao nao ha problema
- **`process_entrega_safe`**: Ja atualiza `status_agendamento` e reagenda. O novo trigger adiciona a mudanca de `status_cliente` automaticamente

