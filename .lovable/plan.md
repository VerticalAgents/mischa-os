
# Plano: Expandir Sincronização com GestaoClick para Cadastrar Clientes Automaticamente

## Objetivo
Modificar o botão "Sincronizar IDs GC" para:
1. Renomear para **"Sincronizar com Gestão Click"**
2. Além de sincronizar IDs de clientes existentes, **cadastrar automaticamente no GestaoClick** os clientes que não existem lá

## Fluxo Atual vs Novo Fluxo

### Fluxo Atual
```text
1. Buscar todos clientes do GestaoClick
2. Comparar nomes com clientes do Lovable
3. Atualizar gestaoclick_cliente_id dos que foram encontrados
4. Exibir aviso sobre clientes sem correspondência
```

### Novo Fluxo
```text
1. Buscar todos clientes do GestaoClick
2. Comparar nomes com clientes do Lovable
3. Para clientes encontrados: atualizar gestaoclick_cliente_id
4. Para clientes NÃO encontrados: 
   a) Chamar edge function 'criar_cliente_gc' 
   b) Salvar o ID retornado no Lovable
5. Exibir resumo: X sincronizados, Y criados
```

---

## Alterações Necessárias

### 1. Arquivo: `src/pages/Clientes.tsx`

#### 1.1 Renomear função e textos
- Alterar nome da função de `handleSyncGestaoClickIds` para `handleSyncGestaoClick`
- Alterar texto do botão de "Sincronizar IDs GC" para "Sincronizar com Gestão Click"
- Alterar texto durante sincronização de "Sincronizando..." para "Sincronizando..."
- Atualizar tooltip do botão

#### 1.2 Expandir lógica de sincronização
Dentro da função de sincronização, após identificar clientes sem correspondência:

```text
Para cada cliente sem correspondência no GC:
  1. Ignorar clientes internos (AMOSTRAS, Paulo Eduardo)
  2. Chamar supabase.functions.invoke('gestaoclick-proxy', {
       body: {
         action: 'criar_cliente_gc',
         nome: cliente.nome,
         tipo_pessoa: cliente.tipoPessoa || 'PJ',
         cnpj_cpf: cliente.cnpjCpf,
         inscricao_estadual: cliente.inscricaoEstadual,
         endereco: cliente.enderecoEntrega,
         contato_nome: cliente.contatoNome,
         contato_telefone: cliente.contatoTelefone,
         contato_email: cliente.contatoEmail,
         observacoes: cliente.observacoes
       }
     })
  3. Se sucesso, atualizar gestaoclick_cliente_id no Lovable
  4. Contar criados com sucesso
```

#### 1.3 Atualizar feedback ao usuário

```text
Ao final da sincronização, exibir:
- Toast de sucesso: "X cliente(s) sincronizado(s), Y cliente(s) criado(s) no GC"
- Toast de warning se houver erros: "Z cliente(s) não puderam ser criados"
```

---

## Dados Enviados para Criação no GC

Cada cliente será criado no GestaoClick com:

| Campo Lovable | Campo GC |
|---------------|----------|
| nome | nome, razao_social (PJ) |
| tipoPessoa | tipo_pessoa |
| cnpjCpf | cnpj (PJ) ou cpf (PF) |
| inscricaoEstadual | ie |
| enderecoEntrega | enderecos[].logradouro |
| contatoNome | contatos[].nome |
| contatoTelefone | celular |
| contatoEmail | email |
| observacoes | contatos[].observacao |

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Clientes.tsx` | Expandir função `handleSyncGestaoClickIds` para criar clientes no GC e renomear botão |

---

## Resultado Esperado

Ao clicar no botão "Sincronizar com Gestão Click":

1. Sistema busca clientes do GestaoClick
2. Clientes existentes em ambos: atualiza ID no Lovable
3. Clientes apenas no Lovable (como os novos FIGUEIRA 3-15): são criados automaticamente no GestaoClick
4. IDs retornados são salvos no Lovable
5. Exibe resumo: "3 sincronizados, 11 criados no GestaoClick"

---

## Tratamento de Erros

- Se um cliente falhar ao criar, continua com os próximos
- Registra log de erros no console
- Exibe contagem de falhas no toast final
- Clientes que falharem podem ser tentados novamente na próxima sincronização
