
# Plano: Adicionar Tipo Pessoa (PF/PJ) e Inscrição Estadual no Cadastro de Cliente

## Objetivo

Implementar os seguintes campos no cadastro de cliente:
1. **Seletor Tipo de Pessoa**: Pessoa Física (PF) ou Pessoa Jurídica (PJ)
2. **Inscrição Estadual**: Campo visível apenas para Pessoa Jurídica
3. **CPF/CNPJ dinâmico**: Exibir campo de CPF para PF ou CNPJ para PJ
4. **Sincronização com GestaoClick**: Enviar `inscricao_estadual` ao criar/atualizar cliente

## Comportamento Esperado

| Tipo Pessoa | Documento | Inscrição Estadual |
|-------------|-----------|-------------------|
| Pessoa Física | CPF | Oculto |
| Pessoa Jurídica | CNPJ | Visível |

- **Clientes existentes**: Todos iniciam como "Pessoa Jurídica" por padrão (para que você possa atualizar manualmente depois)
- **Novos clientes**: O seletor inicia como "Pessoa Jurídica" por padrão

---

## Etapas de Implementação

### 1. Alteração no Banco de Dados

Adicionar duas novas colunas na tabela `clientes`:

```text
tipo_pessoa: TEXT (valores: 'PF' ou 'PJ', default 'PJ')
inscricao_estadual: TEXT (nullable)
```

### 2. Atualizar Tipos TypeScript

**Arquivo:** `src/types/index.ts`

- Adicionar tipo `TipoPessoa = 'PF' | 'PJ'`
- Adicionar campos à interface `Cliente`:
  - `tipoPessoa?: TipoPessoa`
  - `inscricaoEstadual?: string`

**Arquivo:** `src/types/cliente-dto.ts`

- Adicionar enum `TipoPessoa` com valores 'PF', 'PJ'
- Adicionar campos ao schema `ClienteDTO`

### 3. Atualizar Sanitizador de Dados

**Arquivo:** `src/utils/clienteDataSanitizer.ts`

- Adicionar sanitização para `tipoPessoa` (default: 'PJ')
- Adicionar mapeamento para `inscricao_estadual` no `dbData`
- Validar que `inscricaoEstadual` só está preenchido quando `tipoPessoa === 'PJ'`

### 4. Atualizar Store do Cliente

**Arquivo:** `src/hooks/useClienteStore.ts`

- Atualizar `transformClienteToDbRow` para incluir novos campos
- Atualizar `transformDbRowToCliente` para ler `tipo_pessoa` e `inscricao_estadual`
- Atualizar chamada `criar_cliente_gc` para enviar `inscricao_estadual`

### 5. Atualizar Formulário de Cliente

**Arquivo:** `src/components/clientes/ClienteFormDialog.tsx`

**Card "Dados Básicos" - Layout Proposto:**

```text
┌─────────────────────────────────────────────────────────────────┐
│ Dados Básicos                                                   │
├─────────────────────────────────────────────────────────────────┤
│ [ID Cliente GC]  [Nome *]           [Tipo Pessoa: ○PF ●PJ]      │
│                                                                 │
│ [CNPJ]           [Inscrição Estadual]  ← visíveis se PJ         │
│  ou [CPF]                              ← visível se PF          │
│                                                                 │
│ [Endereço de Entrega]                                           │
│ [Link Google Maps]                                              │
│ [Nome Contato]   [Telefone]          [Email]                    │
└─────────────────────────────────────────────────────────────────┘
```

**Mudanças:**
- Adicionar `RadioGroup` para seleção de Tipo Pessoa (PF/PJ) após o campo Nome
- Adicionar campo de Inscrição Estadual (visível apenas para PJ)
- Mudar label do campo CNPJ/CPF dinamicamente:
  - PJ: "CNPJ" + "Inscrição Estadual"
  - PF: "CPF" (sem campo de IE)
- Atualizar `getDefaultFormData()` com `tipoPessoa: 'PJ'`
- Atualizar `clienteTemp` com novos campos

### 6. Atualizar Edge Function do GestaoClick

**Arquivo:** `supabase/functions/gestaoclick-proxy/index.ts`

**Action `criar_cliente_gc`:**
- Adicionar parâmetro `inscricao_estadual` nos params recebidos
- Incluir campo `ie` (ou nome correto da API GestaoClick) no payload quando PJ

**Nova Action `atualizar_cliente_gc`:**
- Criar nova action para atualizar cliente existente no GestaoClick via PUT/PATCH
- Enviar todos os campos incluindo `inscricao_estadual`
- Chamar automaticamente após `atualizarCliente` no store

**Payload para GestaoClick (Pessoa Jurídica):**
```json
{
  "tipo_pessoa": "PJ",
  "nome": "...",
  "cnpj": "...",
  "razao_social": "...",
  "ie": "123456789",
  ...
}
```

**Payload para GestaoClick (Pessoa Física):**
```json
{
  "tipo_pessoa": "PF",
  "nome": "...",
  "cpf": "...",
  ...
}
```

### 7. Sincronização com GestaoClick na Atualização

**Arquivo:** `src/hooks/useClienteStore.ts`

Na função `atualizarCliente`:
- Após salvar no Supabase com sucesso
- Verificar se cliente tem `gestaoClickClienteId`
- Se sim, chamar nova action `atualizar_cliente_gc` na edge function
- Exibir toast de sucesso/erro da sincronização

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/types/index.ts` | Adicionar `TipoPessoa` e campos na interface `Cliente` |
| `src/types/cliente-dto.ts` | Adicionar enum e campos ao schema |
| `src/utils/clienteDataSanitizer.ts` | Adicionar sanitização dos novos campos |
| `src/hooks/useClienteStore.ts` | Atualizar transformações e adicionar sync ao atualizar |
| `src/components/clientes/ClienteFormDialog.tsx` | Adicionar UI para seletor e campo IE |
| `supabase/functions/gestaoclick-proxy/index.ts` | Adicionar IE no criar e criar action atualizar |

---

## Considerações Técnicas

### Migração de Dados Existentes
- Todos os clientes existentes serão tratados como PJ por padrão (coluna `tipo_pessoa` com default 'PJ')
- Campo `inscricao_estadual` ficará nulo até ser preenchido manualmente

### API GestaoClick
- O campo de Inscrição Estadual no GestaoClick geralmente é chamado `ie` ou `inscricao_estadual`
- A edge function atual já detecta se é PF/PJ pelo tamanho do documento
- Precisamos adicionar o campo `ie` no payload de criação/atualização

### Validação
- CPF: 11 dígitos (sem formatação)
- CNPJ: 14 dígitos (sem formatação)
- Inscrição Estadual: formato varia por estado, validação básica de texto não-vazio

---

## Resultado Esperado

1. Ao abrir formulário de cliente existente: Tipo Pessoa = "Pessoa Jurídica", campos CNPJ e IE visíveis
2. Ao selecionar "Pessoa Física": Campo CPF visível, campo IE oculto
3. Ao criar novo cliente PJ: Cliente criado no Lovable E no GestaoClick com IE
4. Ao atualizar cliente PJ existente: Dados atualizados no Lovable E no GestaoClick incluindo IE
