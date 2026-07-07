# Plano: Private-Label integrado (Opção 3)

Objetivo: eliminar a aba `/private-label` e integrar a operação de industrialização nos fluxos já existentes (Estoque, PCP, Expedição, DRE), mantendo `clientes_industriais` como tabela separada e marcando insumos/produtos consignados via `cliente_industrial_id`.

Princípio norteador: **nenhuma query existente pode mudar de comportamento por padrão**. Todas as leituras atuais passam a filtrar `cliente_industrial_id IS NULL` para continuar mostrando só o universo Mischa's. Quem quiser ver PL opta explicitamente.

---

## Fase 0 — Migração de schema (não destrutiva)

1. Manter `clientes_industriais` (já criada). Remover `produtos_pl`, `insumos_pl`, `receitas_pl`, `movimentacoes_estoque_*_pl`, `ordens_producao_pl`, `coletas_pl` — não estão em uso.
2. Adicionar colunas nullable:
   - `insumos.cliente_industrial_id uuid null references clientes_industriais(id)`
   - `produtos_finais.cliente_industrial_id uuid null references clientes_industriais(id)`
   - `itens_receita` já aponta pra insumo/produto — herda naturalmente.
   - `historico_producao.cliente_industrial_id uuid null` (marca a ordem como PL).
   - `historico_entregas.cliente_industrial_id uuid null` + `tipo_movimento text` (`venda` default, `coleta_pl`) — coletas viram um tipo de "entrega".
3. Índices parciais em `cliente_industrial_id` para performance.
4. RLS: policies atuais já filtram por `owner_id`; nada muda. Adicionar constraint: se produto tem `cliente_industrial_id`, todos os insumos da receita têm que ter o mesmo `cliente_industrial_id` (trigger de validação).
5. Custo dos insumos PL: manter campo `custo_medio` mas ignorar em cálculos de DRE de venda (não é seu custo). Adicionar helper SQL `is_insumo_pl(insumo_id)`.

## Fase 1 — Cadastro do cliente industrial

- Nova sub-aba em **Configurações** → "Clientes Industriais" (CRUD simples do que já existe em `ClientesIndustriaisTab.tsx`, movido pra lá).
- Remover rota `/private-label` do `App.tsx` e item do sidebar.

## Fase 2 — Estoque integrado com filtro

- Em **Estoque → Insumos** e **Estoque → Produtos**: adicionar filtro `Contexto: [Mischa's | Alfajor XYZ | Todos]` no topo. Default = "Mischa's" (comportamento atual preservado).
- Cadastro de insumo/produto ganha campo opcional "Pertence a cliente industrial" (select). Se preenchido, o item vira PL.
- Visualmente: linhas PL ganham badge colorido com nome do cliente.
- Entradas de estoque PL: mesmo dialog de movimentação; ao registrar, custo = 0 automático (bloqueado no form quando `cliente_industrial_id` presente).
- **Blindagem**: todos os hooks que hoje carregam insumos/produtos pra telas de Mischa's (agendamento, precificação, DRE de venda, análise de giro, expedição normal, sugestão de produção Mischa's) passam a filtrar `cliente_industrial_id IS NULL`. Auditar: `useSupabaseInsumos`, `useSupabaseProdutos`, `useProdutoStore`, `useInsumoStore`, `useEstoqueProdutos`, `useEstoqueDisponivel`, `useProdutosAtivos`, `useEstoqueComExpedicao`, `useNecessidadeInsumos`, `useListaComprasAutomatica`, `useConsumoSemanalInsumos`, `usePrecificacaoClienteStore`, hooks de DRE e giro.

## Fase 3 — Fichas técnicas PL

- Ficha técnica reaproveita `itens_receita`. Ao criar receita pra produto PL, o dialog de seleção de insumos filtra automaticamente pelo mesmo `cliente_industrial_id` do produto (não deixa misturar consignado com Mischa's).
- Validação por trigger no banco reforça a regra.

## Fase 4 — Produção integrada no PCP

- **PCP** ganha seção "Ordens Private-Label" ao lado das ordens Mischa's (mesma tela, agrupamento visual).
- Nova origem de ordem: usuário abre "Nova ordem PL", escolhe cliente industrial + produto PL + quantidade. Entra na mesma fila de `historico_producao` com `cliente_industrial_id` preenchido.
- Ao concluir: usa a receita PL, baixa insumos PL (mesmos triggers de estoque atuais funcionam — só o filtro que muda). Entra produto PL no estoque via mesma mecânica.
- **Necessidade de compra de insumos**: continua ignorando insumos PL (você não compra). Sugestão de produção Mischa's ignora ordens PL.
- Capacidade de produção: ordens PL entram no mesmo cálculo de ocupação da fábrica (é o mesmo forno/mão de obra) — expor toggle "considerar ordens PL na capacidade" (default: sim).

## Fase 5 — Coleta e faturamento

- **Expedição** ganha aba "Coletas Private-Label" (separada de "Entregas"). Interface enxuta: escolhe cliente industrial → lista produtos PL em estoque → registra quantidades coletadas + nota fiscal. Gera linha em `historico_entregas` com `tipo_movimento = 'coleta_pl'`.
- Ao registrar coleta: baixa `movimentacoes_estoque_produtos` (produto PL) via trigger existente. Valor = `sum(quantidade × cliente_industrial.preco_industrializacao_unitario)`.
- Aba "Entregas" normal filtra `tipo_movimento = 'venda'` (default) — não mostra coletas.

## Fase 6 — DRE

- Nova linha "Receita de industrialização" na seção de receitas do DRE, calculada de `historico_entregas` com `tipo_movimento = 'coleta_pl'`. Separada de "Receita de venda".
- Custos: insumos PL não entram no CMV (custo = 0). Custos fixos/variáveis continuam como estão (rateio fica pra depois se o usuário pedir).
- Análise de giro, faturamento médio por PDV, indicadores de cliente: **excluem PL** (o cliente industrial não é PDV).

## Fase 7 — Limpeza e QA

- Remover `src/pages/PrivateLabel.tsx`, `InsumosPLTab.tsx`, `ProdutosPLTab.tsx` (movido pra Configurações). `usePrivateLabel.ts` fica só com `useClientesIndustriais`.
- Auditoria manual: percorrer cada tela listada na Fase 2 confirmando que o filtro `cliente_industrial_id IS NULL` está aplicado.
- Testar com um cliente industrial + 3 insumos PL + 1 produto PL + 1 ordem + 1 coleta, e conferir que nenhum dado PL vaza pras telas de Mischa's.

---

## Detalhes técnicos

**Ordem de execução:** Fase 0 → 1 → 2 (crítica, muitos hooks) → 3 → 4 → 5 → 6 → 7. Cada fase é entregável independente.

**Risco principal:** Fase 2. Se algum hook não receber o filtro, dados PL aparecem em telas Mischa's. Mitigação: mapear todos os hooks que fazem `.from('insumos')` ou `.from('produtos_finais')` via grep antes de tocar em qualquer um, aplicar o filtro em bloco, e comparar contagens antes/depois.

**Migração de dados:** nenhuma. Todas as novas colunas são nullable, insumos/produtos atuais ficam com `cliente_industrial_id = null` (= Mischa's), comportamento preservado.

**Reversão:** dropar colunas nullable é seguro se der ruim.
