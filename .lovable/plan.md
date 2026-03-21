
Objetivo: corrigir o acesso da Beatriz para que a navegação e os dados respeitem exatamente o “Tipo de Acesso” (can_access/can_edit), sem mostrar menus indevidos e sem telas vazias nas rotas permitidas.

Assunção crítica usada no plano: funcionário deve trabalhar nos dados da empresa (owner), não em dados isolados da própria conta staff.

1) Diagnóstico confirmado (causas-raiz)
- O menu lateral ativo no app é `SessionNavBar` (`src/components/ui/sidebar-next.tsx`), e ele hoje NÃO usa `role_permissions`; por isso aparecem quase todos os itens.
- O hook `useMyPermissions` (`src/hooks/useRolePermissions.ts`) busca permissões sem filtrar por `custom_role_id`; ele mistura permissões de todos os tipos.
- `get_user_role()` no banco usa `LIMIT 1` sem prioridade; como a Beatriz tem `user` + `producao`, a role pode vir errada e liberar telas indevidas.
- RLS atual bloqueia staff em boa parte dos dados (admin-only ou `auth.uid() = user_id`), então mesmo com rota “permitida”, a tela fica sem informação.

2) Correção da base de permissões (DB + hook)
- Criar função SQL segura para contexto do staff (owner_id + custom_role_id ativo) sem expor senha:
  - Ex.: `public.get_my_staff_context()` (SECURITY DEFINER).
- Ajustar `public.get_user_role(user_id)` para prioridade determinística (admin > producao > user), removendo efeito aleatório do `LIMIT 1`.
- Endurecer política de `role_permissions` para staff ler somente permissões do próprio `custom_role_id` (não todas do owner).
- Refatorar `useMyPermissions()` para carregar permissões efetivas:
  - Admin: acesso total.
  - Staff: somente linhas do `custom_role_id` dele.
  - Retornar também mapa por rota: `{ can_access, can_edit }`.

3) Aplicar permissões na navegação e bloqueio de URL direta
- Atualizar `SessionNavBar` para filtrar `menuGroups/items` usando `allowedRoutes` reais.
- Atualizar `MobileMenuOverlay` com a mesma regra (hoje mostra tudo no mobile).
- Criar guard de rota por permissão (ex.: `RoutePermissionGuard`) para impedir URL manual:
  - Sem `can_access`: redireciona para `/home` (ou primeira rota permitida).
- Integrar guard no roteamento (`src/App.tsx`) para rotas funcionais controladas por tipo de acesso.

4) Fazer os dados aparecerem nas rotas permitidas (RLS por rota)
- Criar função SQL `has_route_permission(route_key text, need_edit boolean)` (SECURITY DEFINER) que valida:
  - owner/admin
  - staff ativo
  - `role_permissions` do `custom_role_id` correto.
- Revisar políticas RLS das tabelas usadas nas rotas da Beatriz (`/agendamento`, `/estoque/insumos`, `/pcp`, `/precificacao`) para:
  - SELECT condicionado a `has_route_permission(..., false)`.
  - INSERT/UPDATE/DELETE condicionado a `has_route_permission(..., true)`.
  - Em tabelas com `user_id`, usar `user_id = get_owner_id(auth.uid())` para staff enxergar dados da empresa.
- Resultado: rota permitida mostra dados; rota com só leitura mostra dados sem permitir edição.

5) Conectar `can_edit` na UI (comportamento esperado pelo usuário)
- Criar util/hook por rota (ex.: `useRoutePermission(routeKey)`).
- Nos módulos principais (PCP, Agendamento, Estoque, Precificação):
  - Se `can_edit = false`: ocultar/desabilitar criar/editar/excluir e mostrar badge “Somente visualização”.
  - Se `can_edit = true`: manter ações normais.

6) Validação final (E2E)
- Teste com owner:
  - Continua vendo tudo, gerenciando funcionários e tipos de acesso.
- Teste com Beatriz:
  - Sidebar só com rotas permitidas do tipo “Gerente de Produção”.
  - URL direta para rota não permitida é bloqueada.
  - Rotas permitidas carregam dados da empresa (sem tela vazia).
  - Em rotas sem edição, botões de alteração ficam bloqueados.
- Teste de segurança:
  - Confirmar via SQL que staff não lê permissões de outros tipos.
  - Confirmar que `get_user_role` não retorna role errada por ordem aleatória.

Arquivos principais a alterar
- Frontend:
  - `src/hooks/useRolePermissions.ts`
  - `src/components/ui/sidebar-next.tsx`
  - `src/components/layout/MobileMenuOverlay.tsx`
  - `src/components/navigation/*` (novo guard)
  - `src/App.tsx`
  - páginas de ação (PCP/Agendamento/Estoque/Precificação) para `can_edit`
- Banco (migrações):
  - funções SQL de contexto/permissão
  - ajuste de políticas RLS em `role_permissions` e tabelas das rotas citadas
  - correção de `get_user_role`
