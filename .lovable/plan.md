## Causa raiz

O componente `CategoriasProdutoSelector` carrega as categorias selecionadas do cliente lendo a tabela `clientes_categorias`. Mas as políticas RLS dessa tabela só permitem leitura para **admin** e **owner/staff** (`is_owner_or_staff()`). O representante não está em nenhum dos dois grupos, então o SELECT volta vazio — e o checkbox aparece desmarcado, mesmo o cliente tendo categorias gravadas (`categorias_habilitadas: [1]` no JSONB do cliente).

Verificado no banco: clientes do representante têm `categorias_habilitadas = [1]` e a tabela espelho `clientes_categorias` também — o que falta é apenas permissão de leitura (e escrita) para o representante.

## Correção

### Migração — RLS de `clientes_categorias`

Adicionar políticas para representantes lerem e gerenciarem (insert/update/delete) as categorias dos seus próprios clientes, no mesmo padrão já usado em `clientes`:

```sql
-- Representante lê categorias dos seus clientes
CREATE POLICY "Representante reads own clientes_categorias"
ON public.clientes_categorias FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
);

-- Representante insere/atualiza/remove categorias dos seus clientes
CREATE POLICY "Representante manages own clientes_categorias"
ON public.clientes_categorias FOR ALL
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
)
WITH CHECK (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
);
```

### Sem mudanças no frontend

O `CategoriasProdutoSelector` e o `useClientesCategorias` já fazem as queries certas — só faltava a permissão.

## Arquivos afetados

- **Novo**: `supabase/migrations/<timestamp>_rls_rep_clientes_categorias.sql`

## Efeito esperado

Ao abrir um cliente existente como representante, as categorias previamente atribuídas aparecem marcadas; e ao salvar alterações nas categorias, a gravação também passa pela RLS sem erro.
