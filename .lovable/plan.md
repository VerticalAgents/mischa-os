# Filtrar produtos inativos e fora das categorias habilitadas

## Problema
Nos seletores de produto (em agendamentos e no formulário do cliente) ainda aparecem:
- Produtos marcados como **inativos** no estoque.
- Produtos de **categorias que não estão habilitadas** para o cliente.

## Causa
Os filtros atuais:
- **Não verificam o campo `ativo`** dos produtos.
- Quando o cliente não tem nenhuma categoria habilitada, os filtros caem num fallback "mostrar todos" — o que faz com que produtos de qualquer categoria apareçam.

## Correção

### 1. `src/components/agendamento/ProdutoQuantidadeSelector.tsx`
Substituir o filtro atual por:
```ts
const produtosFiltrados = produtos.filter(p => {
  if (!p.ativo) return false;                              // só ativos
  const habilitadas = cliente?.categoriasHabilitadas ?? [];
  if (habilitadas.length === 0) return false;              // sem categorias = nenhum produto
  return habilitadas.includes(p.categoria_id || 0);
});
```
Atualizar também a mensagem vazia para deixar claro: *"Nenhum produto ativo disponível para as categorias habilitadas deste cliente."*

### 2. `src/components/clientes/ProdutoSelector.tsx`
Mesma lógica, usando o tipo `Produto` (camelCase): checar `produto.ativo` e exigir `categoriasHabilitadas.length > 0`:
```ts
const produtosFiltrados = produtos.filter(p => {
  if (!p.ativo) return false;
  if (!categoriasHabilitadas || categoriasHabilitadas.length === 0) return false;
  return categoriasHabilitadas.includes(p.categoriaId);
});
```

### 3. `src/components/agendamento/TrocasPendentesEditor.tsx` e `EntregasRealizadasSemanal.tsx`
Verificar se também listam produtos sem filtrar por `ativo`/categoria do cliente. Se sim, aplicar o mesmo filtro (ativos + categorias habilitadas do cliente em contexto). Caso esses componentes sejam usados em contextos onde mostrar produtos legados é necessário (ex.: histórico), filtrar apenas por `ativo`.

## Resultado esperado
- Produtos inativos somem do dropdown.
- Cliente sem categoria habilitada → dropdown vazio com mensagem clara.
- Cliente com categorias habilitadas → apenas produtos ativos dessas categorias aparecem.
