

## Diagnóstico: Por que a Beatriz não vê nada

A causa-raiz é um **conflito de RLS em cascata** entre as tabelas `role_permissions` e `staff_accounts`.

### O que acontece passo a passo:

1. Beatriz faz login → `useMyPermissions()` busca de `role_permissions`
2. A policy RLS de `role_permissions` faz uma subquery inline:
   ```sql
   custom_role_id = (
     SELECT sa.custom_role_id FROM staff_accounts sa
     WHERE sa.staff_user_id = auth.uid() AND sa.ativo = true
   )
   ```
3. Mas `staff_accounts` tem sua própria RLS: **`owner_id = auth.uid()`**
4. Para a Beatriz, `auth.uid()` = `b7cf88d9...` mas `owner_id` = `7618131a...` (o dono)
5. A subquery retorna **vazio** → `custom_role_id = NULL` → **nenhuma row retornada**
6. `allowedRoutes = []` → sidebar vazia, telas sem dados

### Correção

**1. Corrigir RLS de `role_permissions`** — substituir a subquery inline por chamada à função `get_my_staff_context()` que já é SECURITY DEFINER (ignora RLS):

```sql
DROP POLICY "Staff reads own custom_role permissions" ON role_permissions;
CREATE POLICY "Staff reads own custom_role permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') 
    OR custom_role_id = (SELECT ctx.custom_role_id FROM get_my_staff_context() ctx)
  );
```

**2. Adicionar policy em `staff_accounts`** para staff ler seu próprio registro (necessário para outros contextos futuros):

```sql
CREATE POLICY "Staff can read own record" ON staff_accounts
  FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid());
```

**3. Verificar RLS das tabelas de dados** — as tabelas operacionais usam `is_owner_or_staff()` que é SECURITY DEFINER, então já funcionam. Nenhuma alteração necessária nelas.

### Resultado esperado
- Sidebar mostra 5 itens (Home, Agendamento, Estoque, PCP, Precificação)
- Páginas carregam dados da empresa
- Agendamento fica somente leitura (can_edit=false)
- Outras 3 permitem edição

### Arquivos alterados
- 1 migração SQL (2 policies)
- Nenhuma alteração no frontend (o código já está correto, só não recebia dados do banco)

