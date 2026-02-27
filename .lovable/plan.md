

# Inverter sincronizacao GestaoClick: GC passa a ser fonte da verdade

## Problema atual

1. Ao editar cliente no Lovable, o sistema envia dados para o GestaoClick (PUT), sobrescrevendo campos que estao preenchidos no GC com dados vazios do Lovable (ex: CNPJ, razao social)
2. O campo "razao_social" no GC esta sendo preenchido com o nome fantasia do cliente (linha 2093: `clienteGcBody.razao_social = nome || ''`)
3. Nao existe mecanismo para puxar dados do GC para o Lovable

## Nova regra de negocio

- **Primeiro cadastro** (criar cliente): continua enviando dados do Lovable para o GC (acao `criar_cliente_gc` -- sem alteracao)
- **Edicoes posteriores**: ao salvar, em vez de enviar dados para o GC, o sistema busca os dados do cliente no GC e atualiza o Lovable
- Campos sincronizados do GC para o Lovable: **nome (fantasia)**, **tipo_pessoa**, **cnpj/cpf**, **inscricao_estadual**
- Esses campos ficam **somente leitura** no modal de edicao quando o cliente ja tem `gestaoClickClienteId`

## Arquivos alterados

### 1. Edge Function: `supabase/functions/gestaoclick-proxy/index.ts`

**Novo action `buscar_cliente_gc`**: busca um unico cliente no GC pelo ID e retorna os campos relevantes (nome/fantasia, tipo_pessoa, cnpj/cpf, inscricao_estadual, razao_social).

**Remover/deprecar action `atualizar_cliente_gc`**: nao sera mais utilizada. Pode ser removida ou mantida com um log de warning.

**Corrigir action `criar_cliente_gc`**: remover a linha que seta `razao_social = nome` -- o campo razao_social nao deve ser enviado do Lovable (somente preenchido no GC).

### 2. `src/hooks/useClienteStore.ts` (funcao `atualizarCliente`)

**Substituir** a logica de sincronizacao (linhas 362-395). Em vez de chamar `atualizar_cliente_gc`, chamar o novo `buscar_cliente_gc` e atualizar o Lovable com os dados retornados:

```
// Apos salvar no Supabase, se tem gestaoClickClienteId:
// 1. Buscar dados atualizados do GC
// 2. Atualizar campos no Supabase (nome, tipo_pessoa, cnpj_cpf, inscricao_estadual)
// 3. Atualizar state local
```

### 3. `src/components/clientes/ClienteFormDialog.tsx`

Tornar campos **somente leitura** quando `cliente?.gestaoClickClienteId` existe (modo edicao com vinculo GC):

- Campo **Nome** (linha 348-353): adicionar `disabled` e estilo visual de campo bloqueado
- Campo **Tipo de Pessoa** (linha 357-371): desabilitar RadioGroup
- Campo **CNPJ/CPF** (linha 377-382): adicionar `disabled`
- Campo **Inscricao Estadual** (linha 387-391): adicionar `disabled`

Adicionar um alerta informativo quando esses campos estao bloqueados: "Campos de identificacao gerenciados pelo GestaoClick. Edite diretamente no GC."

### 4. Edge Function `criar_cliente_gc` (correcao)

Remover a linha:
```
clienteGcBody.razao_social = nome || '';
```
A razao social deve ser preenchida diretamente no GC, nunca a partir do Lovable.

## Fluxo resultante

```text
Novo cliente no Lovable
  |
  v
criar_cliente_gc --> POST no GC (nome, tipo_pessoa, cnpj, IE, email)
  |                  (SEM razao_social)
  v
Cliente vinculado (gestaoclick_cliente_id salvo)
  |
  v
Edicao posterior no Lovable
  |
  v
Salvar no Supabase --> buscar_cliente_gc (GET do GC)
  |                        |
  |                        v
  |                    Atualizar Lovable com dados do GC
  |                    (nome, tipo_pessoa, cnpj, IE)
  v
Campos de identificacao ficam read-only no modal
```

## Resumo das alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| `gestaoclick-proxy/index.ts` | Nova action | `buscar_cliente_gc` - GET individual |
| `gestaoclick-proxy/index.ts` | Correcao | Remover `razao_social = nome` do `criar_cliente_gc` |
| `gestaoclick-proxy/index.ts` | Remocao | Action `atualizar_cliente_gc` removida |
| `useClienteStore.ts` | Alteracao | Sync inverte: GC -> Lovable |
| `ClienteFormDialog.tsx` | Alteracao | Campos read-only com vinculo GC |

