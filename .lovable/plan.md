## Objetivo

Reorganizar a aba **Projeção de Produção** do PCP em 3 linhas, permitindo criar produções agendadas sem sair da aba.

## Novo layout

```text
┌──────────────────────────────────┬──────────────────────────────────┐
│ Estoque de Produtos (Saldo Real) │ Produção Agendada                │
│ por produto                      │ + botão "Nova Produção"          │
├──────────────────────────────────┼──────────────────────────────────┤
│ Produtos Necessários             │ Estoque Disponível (final)       │
└──────────────────────────────────┴──────────────────────────────────┘
┌────────────────────────────────────────┐
│ Sugestão de Produção (largura reduzida)│  ← centralizada, max-w-3xl
└────────────────────────────────────────┘
```

## Mudanças

### 1. Novo card `EstoqueProdutosSaldoRealCard.tsx` (`src/components/pcp/`)

- Mostra produtos ativos com `saldoReal`, agrupados/ordenados por nome.
- Reaproveita `useEstoqueComExpedicao` (mesmo hook usado em `EstoqueProdutosTab`).
- Header: total real + nº de SKUs ativos.
- Lista colapsável (Collapsible) seguindo o padrão visual dos outros cards do PCP (`Package` ícone, badges).
- Sem ações de movimentação — visualização apenas.

### 2. `ProducaoAgendadaCard` ganha botão "Nova Produção"

- Adicionar prop `onNovaProducao?: () => void` e botão no `CardHeader` (canto direito).
- Ao clicar, abre o `HistoricoProducaoModal` (já existe em `src/components/pcp/HistoricoProducaoModal.tsx`).
- Após salvar via modal, chama `adicionarRegistro` do `useSupabaseHistoricoProducao` e dispara `recarregar()` do `useProducaoAgendada` (expor refresh do hook se ainda não exposto — verificar; caso não exposto, adicionar return dele).

### 3. `ProjecaoProducaoTab.tsx` — reordenação

- Remover o `ProducaoAgendadaCard` de cima (atualmente full-width).
- Estrutura nova logo abaixo do seletor de semana:
  - **Linha 1** `grid lg:grid-cols-2 gap-6`: `<EstoqueProdutosSaldoRealCard />` + `<ProducaoAgendadaCard ... onNovaProducao={...} />`.
  - **Linha 2** `grid lg:grid-cols-2 gap-6`: `Produtos Necessários` + `<EstoqueDisponivel ... />` (mantém como está, só muda ordem).
  - **Linha 3**: `<div className="max-w-3xl mx-auto"><SugestaoProducao .../></div>` para reduzir a largura.
- Estado novo: `const [modalNovaProducao, setModalNovaProducao] = useState(false)` + render condicional do `HistoricoProducaoModal` no final do componente.
- Handler `handleSalvarProducao` invoca `adicionarRegistro` (importar `useSupabaseHistoricoProducao`) e refresh do `useProducaoAgendada`.

### 4. Sem mudanças em store, tipos ou RLS

A criação de produção agendada usa o fluxo já existente (mesmo modal usado na aba Registro), apenas exposto a partir da aba Projeção.

## Arquivos editados

- **Criado**: `src/components/pcp/EstoqueProdutosSaldoRealCard.tsx`
- **Editado**: `src/components/pcp/ProjecaoProducaoTab.tsx`
- **Editado**: `src/components/pcp/ProducaoAgendadaCard.tsx` (botão + prop)
- **Editado** (se necessário): `src/hooks/useProducaoAgendada.ts` para expor função de refresh
