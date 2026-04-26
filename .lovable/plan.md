## Diagnóstico

No formulário de cliente do portal do representante, três campos não funcionam:

1. **Categoria do Estabelecimento** — fica em "Carregando…" porque a RLS de `categorias_estabelecimento` só permite `admin` ou `is_owner_or_staff()`. Representante não é nenhum dos dois.
2. **Tipo de Logística** — vazio porque o hook filtra `user_id = auth.uid()` (e a RLS também). Os tipos pertencem ao admin/owner; o representante (auth user separado) não os vê.
3. **Rota de Entrega** — vazio pelo mesmo motivo. Mas aqui a regra de negócio é diferente: cada representante deve ter as **suas próprias rotas**.

## O que será feito

### 1. Acesso do representante a Categoria e Tipo de Logística (do admin/owner)

Tanto Categoria de Estabelecimento quanto Tipo de Logística pertencem ao admin/owner e devem ser **lidos** pelo representante (sem permissão de editar).

- Migration SQL adicionando policies de SELECT em `categorias_estabelecimento` e `tipos_logistica` permitindo que o representante leia os registros do seu owner (resolvido via `representante_accounts.owner_id`, comparando com `tipos_logistica.user_id` / sem filtro extra para `categorias_estabelecimento`).
- Ajustar `useSupabaseTiposLogistica.ts` para, quando o usuário for representante, buscar pelo `owner_id` do representante em vez de `auth.uid()`.
- `useSupabaseCategoriasEstabelecimento.ts` já não filtra por user — basta a policy permitir leitura ao representante.

### 2. Aba "Configurações" no portal do representante

Criar nova rota `/rep/configuracoes` no `RepLayout`, com item "Configurações" no `RepSidebar`. Conteúdo inicial: gerenciamento das **Rotas de Entrega do próprio representante** (CRUD). As rotas continuam sendo escopadas por `user_id = auth.uid()` (cada representante vê apenas as suas).

- Nova página `src/pages/rep/RepConfiguracoes.tsx`.
- Reaproveitar UI no estilo de `RotasEntregaList` (tabela + dialog de adicionar/editar), mas usando o hook existente `useSupabaseRotasEntrega` que já está pronto para escopo `auth.uid()`.
- Adicionar item de menu "Configurações" em `RepSidebar.tsx`.
- Registrar rota em `App.tsx`.

### 3. Ajustes no formulário de cliente (visualização para representante)

- Quando `tipoLogistica = 'Retirada'`, o select de Rota de Entrega já é ocultado — manter.
- Adicionar mensagem amigável quando o representante não tem nenhuma rota cadastrada (com link "Cadastrar rotas em Configurações").
- Garantir que a lista de Tipo de Logística carrega corretamente para o representante após a correção do hook.

## Detalhes técnicos

**Migration (resumo)**

```sql
-- categorias_estabelecimento: representantes podem ler
CREATE POLICY "Representantes can read categorias_estabelecimento"
ON public.categorias_estabelecimento FOR SELECT
USING (public.is_representante());

-- tipos_logistica: representantes podem ler os tipos do seu owner
CREATE POLICY "Representantes can read owner tipos_logistica"
ON public.tipos_logistica FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.representante_accounts ra
    WHERE ra.auth_user_id = auth.uid()
      AND ra.ativo = true
      AND ra.owner_id = tipos_logistica.user_id
  )
);
```

**Hook `useSupabaseTiposLogistica.ts`**: detectar se é representante (via `representante_accounts`); se sim, buscar `owner_id` e filtrar por esse `user_id`. Caso contrário, manter comportamento atual.

**Arquivos**

- `supabase/migrations/<timestamp>_rep_read_cat_logistica.sql` (novo)
- `src/hooks/useSupabaseTiposLogistica.ts` (editar)
- `src/pages/rep/RepConfiguracoes.tsx` (novo)
- `src/components/rep/RepSidebar.tsx` (editar — novo item de menu)
- `src/App.tsx` (editar — nova rota `/rep/configuracoes`)
- `src/components/clientes/ClienteFormDialog.tsx` (editar — mensagem quando rep não tem rotas)

## Fora de escopo

- Edição de Categoria/Tipo de Logística pelo representante (continua exclusivo do admin).
- Outras seções da aba Configurações (apenas Rotas no MVP).
