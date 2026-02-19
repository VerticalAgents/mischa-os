
# Integrar Toggle "Incluir Prod. Agendada" ao Calculo de Formas da Sugestao de Producao

## Problema identificado

O fluxo atual tem uma desconexao entre o toggle e o calculo:

```text
ProjecaoProducaoTab
├── ProducaoAgendadaCard  (exibe prod. agendada)
├── EstoqueDisponivel
│   ├── toggle "Incluir prod. agendada"  ← estado LOCAL (isolado)
│   └── mostra estoque ajustado visualmente
└── SugestaoProducao
    └── recebe estoqueDisponivel direto do useEstoqueDisponivel ← ignora toggle!
```

O `SugestaoProducao` calcula as formas com base no `estoque_disponivel` cru, sem considerar a producao agendada, mesmo quando o toggle esta ativado em `EstoqueDisponivel`.

## Solucao

### 1. Elevar o estado do toggle para `ProjecaoProducaoTab`

O toggle `incluirProducaoAgendada` e `mapaPorProduto` (producao agendada por produto) precisam ser gerenciados no nivel do pai (`ProjecaoProducaoTab`) e propagados para baixo.

### 2. Refatorar `EstoqueDisponivel`

Adicionar props opcionais para receber o estado do toggle do pai:
```typescript
interface EstoqueDisponivelProps {
  // props existentes ...
  incluirProducaoAgendada?: boolean;
  onIncluirProducaoAgendadaChange?: (value: boolean) => void;
}
```

Quando essas props forem fornecidas, o componente usa o estado externo em vez do interno.

### 3. Calcular estoque ajustado em `ProjecaoProducaoTab`

Criar um `useMemo` que aplica a producao agendada ao estoque disponivel dos produtos quando o toggle esta ativo:

```typescript
const estoqueAjustado = useMemo(() => {
  return produtosEstoque.map(p => {
    const extra = incluirProducaoAgendada ? (mapaPorProduto[p.produto_id] || 0) : 0;
    return {
      produto_id: p.produto_id,
      estoque_disponivel: p.estoque_disponivel + extra
    };
  });
}, [produtosEstoque, mapaPorProduto, incluirProducaoAgendada]);
```

### 4. Passar estoque ajustado para `SugestaoProducao`

Em vez de passar o estoque bruto, passar o `estoqueAjustado`:

```typescript
// Antes (linha 300-304):
<SugestaoProducao 
  estoqueDisponivel={produtosEstoque.map(p => ({
    produto_id: p.produto_id,
    estoque_disponivel: p.estoque_disponivel
  }))}
/>

// Depois:
<SugestaoProducao 
  estoqueDisponivel={estoqueAjustado}
/>
```

## Arquivos alterados

### `src/components/pcp/ProjecaoProducaoTab.tsx`
- Adicionar estado `incluirProducaoAgendada` (boolean, false por default)
- Criar `estoqueAjustado` useMemo que soma a producao agendada quando toggle ativo
- Passar `incluirProducaoAgendada` e callback `onIncluirProducaoAgendadaChange` para `EstoqueDisponivel`
- Passar `estoqueAjustado` para `SugestaoProducao`

### `src/components/pcp/EstoqueDisponivel.tsx`
- Adicionar props opcionais `incluirProducaoAgendada?: boolean` e `onIncluirProducaoAgendadaChange?: (v: boolean) => void`
- Quando as props forem fornecidas, usar o estado externo (controlado); caso contrario, manter comportamento atual com estado interno (para retro-compatibilidade)

## Impacto no calculo de formas

Com essa mudanca, quando o usuario ativar "Incluir prod. agendada" no card de Estoque Disponivel:

- O estoque disponivel considerado pelo `SugestaoProducao` aumenta pela quantidade agendada
- Produtos com producao ja agendada suficiente passarao a mostrar "Estoque OK" em vez de sugerir formas
- O numero total de formas sugeridas diminuira corretamente, refletindo a producao que ja esta planejada

Exemplo:
- Produto X: estoque = -10, producao agendada = 30, estoque alvo = 5
- Sem toggle: estoque_atual = -10 → precisa produzir 10 + 5 = 15 un → N formas
- Com toggle ativo: estoque_atual = -10 + 30 = +20 → precisa produzir max(0, 5 - 20) = 0 → Estoque OK
