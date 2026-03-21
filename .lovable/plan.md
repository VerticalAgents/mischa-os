

## Plano: Exibir credenciais de login nos modais de edição e visualização

### Problema
As senhas não são armazenadas na tabela `staff_accounts` — são enviadas ao Supabase Auth na criação e não podem ser recuperadas depois. O email vem da tabela `profiles`. Para mostrar as credenciais de acesso, precisamos armazená-las na própria `staff_accounts`.

### Mudanças

**1. Migração DB** — Adicionar colunas `login_email` e `senha_acesso` em `staff_accounts`
- `login_email text` — email de login do funcionário
- `senha_acesso text` — senha definida na criação (armazenada em texto para o dono poder compartilhar)
- Atualizar os registros existentes preenchendo `login_email` a partir da tabela `profiles`

**2. Edge Function `create-staff-user`** — Salvar email e senha na `staff_accounts` no momento da criação

**3. FuncionariosTab.tsx** — Três mudanças principais:
- **Modal de Edição**: Mostrar email e senha (somente leitura) além dos campos editáveis (nome, tipo de acesso). Permitir editar a senha também (opcional, com campo de nova senha)
- **Botão de Visualizar** (ícone Eye): Abre modal read-only com nome, email, senha (com toggle mostrar/ocultar) e tipo de acesso
- **Botão Copiar**: No modal de visualização, botão que copia as credenciais formatadas para a área de transferência (ex: "Login: email@x.com / Senha: 123456") para enviar por WhatsApp/email

### Arquivos afetados
- Migration SQL — `ALTER TABLE staff_accounts ADD COLUMN login_email text, ADD COLUMN senha_acesso text`
- `supabase/functions/create-staff-user/index.ts` — salvar email/senha
- `src/components/configuracoes/tabs/FuncionariosTab.tsx` — modal de visualização + edição com credenciais
- `src/integrations/supabase/types.ts` — atualizado automaticamente

### Nota de segurança
Armazenar senhas em texto plano não é ideal, mas é necessário para o caso de uso solicitado (compartilhar credenciais com funcionários). O acesso é restrito ao owner via RLS.

