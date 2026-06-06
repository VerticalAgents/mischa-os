## Objetivo

Refinar a área de **Observações e Trocas** do modal de agendamento:

1. Tornar a seção **colapsável** (oculta por padrão) ao final do modal.
2. Garantir que `observacoes_agendamento` seja **limpa** após confirmação da entrega.
3. Corrigir UX/persistência das **trocas pendentes** (hoje, se o usuário não clicar no "+", a seleção é perdida ao salvar).
4. Registrar as trocas pendentes no histórico (`trocas`) ao confirmar a entrega, conforme o aviso já diz.

## Mudanças

### 1. UI — `AgendamentoEditModal.tsx` + `ObservacoesAgendamentoSection.tsx`
- Envolver `<ObservacoesAgendamentoSection>` em um `<Collapsible>` (componente shadcn já existente) no final do modal:
  - Trigger: botão discreto com chevron — "Observações e Trocas" (mostra badge "•" se houver conteúdo: obs. gerais, obs. agendamento ou trocas).
  - Collapsed por padrão.
- Manter o conteúdo interno como está.

### 2. UX — `TrocasPendentesEditor.tsx`
- Expor um helper `commitPendingTroca()` (via `useImperativeHandle` com `forwardRef`, ou via `onChange` automático sempre que `novaTroca` ficar completo) para que a troca em edição (produto + motivo + qtd preenchidos) seja automaticamente persistida em `value` antes do save.
- Abordagem mais simples e robusta: **adicionar automaticamente** a troca à lista assim que `produto_id` e `motivo_id` estiverem preenchidos (efeito ao mudar qualquer um dos três), limpando o form interno. Assim o "+" deixa de existir/é redundante. Mantém botão remover por linha.

### 3. Backend — migração que atualiza `process_entrega_safe`
Atualizar a versão com 3 parâmetros (`p_agendamento_id, p_observacao, p_data_entrega`) para:
- Antes de zerar, ler `observacoes_agendamento` e `trocas_pendentes` do agendamento.
- Após o `INSERT` em `historico_entregas` (já temos `v_historico_id`), inserir cada item de `trocas_pendentes` em `public.trocas` com `cliente_id`, `historico_entrega_id = v_historico_id`, `produto_id`, `produto_nome`, `quantidade`, `motivo_id`, `motivo_nome`, `data_troca = v_data_entrega_efetiva`.
- Concatenar `observacoes_agendamento` na `observacao` do `historico_entregas` (se houver), para não perder a informação.
- No `UPDATE` final do agendamento (ambos os ramos: com e sem reagendamento), também **setar** `observacoes_agendamento = NULL` e `trocas_pendentes = '[]'::jsonb`.

Não há mudança de schema nem RLS — apenas substituição da função.

### Detalhes técnicos
- Manter a versão de 2 parâmetros existente intacta (compat).
- A lista de trocas que vem no `historico_entregas.observacao` continua sem mudar; trocas vão para a tabela própria.
- Frontend não precisa mais mexer em zerar campos após entrega — fica tudo no RPC.
