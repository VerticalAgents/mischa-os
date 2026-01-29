
# Plano: Simplificar Sincronização com GestaoClick (incluindo Email)

## Problema Identificado
O botão "Sincronizar com Gestão Click" está enviando campos vazios para o GestaoClick ao criar clientes, o que está zerando informações no cadastro.

## Solução
Modificar a chamada `criar_cliente_gc` para enviar **apenas os campos essenciais**:
- nome
- tipo_pessoa (PF/PJ)
- cnpj_cpf
- inscricao_estadual (apenas para PJ)
- email (contato_email)

## Alterações

### Arquivo: `src/pages/Clientes.tsx`

**Linha 163-176 - Simplificar payload:**

```typescript
const { data: gcResult, error: gcError } = await supabase.functions.invoke('gestaoclick-proxy', {
  body: {
    action: 'criar_cliente_gc',
    nome: cliente.nome,
    tipo_pessoa: cliente.tipoPessoa || 'PJ',
    cnpj_cpf: cliente.cnpjCpf,
    inscricao_estadual: cliente.tipoPessoa === 'PJ' ? cliente.inscricaoEstadual : undefined,
    contato_email: cliente.contatoEmail
  }
});
```

## Campos Sincronizados

| Campo | Enviado? |
|-------|----------|
| nome | Sim |
| tipo_pessoa (PF/PJ) | Sim |
| cnpj_cpf | Sim |
| inscricao_estadual | Sim (apenas PJ) |
| email | Sim |
| endereco | Não |
| contato_nome | Não |
| contato_telefone | Não |
| observacoes | Não |

## Resultado Esperado
A sincronização criará clientes no GestaoClick apenas com os dados essenciais (nome, documento, tipo, IE e email), evitando sobrescrever outros campos com valores vazios.
