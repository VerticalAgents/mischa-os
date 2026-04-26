## Objetivo

Criar um tipo de acesso específico para **representantes comerciais**, com login próprio. Cada representante enxerga apenas:
- Clientes vinculados a ele (campo `representante_id`)
- Agendamentos desses clientes
- Pode cadastrar novos clientes (sempre forçado como representante)
- Pode editar agendamentos, **mas apenas status e data** (garantido no banco via RPC dedicada)

Não vê clientes de outros representantes nem clientes sem representante. Não tem acesso a Expedição, PCP, Financeiro, Configurações, etc.

Histórico de entregas, indicadores próprios, funil de leads e dados financeiros ficam para a **fase 2**.

## Arquitetura

Estrutura paralela ao padrão de `staff_accounts`, em uma nova tabela `representante_accounts`. Mantida separada porque o representante é um perfil único e bem definido, com regra de visibilidade muito específica.

```text
┌──────────────────────┐      ┌──────────────────────────┐
│ representantes       │◄─────│ representante_accounts   │
│  - id (int)          │ 1:1  │  - representante_id (FK) │
│  - nome, email...    │      │  - auth_user_id (uuid)   │
└──────────────────────┘      │  - login_email           │
                              │  - ativo, owner_id       │
                              └──────────────────────────┘
                                         │
                                         ▼
                                 auth.users + user_roles('representante')
```

## Implementação

### 1. Banco de dados (migration)

- Adicionar valor `representante` ao enum `app_role`
- Criar tabela `representante_accounts` (id, representante_id FK, auth_user_id FK auth.users, login_email, ativo, owner_id, timestamps)
- RLS na nova tabela: admin gerencia tudo; representante lê o próprio registro
- Funções helper SECURITY DEFINER:
  - `is_representante()` → boolean
  - `get_my_representante_id()` → integer
- Novas RLS policies (somando às existentes de admin/staff):
  - `clientes` SELECT: representante vê linhas onde `representante_id = get_my_representante_id()`
  - `clientes` INSERT: representante insere apenas com `representante_id = get_my_representante_id()`
  - `clientes` UPDATE: representante edita apenas seus clientes (sem mudar representante_id)
  - `agendamentos_clientes` SELECT: representante vê agendamentos cujo cliente é dele
  - `agendamentos_clientes` UPDATE: **BLOQUEADO** para representante (forçado a usar RPC)
  - `representantes` SELECT: representante vê apenas o próprio registro
- **RPC `representante_update_agendamento(p_agendamento_id uuid, p_status text, p_data_proxima_reposicao date)`**:
  - SECURITY DEFINER
  - Valida que o caller é representante e que o agendamento pertence a um cliente dele
  - Atualiza apenas os dois campos permitidos

### 2. Edge function `create-representante-user`

Espelho da `create-staff-user`:
- Recebe `representante_id`, `email`, `senha` (validados via Zod)
- Valida que o caller é admin (via `getClaims` + `has_role`)
- Cria usuário no `auth.users` com service role
- Insere em `representante_accounts` vinculando os dois
- Atribui role `representante` em `user_roles`
- Retorna sucesso/erro com mensagens claras

### 3. UI — Gestão Comercial → Representantes

Na tabela de representantes existente:
- Nova coluna **"Acesso"**: badge "Ativo / Sem acesso"
- Botão **"Criar acesso"** (representantes sem login) abre modal pedindo email + senha
- Botão **"Revogar acesso"** (representantes com login ativo) desativa o `representante_accounts.ativo`
- Botão **"Resetar senha"** reaproveita a edge function `update-staff-password` ou cria espelho

### 4. UI — Roles, rotas e navegação

- `useUserRoles.ts` (e tipo `AppRole`): adicionar `'representante'`
- Novo `RepresentanteGuard` (espelho do `AdminGuard`)
- `navigation-items.tsx`: quando `userRole === 'representante'`, sidebar mostra apenas: **Home**, **Clientes**, **Agendamento**
- `App.tsx`: rotas restantes (Expedição, PCP, Financeiro, Configurações, Analytics, Relatórios, etc.) redirecionam para `/home` quando role é representante
- Home com widgets simplificados (ou redirecionar direto pra Clientes na fase 1)

### 5. UI — Páginas operacionais

- **Clientes**:
  - Lista vem filtrada via RLS automaticamente
  - No formulário de novo/editar cliente, quando role é representante: campo "Representante" fica oculto e fixo no `representante_id` dele
- **Agendamento**:
  - Lista filtrada via RLS automaticamente
  - No `AgendamentoEditModal`, quando role é representante: apenas **status** e **data da próxima reposição** ficam editáveis; demais campos viram read-only
  - Hook de salvar agendamento detecta role representante e chama a **RPC `representante_update_agendamento`** em vez do update direto
  - Reaproveita o padrão `EditPermissionContext` para os campos read-only

## Resumo dos arquivos impactados

- 1 migration SQL (enum, tabela, RLS, funções, RPC)
- 1 edge function nova (`create-representante-user`)
- `src/hooks/useUserRoles.ts` (adicionar role)
- `src/components/auth/` (novo `RepresentanteGuard`)
- `src/components/layout/navigation-items.tsx` (filtrar por role)
- `src/App.tsx` (proteger rotas)
- `src/pages/gestao-comercial/Representantes.tsx` (coluna + botões)
- 1 modal novo: `CriarAcessoRepresentanteDialog`
- `src/components/clientes/ClienteFormDialog` (esconder campo representante)
- `src/components/agendamento/AgendamentoEditModal` + hook de save (read-only + RPC)

## Notas de segurança

- Senhas definidas pelo admin no momento da criação (alinhado com `mem://auth/staff-credentials-management-policy`)
- RPC garante que mesmo via DevTools o representante só consegue alterar status e data
- RLS bloqueia visibilidade no banco — não depende só de filtros de UI
- Role assignment via edge function (admin-only) — nunca pelo cliente
