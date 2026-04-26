# Corrigir filtro de produtos quando cliente não está no store

## Causa real
O `ProdutoQuantidadeSelector` busca `categoriasHabilitadas` chamando `useClienteStore.getClientePorId(clienteId)`. No fluxo do **representante** (`/rep/clientes` → detalhes → aba Agendamento Atual), o `useClienteStore` nunca é populado, então `cliente` retorna `undefined` e `categoriasHabilitadas` cai como `[]` — fazendo o filtro recém-implementado esconder TODOS os produtos.

No fluxo admin (lista geral de Clientes) o store é populado, por isso lá funciona.

## Correção

### 1. `ProdutoQuantidadeSelector.tsx` — aceitar prop opcional
Adicionar prop opcional `categoriasHabilitadas?: number[]`. Se vier por prop, usar; senão, usar a do store (comportamento atual). Filtro:
```ts
const habilitadas =
  categoriasHabilitadas && categoriasHabilitadas.length > 0
    ? categoriasHabilitadas
    : cliente?.categoriasHabilitadas ?? [];

const produtosFiltrados = produtos.filter(p => {
  if (!p.ativo) return false;
  if (habilitadas.length === 0) return false;
  return habilitadas.includes(p.categoria_id || 0);
});
```

### 2. `src/components/clientes/AgendamentoAtual.tsx`
Já recebe `cliente` como prop. Passar `categoriasHabilitadas={cliente.categoriasHabilitadas}` ao renderizar o seletor.

### 3. `src/components/agendamento/AgendamentoEditModal.tsx`
Mesma coisa — passar `categoriasHabilitadas` se já tiver o objeto cliente em escopo (verificar; provavelmente sim, já que é o modal de edição).

## Resultado
- Representante vê apenas produtos ativos das categorias habilitadas do cliente.
- Admin continua funcionando exatamente igual (fallback para store).
- Mensagem "Nenhum produto disponível…" só aparece quando o cliente realmente não tem categorias habilitadas.
