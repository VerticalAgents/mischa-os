## Objetivo

Permitir configurar níveis de agrupamento/embalagem por produto (ex.: Unidade → Display 12un → Caixa 72un) e escolher o nível ao lançar quantidades no agendamento. Internamente, tudo continua sendo salvo/processado em unidades — nenhum outro módulo (estoque, PCP, expedição, impressão, preços) precisa mudar.

## 1. Banco de dados

Nova tabela `niveis_embalagem_produto` (uma linha por nível, por produto):

- `produto_id` → `produtos_finais(id)` on delete cascade
- `nome` (ex.: "Unidade", "Display", "Caixa")
- `abreviacao` (ex.: "Un.", "Disp.", "Cx.")
- `unidades_por_nivel` (int, ≥ 1 — quantas unidades unitárias esse nível representa)
- `ordem` (int, para ordenar do menor pro maior)
- timestamps + `created_by`
- Índice único (`produto_id`, `nome`) e (`produto_id`, `unidades_por_nivel`)
- GRANTs padrão + RLS espelhando `produtos_finais` (mesmo owner via `get_owner_id`)

Não altero `produtos_finais` nem `agendamentos_clientes`/itens — quantidade continua sendo salva sempre em unidades.

## 2. Modal de edição do produto (`EditarProdutoModal`)

- Adicionar 3ª aba **"Embalagens"** ao lado de "Componentes".
- Conteúdo da aba:
  - Linha fixa "Unidade (Un.) — 1 un" (não editável, sempre existe implicitamente).
  - Lista das configurações extras: `Nome`, `Abreviação`, `Unidades por [nível]` (int), botão remover.
  - Botão "+ Adicionar nível".
  - Validação: unidades_por_nivel > 1, nomes únicos.
- Mesma aba também no `CriarProdutoModal`.
- Novo hook `useNiveisEmbalagemProduto(produtoId)` (CRUD via Supabase).

## 3. Agendamento — seletor de nível

No editor de itens do agendamento (`ProdutoQuantidadeSelector` e demais pontos em `AgendamentoEditModal`):

- Buscar níveis do produto selecionado.
- Se o produto **não tem** níveis extras → campo travado em "Un." (comportamento atual).
- Se **tem** níveis:
  - Novo `Select` compacto à esquerda do input de quantidade: `Un.`, `Display`, `Caixa`, etc. (ordenado por `ordem` / `unidades_por_nivel`).
  - Ao digitar quantidade `Q` no nível `N` (fator `F`), persiste `Q * F` unidades no item.
  - Ao reabrir/editar, inferir o nível: maior `F` que divide exatamente a quantidade salva; senão cai em "Un.".
  - Texto auxiliar embaixo: `= X unidades`.

Nenhuma mudança em cards de separação/despacho, impressão, PCP, estoque, preço.

## 4. Múltiplas linhas do mesmo produto (novo)

Hoje o agendamento bloqueia adicionar o mesmo produto duas vezes. Vamos flexibilizar:

- **Se o produto tem ≥ 2 níveis de embalagem cadastrados** → permitido adicionar múltiplas linhas do mesmo produto, uma por nível (ex.: 1 linha em Un., 1 em Display, 1 em Caixa).
  - Validação: **um nível por linha** — não pode haver duas linhas do mesmo produto no mesmo nível (mostra erro/tooltip e desabilita a opção já usada no seletor de nível das outras linhas).
  - No dropdown de "Adicionar produto", o produto continua selecionável enquanto ainda existir nível não usado.
- **Se o produto só tem "Un."** → mantém o bloqueio atual (uma linha por produto).
- Ao salvar o agendamento, as linhas são convertidas para unidades e **somadas por produto** antes de persistir em `itens` (o resto do sistema — estoque, PCP, expedição, impressão — segue vendo um total único por produto, sem qualquer mudança).
- Validação de estoque/limites usa a soma total em unidades.

## 5. Detalhes técnicos

- Hook `useNiveisEmbalagemProduto` com cache por `produtoId`; pré-carregar em batch para os produtos do modal de agendamento (evitar N+1).
- Helpers em `src/utils/niveisEmbalagem.ts`: `converterParaUnidades(qtd, nivel)`, `inferirNivel(unidades, niveis)`, `niveisDisponiveisRestantes(produtoId, linhasAtuais)`.
- Nível escolhido fica só no estado local do editor; a persistência continua em unidades agregadas.

## 6. Fora de escopo

- Persistir o nível escolhido junto do item para exibir "2 caixas" nos cards/impressão.
- Preço por nível (desconto por caixa).
- Aplicar a bonificações/trocas (por ora ficam em Un., uma linha por produto).
