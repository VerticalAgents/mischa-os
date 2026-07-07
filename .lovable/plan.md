# Plano revisado: Private-Label como atributo do cliente

Abandona a tabela `clientes_industriais` e trata industrialização como um tipo de cliente dentro do cadastro que já existe. Zero fluxo novo, zero aba paralela.

---

## Fase 1-R — Refatorar cadastro de cliente (substitui Fase 1 anterior)

### 1.1 Schema

Migração única:

1. `ALTER TABLE public.clientes ADD COLUMN tipo_cliente text NOT NULL DEFAULT 'PDV' CHECK (tipo_cliente IN ('PDV','INDUSTRIAL','AMBOS'))`.
2. `ALTER TABLE public.clientes ADD COLUMN preco_industrializacao_unitario numeric(10,2)` (nullable; obrigatório via validação de UI/trigger só quando `tipo_cliente` in `('INDUSTRIAL','AMBOS')`).
3. Migrar o único registro existente (`Odara Alfajores`, CNPJ `21.487.894/0001-66`, preço `1.00`):
   - Se já existir um cliente com o mesmo CNPJ em `public.clientes`, faz `UPDATE` setando `tipo_cliente='AMBOS'` e `preco_industrializacao_unitario=1.00`.
   - Se não existir, `INSERT` novo cliente com `tipo_cliente='INDUSTRIAL'`, copiando nome/cnpj/contato/endereço/observações e mantendo o mesmo `id` (uuid) do registro atual em `clientes_industriais`, pra preservar as FKs.
4. Renomear coluna em cascata: `insumos.cliente_industrial_id` → `insumos.cliente_id`; `produtos_finais.cliente_industrial_id` → `produtos_finais.cliente_id`; idem `historico_producao` e `historico_entregas`. Trocar as FKs pra apontar `public.clientes(id) ON DELETE RESTRICT`. Como o `id` foi preservado no passo 3, os dados existentes (nenhum insumo/produto ainda vinculado, só a estrutura) não quebram.
5. Atualizar trigger `validate_itens_receita_cliente_industrial` pra ler `cliente_id` em vez de `cliente_industrial_id` e validar contra `clientes` filtrando `tipo_cliente IN ('INDUSTRIAL','AMBOS')`.
6. `DROP TABLE public.clientes_industriais CASCADE` (só depois dos renames concluírem).
7. Índices parciais recriados em `cliente_id WHERE cliente_id IS NOT NULL`.

RLS: `clientes` já tem policies por owner_id, herda tudo. Nada a mexer.

### 1.2 Cadastro de cliente (UI)

No formulário de cliente (`src/components/clientes/...`):

- Novo campo select **"Tipo de cliente"**: `PDV` (default) / `Industrial` / `Ambos`.
- Quando `Industrial` ou `Ambos`, revelar seção "Dados de industrialização":
  - Input `Preço por unidade industrializada (R$)` — obrigatório.
- Quando `PDV`, os campos comerciais existentes (representante, rota, categoria, forma pagamento, giro, etc.) permanecem como estão.
- Quando `Industrial` puro, esconder/desmarcar `contabilizarGiroMedio`, `emiteNotaFiscal` fica opcional, campos de rota/representante viram opcionais.
- Quando `Ambos`, tudo aparece.

Zod: estender `ClienteDTO` com `tipoCliente` e `precoIndustrializacaoUnitario` (obrigatório condicional via `superRefine`).

### 1.3 Listagem de clientes

- Adicionar filtro **Tipo** no topo da lista de clientes (`Todos` / `PDV` / `Industrial` / `Ambos`), default `Todos` na tela de clientes.
- Badge visual na linha indicando "Industrial" quando aplicável.

### 1.4 Blindagem das telas Mischa's (crítico — evita vazamento)

Todas as telas atuais que listam clientes pra fluxo de venda/entrega/giro devem filtrar `tipo_cliente IN ('PDV','AMBOS')`. Auditar:

- `useClienteStore`, `useSupabaseClientes` (se existir), `useAgendamentoClienteStore`
- Hooks de agendamento, expedição, giro, DRE, faturamento médio por PDV, projeções
- Telas de gestão comercial (representantes, funil, análise de giro)

Clientes puramente industriais **não** aparecem em: agendamento, expedição de vendas, giro médio por PDV, indicadores de PDV, faturamento por representante.

### 1.5 Configurações

- Remover a sub-aba "Clientes Industriais" de Configurações (não é mais uma entidade separada).
- Deletar `src/components/configuracoes/tabs/ClientesIndustriaisTab.tsx` e `src/components/private-label/ClientesIndustriaisTab.tsx`.
- Deletar `src/hooks/usePrivateLabel.ts` inteiro.

### 1.6 Fases 2-7 seguintes (ajuste)

Todo o resto do plano original (contexto de estoque, PCP, coletas, DRE) continua igual, só trocando toda referência a `cliente_industrial_id` por `cliente_id` e "cliente industrial" por "cliente com `tipo_cliente IN ('INDUSTRIAL','AMBOS')`". Filtros de Mischa's viram `cliente_id IS NULL` (insumo/produto próprio) — nada muda.

---

## Detalhes técnicos

**Ordem:** migração schema+dados → refactor de tipos/hooks (`cliente_industrial_id` → `cliente_id`) → UI do cadastro → filtro de listagem → blindagem das telas → remoção de arquivos PL antigos.

**Risco:** o rename das colunas `cliente_industrial_id` invalida tudo que já foi escrito referenciando esse nome. Como só a Fase 0 criou essas colunas e nada de UI usa ainda, o blast radius é pequeno — mas o `types.ts` do Supabase precisa regerar antes do refactor de código.

**Dado a migrar:** 1 registro (`Odara Alfajores`). Verificado no banco.

**Reversível:** dropar `tipo_cliente` e `preco_industrializacao_unitario` de `clientes` e recriar `clientes_industriais` a partir dos clientes com `tipo_cliente <> 'PDV'`.
