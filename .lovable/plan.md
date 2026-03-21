

## Plano: Mostrar admin na lista de funcionários + remover role "producao" hardcoded

### O que muda

1. **FuncionariosTab.tsx** - Adicionar o usuário admin (owner) como primeiro item na lista de funcionários
   - Buscar o perfil do usuário logado (admin) via `useAuth`
   - Exibir na tabela como primeira linha com Badge especial "Proprietário / Administrador"
   - Sem botões de ação (não pode desativar a si mesmo)
   - Adicionar um Select para escolher o tipo de acesso (custom_role) ao criar funcionário, em vez do hardcoded "Gerente de Produção"

2. **FuncionariosTab.tsx** - Permitir atribuir custom_roles aos funcionários
   - No dialog de criação, trocar o badge fixo "Gerente de Produção" por um Select que lista os custom_roles criados na aba "Tipos de Acesso"
   - Na tabela, mostrar o nome do custom_role atribuído (via `staff_accounts.role` ou uma nova coluna `custom_role_id`)

3. **Remover referências hardcoded ao role "producao"**
   - No `SidebarContent.tsx`, trocar a lógica `userRole !== 'producao'` por uma verificação genérica: se o usuário tem `allowedRoutes` do DB, filtrar; se é admin, mostrar tudo
   - No `FuncionariosTab.tsx`, remover o hardcoded `role: 'producao'` no create e o `roleLabel` que traduz "producao" → "Gerente de Produção"

4. **Migração DB** (opcional mas recomendada) - Adicionar coluna `custom_role_id` na tabela `staff_accounts` para vincular funcionários aos custom_roles
   - `ALTER TABLE staff_accounts ADD COLUMN custom_role_id uuid REFERENCES custom_roles(id) ON DELETE SET NULL;`

### Detalhes técnicos

- O admin aparece na lista buscando o user logado via `useAuth()` e consultando `profiles`
- O Select de tipo de acesso usa o hook `useCustomRoles()` já existente
- A sidebar passa a usar: se `userRole === 'admin'` → tudo; senão → `allowedRoutes` do DB; senão → nada (ou fallback mínimo)
- A coluna `custom_role_id` em `staff_accounts` substitui o campo `role` text para funcionários, permitindo vincular ao sistema dinâmico de permissões

### Arquivos afetados
- `src/components/configuracoes/tabs/FuncionariosTab.tsx` — mostrar admin + select de custom_role
- `src/components/layout/SidebarContent.tsx` — remover lógica hardcoded "producao"
- Migration SQL — adicionar `custom_role_id` a `staff_accounts`

