# Renomear "Agendar" para "Pendente" e simplificar modal

## Objetivo
1. Renomear o rótulo visível "Agendar" para "Pendente" em toda a interface (admin e representante).
2. Quando o status estiver marcado como "Pendente", ocultar os campos que não fazem sentido: Tipo de Pedido, Data de Reposição, Quantidade Total e a seção de Produtos.

## Estratégia de implementação

**Manter o valor interno `"Agendar"` no banco de dados.** Apenas o texto exibido ao usuário muda para "Pendente". Isso evita:
- Migração de dados em `agendamentos_clientes.status_agendamento` (centenas de registros)
- Quebrar RLS, triggers, edge functions e queries que filtram por `'Agendar'`
- Impacto em integrações (GestaoClick, sincronização, dashboards de probabilidade)

A mudança é puramente cosmética/UX.

## Mudanças

### 1. Modal de edição do admin — `src/components/agendamento/AgendamentoEditModal.tsx`
- Trocar o label do `SelectItem value="Agendar"` de "Agendar" para "Pendente".
- Quando `statusAgendamento === "Agendar"`:
  - Ocultar o bloco de "Tipo do Pedido"
  - Ocultar o bloco de "Data de Reposição"
  - Ocultar o bloco de "Quantidade Total"
  - Ocultar a seção de produtos (`ProdutoQuantidadeSelector`)
  - Ocultar a seção de observações/trocas (opcional — manter se útil)
- Ao salvar com status "Agendar", garantir que `dataReposicao` seja enviada como `null` e `quantidadeTotal` mantenha o valor existente (sem alterar).

### 2. Modal/card do representante — `src/components/clientes/AgendamentoAtual.tsx`
- Trocar o label do RadioGroupItem `value="Agendar"` de "Agendar" para "Pendente".
- Atualizar mensagens auxiliares ("será limpa automaticamente", "Para status Agendar a data será automaticamente limpa") para usar "Pendente".
- Quando `statusAgendamento === "Agendar"`:
  - Ocultar o bloco de "Tipo do Pedido"
  - Ocultar o bloco de "Data de Reposição"
  - Ocultar o bloco de "Quantidade Total"
  - Ocultar a seção de produtos personalizados (`tipoPedido === "Alterado"`)

### 3. Outros pontos de exibição do rótulo "Agendar"
Atualizar **apenas o texto exibido** (mantendo valor interno):
- `src/pages/rep/RepAgendamentos.tsx` linha 33 — `{ value: "Agendar", label: "Pendente" }`
- `src/components/clientes/ClientesTable.tsx` linha 80 — mapa de labels: `'Agendar': 'Pendente'`
- `src/pages/rep/RepHome.tsx` — se houver label visível no case "Agendar"
- `src/components/clientes/ClienteFormDialog.tsx` linha 541 — texto explicativo: trocar para "Pendente"

### 4. Não alterar
- Tipos TypeScript (`'Agendar' | 'Previsto' | 'Agendado'`) — permanecem iguais
- Banco de dados, RLS, triggers, edge functions
- Lógica de filtros (`statusAgendamento === "Agendar"`) em dashboards, positivação, sem-data, etc.
- `useStatusAgendamentoStore` — manter `nome: 'Agendar'` (ou apenas o display name se houver campo separado — a verificar)

## Resultado para o usuário
- O rótulo "Agendar" aparece como "Pendente" em todos os menus, tabelas e badges.
- Ao marcar um agendamento como "Pendente" no modal de edição (admin ou rep), só o seletor de status fica visível — os outros campos somem, deixando claro que o agendamento está aguardando definição.
- Comportamento de filtros, dashboards, integrações e dados existentes permanece inalterado.
