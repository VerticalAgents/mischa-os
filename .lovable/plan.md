## Contexto

Nova operação de **private-label (industrialização)** pra uma indústria de alfajores: eles mandam os insumos, você industrializa (produz brownies com a marca deles), eles coletam. Insumos e produtos ficam totalmente segregados dos da Mischa's. Cobrança é por unidade produzida.

## Modelo de dados

Todas as tabelas novas herdam RLS pelo padrão `get_owner_id(auth.uid())`.

### 1. `clientes_industriais`
Cadastro do parceiro private-label.
- `nome`, `cnpj`, `contato_nome/email/telefone`, `endereco`
- `preco_industrializacao_unitario` (R$ por unidade)
- `ativo`

### 2. `insumos_pl` (insumos consignados)
Espelho de `insumos`, mas do cliente. Campos idênticos + `cliente_industrial_id`. Custo = 0 (não é seu). Estoque próprio.

### 3. `produtos_pl` (SKUs private-label)
Espelho reduzido de `produtos_finais` + `cliente_industrial_id`. Não aparece em Clientes, Agendamento, Expedição normal, DRE de venda.

### 4. `receitas_pl` (fichas técnicas PL)
Ficha de cada produto PL apontando pra `insumos_pl` (nunca pros seus).

### 5. `movimentacoes_estoque_insumos_pl` e `movimentacoes_estoque_produtos_pl`
Espelham as tabelas existentes, com triggers `saldo_*_pl`, `sync_estoque_*_pl` e `prevent_negative_*_pl`.

### 6. `ordens_producao_pl`
- `cliente_industrial_id`, `produto_pl_id`, `quantidade_planejada`, `quantidade_produzida`
- `data_producao`, `status` (Planejada / Em produção / Concluída / Coletada)
- Ao concluir: baixa insumos PL (via receita) e entra produto PL no estoque.

### 7. `coletas_pl`
- `cliente_industrial_id`, `data_coleta`, `itens` (produto_pl_id + quantidade), `nota_fiscal`
- Ao registrar: baixa estoque de produtos PL e alimenta faturamento.

### 8. `faturamento_pl` (view ou tabela derivada)
Soma unidades coletadas × `preco_industrializacao_unitario` por período. Vai pro DRE como **receita de serviço** (categoria nova, separada de venda de produto).

## Telas (fase única, entregas incrementais)

Nova rota `/private-label` com sub-abas:

```text
/private-label
├── Dashboard          → resumo: estoque consignado, ordens ativas, faturamento do mês
├── Insumos            → estoque + entradas (quando o cliente manda insumo)
├── Produtos e Fichas  → cadastro de SKUs PL + ficha técnica
├── Produção           → planejar/executar ordens de produção PL
├── Coletas            → registrar coleta, gera faturamento
└── Faturamento        → histórico de industrialização por período
```

Reaproveita componentes existentes (tabelas, dialogs de estoque, PCP) com props isolando pro contexto PL.

## Integração com o resto do sistema

- **PCP / Projeção de produção**: ordens PL entram na fila de produção da fábrica, mas contam com insumos próprios (não afeta necessidade de compra dos seus).
- **DRE**: nova linha "Receita de industrialização" separada de "Receita de venda". Custos dos insumos PL = 0. Custo de produção (mão de obra, energia) é rateio dos seus custos fixos/variáveis (fase 2, opcional).
- **Sidebar**: novo item "Private-Label" abaixo de Estoque.
- **Permissões**: usa `has_route_permission('/private-label', …)`.

## Ordem de implementação sugerida

1. **Fase 1 — Fundação (esta iteração):** migration com todas as tabelas + RLS + triggers de saldo/sync. Rota `/private-label` com abas Insumos e Produtos+Fichas funcionando (cadastro, entrada de insumo consignado, montagem de ficha).
2. **Fase 2:** aba Produção (ordem PL, baixa consignado via ficha, entrada produto PL).
3. **Fase 3:** aba Coletas + Faturamento + linha no DRE.
4. **Fase 4 (opcional):** dashboard e integração fina com PCP.

## Detalhes técnicos

- Padrão de `owner_id uuid` + policies `USING (get_owner_id(auth.uid()) = owner_id)` em todas as tabelas.
- Triggers idênticos aos de `insumos`/`produtos_finais`: `sync_estoque_insumo_pl`, `prevent_negative_insumo_pl`, e análogos pra produtos.
- Função `consumir_insumos_producao_pl(ordem_id)` — replica lógica de baixa por ficha técnica, mas nas tabelas `_pl`.
- Types Supabase serão regenerados automaticamente após a migration.

Confirma que faz sentido começar pela **Fase 1** (fundação + Insumos + Produtos/Fichas) ou quer ajustar algo no modelo antes?
