
# Plano: Adicionar Tipo Pessoa (PF/PJ) e Inscrição Estadual no Cadastro de Cliente

## ✅ IMPLEMENTADO

## Objetivo

Implementar os seguintes campos no cadastro de cliente:
1. **Seletor Tipo de Pessoa**: Pessoa Física (PF) ou Pessoa Jurídica (PJ) ✅
2. **Inscrição Estadual**: Campo visível apenas para Pessoa Jurídica ✅
3. **CPF/CNPJ dinâmico**: Exibir campo de CPF para PF ou CNPJ para PJ ✅
4. **Sincronização com GestaoClick**: Enviar `inscricao_estadual` ao criar/atualizar cliente ✅

## Comportamento Implementado

| Tipo Pessoa | Documento | Inscrição Estadual |
|-------------|-----------|-------------------|
| Pessoa Física | CPF | Oculto |
| Pessoa Jurídica | CNPJ | Visível |

- **Clientes existentes**: Todos iniciam como "Pessoa Jurídica" por padrão ✅
- **Novos clientes**: O seletor inicia como "Pessoa Jurídica" por padrão ✅

---

## Etapas Implementadas

### 1. ✅ Alteração no Banco de Dados

Colunas adicionadas na tabela `clientes`:
- `tipo_pessoa`: TEXT (valores: 'PF' ou 'PJ', default 'PJ')
- `inscricao_estadual`: TEXT (nullable)
- Constraint `clientes_tipo_pessoa_check` para validar valores

### 2. ✅ Tipos TypeScript Atualizados

**Arquivo:** `src/types/index.ts`
- Adicionado tipo `TipoPessoa = 'PF' | 'PJ'`
- Adicionados campos na interface `Cliente`: `tipoPessoa`, `inscricaoEstadual`

**Arquivo:** `src/types/cliente-dto.ts`
- Adicionado enum `TipoPessoa` com valores 'PF', 'PJ'
- Adicionado `TipoPessoaType`
- Adicionados campos ao schema `ClienteDTO`
- Adicionado `TIPO_PESSOA_LABELS`

### 3. ✅ Sanitizador de Dados Atualizado

**Arquivo:** `src/utils/clienteDataSanitizer.ts`
- Sanitização para `tipoPessoa` (default: 'PJ')
- Mapeamento para `tipo_pessoa` e `inscricao_estadual` no `dbData`
- Limpeza de `inscricaoEstadual` quando `tipoPessoa === 'PF'`

### 4. ✅ Store do Cliente Atualizado

**Arquivo:** `src/hooks/useClienteStore.ts`
- `transformDbRowToCliente` lê `tipo_pessoa` e `inscricao_estadual`
- `adicionarCliente` envia `tipo_pessoa` e `inscricao_estadual` para GestaoClick
- `atualizarCliente` sincroniza automaticamente com GestaoClick quando cliente tem ID vinculado

### 5. ✅ Formulário de Cliente Atualizado

**Arquivo:** `src/components/clientes/ClienteFormDialog.tsx`
- RadioGroup para seleção de Tipo Pessoa (PF/PJ)
- Campo de Inscrição Estadual visível apenas para PJ
- Label dinâmica CPF/CNPJ baseada no tipo de pessoa
- Placeholder dinâmico no campo de documento
- Defaults atualizados para incluir `tipoPessoa: 'PJ'` e `inscricaoEstadual: ''`

### 6. ✅ Edge Function do GestaoClick Atualizada

**Arquivo:** `supabase/functions/gestaoclick-proxy/index.ts`

**Action `criar_cliente_gc`:**
- Recebe `tipo_pessoa` e `inscricao_estadual` nos params
- Envia campo `ie` no payload quando PJ

**Nova Action `atualizar_cliente_gc`:**
- Atualiza cliente existente no GestaoClick via PUT
- Envia todos os campos incluindo `ie` (Inscrição Estadual)
- Chamado automaticamente após `atualizarCliente` no store

---

## Resultado

1. ✅ Ao abrir formulário de cliente existente: Tipo Pessoa = "Pessoa Jurídica", campos CNPJ e IE visíveis
2. ✅ Ao selecionar "Pessoa Física": Campo CPF visível, campo IE oculto
3. ✅ Ao criar novo cliente PJ: Cliente criado no Lovable E no GestaoClick com IE
4. ✅ Ao atualizar cliente PJ existente: Dados atualizados no Lovable E no GestaoClick incluindo IE
