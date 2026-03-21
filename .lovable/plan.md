

## Problema

Beatriz vê e edita tudo porque há **duas falhas**:

1. **RLS de `role_permissions` tem política duplicada**: A policy "Staff can read owner permissions" (`user_id = get_owner_id(auth.uid())`) retorna TODAS as permissões do owner. Como as policies são OR, ela sobrepõe a policy correta que filtra por `custom_role_id`. Resultado: `useMyPermissions()` recebe todas as rotas → sidebar mostra tudo.

2. **Nenhuma página usa `can_edit`**: O hook `useRoutePermission` existe mas nenhuma página o consome. Beatriz tem `is_owner_or_staff()` = true nas tabelas, então consegue editar tudo.

## Plano

### 1. Corrigir RLS de `role_permissions` (DB migration)
- **Dropar** a policy "Staff can read owner permissions" (a que usa `get_owner_id`)
- Manter apenas "Staff reads own custom_role permissions" que filtra por `custom_role_id`
- Isso faz `useMyPermissions` retornar apenas as 5 rotas da Beatriz

### 2. Adicionar controle `can_edit` nas páginas permitidas
Nas rotas que Beatriz tem acesso (`/agendamento`, `/estoque/insumos`, `/pcp`, `/precificacao`), usar `useRoutePermission(routeKey)` para:
- Se `can_edit = false`: desabilitar botões de criar/editar/excluir
- Se `can_edit = true`: manter comportamento normal

Páginas a alterar:
- `/agendamento` — `can_edit: false` → somente visualização
- `/estoque/insumos` — `can_edit: true` → normal
- `/pcp` — `can_edit: true` → normal
- `/precificacao` — `can_edit: true` → normal

### 3. Também dropar a policy "Users can manage own role_permissions" 
A policy `auth.uid() = user_id` permite que qualquer usuário que criou permissions as edite diretamente, bypassing admin check. Deve ser removida (somente admins gerenciam via policies existentes).

---

**Resultado**: Sidebar mostra só as 5 rotas. Agendamento fica read-only. Estoque/PCP/Precificação permite edição. Outras rotas ficam inacessíveis.

