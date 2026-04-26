## Objetivo

Otimizar a versão **mobile e tablet** das telas do portal do representante, eliminando:
- tabelas com colunas espremidas/sobrepostas e scroll horizontal ruim
- cabeçalhos de cards com layout quebrado
- toolbars de ícones que estouram a largura
- seções de produtos no modal de agendamento sem responsividade

A experiência desktop fica intacta.

## Mudanças

### 1. Lista "Meus Clientes" (`src/pages/rep/RepClientes.tsx`)

Hoje a tabela tem 5 colunas em `table-fixed` e fica ilegível no mobile.

- **Em telas `< lg`**: substituir a tabela por uma **lista de cards**. Cada card mostra:
  - Linha 1: Nome (negrito, truncate) + badge de status à direita
  - Linha 2: Telefone (muted, pequeno)
  - Linha 3: "Próxima reposição: dd/mm/yyyy" + botão de editar (ícone) à direita
  - Card inteiro clicável para abrir os detalhes
- **Em `lg+`**: manter a tabela atual.
- O botão "Novo cliente" no topo já é grande, sem mudanças.

### 2. Lista "Agendamentos" (`src/pages/rep/RepAgendamentos.tsx`)

Mesmo problema: 5 colunas espremidas, header de status corta texto.

- **Em telas `< lg`**: lista de cards. Cada card mostra:
  - Linha 1: Nome do cliente (negrito) + badge de status (Pendente/Previsto/Agendado) à direita
  - Linha 2: ícone de calendário + data formatada · "Qtd: N" · botão editar à direita
- **Filtros**: empilhar verticalmente em mobile (`flex-col`) com largura total; manter horizontais em `sm+`.
- **Em `lg+`**: manter a tabela atual.

### 3. Estatísticas (`src/pages/rep/RepEstatisticas.tsx` + `SortableClientesTable`)

A tabela de clientes faz scroll horizontal cortando colunas.

- Envolver a `SortableClientesTable` em um wrapper com `overflow-x-auto` e largura mínima na tabela interna, para que o scroll seja claro e não corte conteúdo.
- Adicionar `px-3 lg:px-6` nos containers para evitar que a tabela cole nas bordas.
- Cards de KPI: garantir `grid-cols-1 sm:grid-cols-2` em mobile (já é `md:grid-cols-2 lg:grid-cols-5`, validar que o `sm` também quebra bem).

### 4. Configurações (`src/pages/rep/RepConfiguracoes.tsx`)

O CardHeader empilha mal e a tabela de rotas faz scroll horizontal.

- Trocar o header do card de "Minhas Rotas de Entrega" para `flex-col sm:flex-row` com botão "Nova Rota" abaixo do título no mobile (full-width) e à direita no desktop.
- A tabela de rotas: em `< sm` virar cards verticais simples (Nome + Descrição + Status + ações). Em `sm+` manter tabela com `overflow-x-auto`.

### 5. Modal de Agendamento — seção de Produtos (`src/components/agendamento/ProdutoQuantidadeSelector.tsx`)

A toolbar de ícones quebra o título "Produtos e Quantidades" em duas linhas e estoura a largura.

- Cabeçalho: mudar para `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`. No mobile o título fica em cima e a toolbar de ícones embaixo, alinhada à direita, com `flex-wrap`.
- Linhas de produto: mudar `grid grid-cols-3` para `grid-cols-1 sm:grid-cols-3` para que produto/quantidade/excluir empilhem no mobile.

### 6. Layout geral (`src/layouts/RepLayout.tsx`)

- Reduzir padding do container em mobile: já é `p-4 lg:p-6` (alterado anteriormente). Confirmar que o `max-w-6xl mx-auto` não cria margens excessivas em telas estreitas (está ok com padding).

## Detalhes técnicos

- Padrão de card mobile: usar `<div className="rounded-lg border p-4 space-y-2 bg-card cursor-pointer hover:bg-muted/40 transition-colors">` para manter o look-and-feel do app.
- Breakpoint: usar `lg:` para alternar entre cards (mobile/tablet) e tabela (desktop) — coerente com o sidebar atual que vira hamburger em `< lg`.
- Sem mudanças no schema do banco ou em hooks; tudo é layout/CSS/markup.
- Não vou alterar componentes do admin (como `ClienteFormDialog`, `AgendamentoEditModal` em si) — apenas o `ProdutoQuantidadeSelector` que é compartilhado mas a mudança é puramente responsiva e melhora também o admin em telas pequenas.

## Arquivos editados

- `src/pages/rep/RepClientes.tsx`
- `src/pages/rep/RepAgendamentos.tsx`
- `src/pages/rep/RepEstatisticas.tsx`
- `src/pages/rep/RepConfiguracoes.tsx`
- `src/components/agendamento/ProdutoQuantidadeSelector.tsx`