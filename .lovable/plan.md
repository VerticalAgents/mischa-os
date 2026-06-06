# Adicionar Bonificações (espelhando Trocas)

Estrutura paralela ao sistema de trocas, mas para registrar brindes/cortesias. Destaque visual verde, sem integração com GestãoClick (apenas interno).

## 1. Banco de dados (1 migration)

**Novas tabelas:**
- `motivos_bonificacao` (id serial, nome, ativo, created_at) — espelha `motivos_troca`. Seed inicial: "Cortesia", "Degustação", "Campanha".
- `bonificacoes` (id, cliente_id, historico_entrega_id, produto_id, produto_nome, quantidade, motivo_id, motivo_nome, data_bonificacao, created_at) — espelha `trocas`.

**Coluna nova:**
- `agendamentos_clientes.bonificacoes_pendentes jsonb DEFAULT '[]'::jsonb`.

**RLS/GRANTS:** mesmo padrão das tabelas equivalentes de trocas.

**Função:** atualizar `process_entrega_safe` para também ler `bonificacoes_pendentes`, inserir em `bonificacoes` (com historico_entrega_id), concatenar resumo na observação ("Bonificações: ...") e limpar o campo no fim (igual trocas).

## 2. Frontend

**Novos arquivos:**
- `src/hooks/useMotivosBonificacao.ts` — espelha `useMotivosTroca`.
- `src/components/agendamento/BonificacoesPendentesEditor.tsx` — espelha `TrocasPendentesEditor`.
- `src/components/agendamento/BonificacoesAccordion.tsx` — espelha `TrocasAccordion`, mas usando paleta verde (`text-green-600`, `border-green-500/50`, `bg-green-500/5`) e ícone `Gift`. Trava aberto quando há itens.

**Edições:**
- `AgendamentoEditModal.tsx` — adicionar state `bonificacoesPendentes`, carregar do banco, salvar, e renderizar `<BonificacoesAccordion />` logo abaixo do `<TrocasAccordion />` (antes das Observações).
- `expedicao/hooks/usePedidoConverter.ts` — propagar `bonificacoes_pendentes` no objeto convertido.
- `expedicao/PedidoCard.tsx` — badge "X bonif." verde quando houver itens (igual badge de trocas).
- `expedicao/ProdutosList.tsx` — nova seção "Bonificações" no accordion com ícone Gift e estilo verde, listando produto/motivo/quantidade.

**Configurações:** adicionar tela de gerenciamento de `motivos_bonificacao` espelhando a de motivos de troca, se já houver uma página correspondente.

## 3. Detalhes técnicos

- Tipo `BonificacaoPendente`: `{ produto_id, produto_nome, quantidade, motivo_id?, motivo_nome? }`.
- Cores via classes Tailwind do design system existente (verde). Sem integração com Gestão Click (não vai pra venda).
- Após confirmação da entrega, bonificações ficam permanentemente registradas em `public.bonificacoes` para histórico/relatórios futuros.