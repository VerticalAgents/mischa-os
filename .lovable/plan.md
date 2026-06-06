## Objetivo

Trocas e bonificações pendentes de cada agendamento passam a **(a)** debitar estoque na confirmação da entrega e **(b)** somar nos cards "Produtos Necessários" da Separação e do PCP, alinhando o cálculo de necessidades com o que de fato sai do estoque.

## Causa raiz

- `compute_entrega_itens_v2` (Postgres) só considera `itens_personalizados`/proporções padrão.
- `process_entrega_safe` registra trocas/bonificações em tabelas próprias, mas não cria movimentação de saída.
- `useQuantidadesSeparadas` (expedição) e `ProjecaoProducaoTab` (PCP) reusam a mesma lógica e portanto também ignoram trocas/bonificações.

## Mudanças

### 1. Nova função SQL `compute_entrega_itens_completo(p_agendamento_id)`
Retorna `(produto_id, produto_nome, quantidade)` agregando:
- Itens regulares vindos de `compute_entrega_itens_v2`.
- `trocas_pendentes` do agendamento, agrupado por `produto_id` quando presente; se a troca só tiver `produto_nome`, resolve por `lower(nome)` em `produtos_finais`.
- `bonificacoes_pendentes`, mesma regra das trocas.
- `SUM(quantidade)` por `produto_id`, ignorando itens sem produto resolvido ou quantidade ≤ 0.

Grants idênticos aos de `compute_entrega_itens_v2`.

### 2. Atualizar `process_entrega_safe`
- Validação de saldo: trocar o loop atual por um loop sobre `compute_entrega_itens_completo`.
- Inserção em `movimentacoes_estoque_produtos`: usar `compute_entrega_itens_completo` no `SELECT`, com observação preservando o nome do cliente (sem mudar o formato da observação textual já enviada para o histórico).
- `historico_entregas.itens` continua refletindo apenas os itens regulares (`compute_entrega_itens_v2`) para não duplicar o consumo em relatórios de giro/faturamento que já tratam trocas/bonificações separadamente.
- Demais blocos (resumo textual, inserts em `trocas`/`bonificacoes`, reagendamento) permanecem.

### 3. Frontend — Card "Produtos Necessários" da Separação
- `src/hooks/useQuantidadesSeparadas.ts`: após calcular os itens regulares por pedido, somar `pedido.trocas_pendentes` e `pedido.bonificacoes_pendentes` na mesma chave de produto (por nome, já que o card agrega por nome).
- Garantir que o tipo dos pedidos passados (em `ProdutosEmExpedicao.tsx` e onde mais o hook é usado) inclua esses campos — eles já são carregados pelo `useExpedicaoStore`.

### 4. Frontend — Card "Produtos Necessários" do PCP
- `src/components/pcp/ProjecaoProducaoTab.tsx`: trocar a chamada `supabase.rpc('compute_entrega_itens_v2', …)` por `compute_entrega_itens_completo` nas duas listas (confirmados e previstos), para que a projeção semanal já inclua trocas/bonificações pendentes.

### 5. Sem mudanças
- Tabelas `trocas` e `bonificacoes` continuam como log auxiliar.
- Observação textual e fluxo de reagendamento ficam iguais.
- Relatórios financeiros/giro (que já leem `trocas`/`bonificacoes` separadamente) não são tocados.

## Validação

1. Criar agendamento com itens regulares + 1 troca + 1 bonificação.
2. Antes de confirmar:
   - Card "Produtos Necessários" na Separação deve mostrar a soma dos três.
   - Card "Produtos Necessários" no PCP deve mostrar a soma dos três.
3. Confirmar entrega:
   - `movimentacoes_estoque_produtos` deve ter saídas iguais à soma dos três por produto.
   - `historico_entregas.itens` continua apenas com os itens regulares.
   - `trocas`/`bonificacoes` registradas como já são hoje.
4. Tentar confirmar com saldo insuficiente apenas no produto da troca/bonificação: deve bloquear com "Saldo insuficiente".
