## Objetivo

Adicionar um botão "Agendar todas" no card **Sugestão de Produção** que abre um modal de ação em massa, permitindo agendar várias sugestões de uma vez (criando registros de produção com status "Pendente"), seguindo o mesmo padrão do `useAcaoEmMassaDialog` usado em reagendamentos.

## Comportamento

1. **Botão "Agendar em massa"** no header do card `SugestaoProducao` (ao lado do toggle "Apenas com proporção"):
   - Aparece apenas quando há ao menos uma sugestão com `tem_rendimento` e `formas_sugeridas > 0`.
   - Mostra um badge com o total elegível.

2. **Modal `AgendarSugestoesEmMassaDialog`**:
   - Lista todas as sugestões elegíveis (com rendimento + quantidade > 0).
   - Cada linha tem: checkbox, nome do produto, formas sugeridas (editável), unidades equivalentes (calculado), status (estoque atual → alvo).
   - Cabeçalho com checkbox "selecionar todos" + contador.
   - Campo único: **Data da Produção** (date picker, default = hoje), aplicado a todos os itens selecionados.
   - Campo **Turno** (select) com default "Matutino".
   - Campo **Observações** opcional, aplicado a todos.
   - Itens sem rendimento ficam em uma seção separada "Não disponíveis para agendamento" (somente leitura).
   - Botões: "Cancelar" e "Agendar X produções".

3. **Ação ao confirmar**:
   - Para cada item selecionado, chama `adicionarRegistro` com:
     - `data_producao`, `produto_id`, `produto_nome`
     - `formas_producidas` = quantidade ajustada pelo usuário
     - `rendimento_usado` = rendimento atual
     - `unidades_calculadas`/`unidades_previstas` = `floor(formas × rendimento)`
     - `turno`, `observacoes`, `origem: 'Sugestao'`, `status: 'Registrado'`.
   - Executa em sequência com tratamento de erro por item.
   - Ao final exibe toast com sucesso/falhas e chama `recarregarProducaoAgendada` para atualizar o card "Produção Agendada".
   - Fecha o modal.

## Arquivos

**Criar**
- `src/components/pcp/AgendarSugestoesEmMassaDialog.tsx` — novo modal de ação em massa, baseado no padrão `useAcaoEmMassaDialog`.

**Modificar**
- `src/components/pcp/SugestaoProducao.tsx`:
  - Aceitar nova prop opcional `onAgendarEmMassa?: (itens) => void` OU integrar o dialog internamente recebendo apenas o callback de refresh.
  - Adicionar botão "Agendar em massa" no header com ícone `CalendarPlus`.
  - Renderizar `AgendarSugestoesEmMassaDialog` controlado por estado local.
- `src/components/pcp/ProjecaoProducaoTab.tsx`:
  - Passar callback `onSuccess`/`recarregarProducaoAgendada` para `SugestaoProducao` (via prop), permitindo refresh dos cards relacionados após agendamento em lote.

## Detalhes técnicos

- Reutilizar `useAcaoEmMassaDialog` com tipo `{ id: produto_id, ... }` e `isItemEligible: s => s.tem_rendimento && s.formas_sugeridas > 0`.
- Para edição de quantidade por linha, manter um `Map<produto_id, formasAjustadas>` controlado, inicializado com `formas_sugeridas`.
- Validações: data obrigatória, ao menos 1 item selecionado, formas > 0 por item.
- Estilo do dialog seguindo o padrão existente (`Dialog`, `Calendar` em popover com `z-[100]`, mesmo do `HistoricoProducaoModal`).
- Toast final: `"X produções agendadas com sucesso"` (e quantos falharam, se houver).

## Fora de escopo

- Edição em massa de turno/observação por linha (será sempre o valor único do form).
- Persistência da seleção entre aberturas.
- Integração com PlanejamentoProducaoStore (continua usando `historico_producao`).
