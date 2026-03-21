

# Adicionar Role `producao` ao Sistema

## 1. Migration SQL
O campo `role` usa o enum `app_role` do Postgres com valores `admin` e `user`. Criar migration:
```sql
ALTER TYPE app_role ADD VALUE 'producao';
```

## 2. Atualizar `AppRole` em dois arquivos

**`src/hooks/useUserRoles.ts`** (linha 7):
- Mudar tipo para `'admin' | 'user' | 'producao'`
- Adicionar `isProducao()` ao hook, retornando `userRole === 'producao'`
- Incluir `isProducao` no return do hook
- Adicionar `'producao'` na validação do `assignRole` (linha ~100: `includes` check)

**`src/utils/secureAdminValidation.ts`** (linha 4):
- Mudar tipo para `'admin' | 'user' | 'producao'`
- Adicionar `'producao'` na validação do `assignUserRole` (linha ~52: `includes` check)

## 3. Criar `src/components/auth/ProducaoGuard.tsx`
Mesmo padrão do `AdminGuard.tsx`, mas usando `isProducao() || isAdmin()` como condição de acesso (admin sempre passa).

## Resumo de arquivos tocados
- 1 migration SQL (ALTER TYPE)
- `src/hooks/useUserRoles.ts` — tipo + helper
- `src/utils/secureAdminValidation.ts` — tipo
- `src/components/auth/ProducaoGuard.tsx` — novo componente

Nenhuma alteração em `AdminGuard`, `RouteGuard`, `Security.tsx`, ou qualquer outra funcionalidade existente.

