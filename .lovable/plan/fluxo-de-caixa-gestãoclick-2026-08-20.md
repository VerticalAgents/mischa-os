# Fluxo de Caixa (GestãoClick)

Nova aba **Fluxo de Caixa**, logo abaixo de Inadimplência no menu, com visão completa: contas a receber e a pagar em aberto, saldo por conta bancária e projeção diária de caixa.

## O que a tela mostra

1. **KPIs no topo**
   - Saldo atual consolidado (soma das contas)
   - A receber em aberto (no horizonte)
   - A pagar em aberto (no horizonte)
   - Saldo projetado no fim do horizonte, mais o menor saldo do período (em vermelho se ficar negativo)

2. **Filtros** no topo, no padrão do PCP: horizonte de 30 / 60 / 90 dias.

3. **Gráfico de projeção diária consolidada**
   - Linha do saldo acumulado dia a dia, partindo do saldo atual.
   - Barras de entradas (verde) e saídas (vermelho) de cada dia.
   - Linha de referência no zero e destaque nos dias com saldo negativo.
   - Regra: todo título em aberto é considerado como se fosse se concretizar na data de vencimento. Títulos já vencidos e ainda em aberto entram no primeiro dia da projeção, marcados como atrasados.

4. **Tabela de saldo por conta bancária**
   - Uma linha por conta do GestãoClick (9 contas hoje): saldo inicial informado, movimento liquidado desde a data de referência e saldo atual calculado.
   - Saldo inicial e data de referência editáveis por conta, salvos no banco.

5. **Lista de lançamentos previstos**
   - Tabela agrupada por dia com descrição, cliente/fornecedor, conta bancária, valor e tipo (entrada/saída), sinalizando os atrasados.

## Saldos bancários

A API do GestãoClick lista as contas, mas **não expõe o saldo** de cada uma. Então:
- Você informa uma vez o **saldo inicial de cada conta** e a **data de referência**.
- O sistema soma os recebimentos e pagamentos **liquidados** a partir dessa data para chegar no saldo atual.
- Para reconciliar, basta reajustar o saldo inicial quando quiser.

## Detalhes técnicos

**Edge function `gestaoclick-proxy`** — novas actions, no mesmo padrão paginado de `buscar_recebimentos_abertos`:
- `listar_contas_bancarias` → `GET /contas_bancarias` (id, nome).
- `buscar_pagamentos_abertos` → `GET /pagamentos?liquidado=ab&data_inicio&data_fim` paginado; devolve id, codigo, descricao, valor_total, data_vencimento, conta_bancaria_id/nome, fornecedor/cliente, liquidado.
- `buscar_movimentos_liquidados` → `GET /recebimentos?liquidado=li` e `GET /pagamentos?liquidado=li` desde a data de referência, agregados por `conta_bancaria_id` (usa `valor_total` para refletir juros, descontos e taxas).
- `buscar_recebimentos_abertos` passa a devolver também `conta_bancaria_id`/`nome_conta_bancaria` e `valor_total`.

**Banco** (migration): tabela `saldos_contas_bancarias` com `id`, `user_id`, `conta_bancaria_id text`, `nome_conta text`, `saldo_inicial numeric`, `data_referencia date`, timestamps, única por (`user_id`, `conta_bancaria_id`), com GRANTs para `authenticated`/`service_role` e RLS por `get_owner_id(auth.uid())`, no padrão multi-tenant do projeto.

**Frontend**:
- `src/hooks/useFluxoCaixa.ts`: react-query juntando contas, saldos salvos, movimentos liquidados e títulos abertos (receber + pagar); monta a série diária, o saldo por conta e os KPIs, com o horizonte como parâmetro.
- `src/hooks/useSaldosContasBancarias.ts`: leitura e upsert dos saldos iniciais.
- `src/components/gestao-financeira/FluxoCaixaPanel.tsx` com subcomponentes (`FluxoCaixaChart`, `SaldosContasTable`, `LancamentosPrevistosTable`), usando recharts e tokens HSL do design system.
- `src/pages/gestao-financeira/FluxoCaixa.tsx`, rota `/gestao-financeira/fluxo-caixa` em `App.tsx` (lazy), item no menu Operacional abaixo de Inadimplência em `navigation-items.tsx` e nova aba em `GestaoFinanceira.tsx`.
- Acesso restrito a admin/staff, sem entrada no portal do representante.