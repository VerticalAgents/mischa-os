
# Plano: Remover Razão Social da Sincronização Lovable → GestaoClick

## Problema Identificado
Na Edge Function `gestaoclick-proxy`, ao criar um cliente PJ no GestaoClick, o código está enviando:
```typescript
clienteGcBody.razao_social = nome || '';
```

Isso faz com que o nome do cliente no Lovable sobrescreva a razão social no GestaoClick.

## Regra de Negócio
A **Razão Social** deve ter fluxo **unidirecional**:
- **GestaoClick → Lovable**: Permitido (buscar razão social para exibição)
- **Lovable → GestaoClick**: Bloqueado (nunca enviar razão social)

## Alteração

### Arquivo: `supabase/functions/gestaoclick-proxy/index.ts`

**Linha 1912 - Remover atribuição de razao_social:**

| Antes | Depois |
|-------|--------|
| `clienteGcBody.razao_social = nome \|\| '';` | *(linha removida)* |

O código após a alteração ficará:

```typescript
// Add document based on type
if (tipoPessoa === 'PJ') {
  clienteGcBody.cnpj = cnpj_cpf || '';
  // NÃO enviar razao_social - fluxo unidirecional GC → Lovable
  // Add inscricao_estadual (IE) for PJ
  if (inscricao_estadual) {
    clienteGcBody.ie = inscricao_estadual;
  }
} else {
  clienteGcBody.cpf = cnpj_cpf || '';
}
```

## Campos Sincronizados (Lovable → GestaoClick)

| Campo | Enviado? | Observação |
|-------|----------|------------|
| nome (nome fantasia) | ✅ Sim | Campo `nome` do GC |
| tipo_pessoa (PF/PJ) | ✅ Sim | |
| cnpj/cpf | ✅ Sim | |
| inscricao_estadual | ✅ Sim | Apenas PJ |
| email | ✅ Sim | |
| **razao_social** | ❌ **Não** | Fluxo inverso apenas |

## Resultado Esperado
A sincronização criará/atualizará clientes no GestaoClick sem sobrescrever a razão social. A razão social continuará sendo lida do GestaoClick para exibição no Lovable (hook `useRazaoSocialGC`), mas nunca será enviada de volta.
