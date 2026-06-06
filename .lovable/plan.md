## Refatorar editor de trocas pendentes

### Problema
Hoje `TrocasPendentesEditor` só persiste uma troca quando **produto + quantidade + motivo** estão preenchidos (auto-commit). Se o usuário escolhe produto e quantidade mas esquece o motivo, ao salvar o agendamento a troca desaparece — não é registrada em `trocas_pendentes`.

### Solução
Reescrever o editor no mesmo padrão do `ProdutoQuantidadeSelector` (lista de linhas editáveis + botão "Adicionar Troca"):

1. **Lista de trocas como linhas editáveis**
   - Cada item em `value` vira uma linha com 3 campos: Produto (Select), Quantidade (Input number, w-24), Motivo (Select, opcional) + botão lixeira (icon).
   - Qualquer alteração em qualquer campo dispara `onChange` imediatamente — não há "estado temporário" que possa se perder.
   - Layout flex (igual `ProdutoQuantidadeSelector`): produto `flex-1`, quantidade `w-24`, motivo `w-56`, lixeira `size="icon"`.

2. **Botão "Adicionar Troca"**
   - Adiciona uma linha vazia `{ produto_nome: "", quantidade: 1, motivo_nome: "" }`.
   - Substitui o auto-commit + linha de "nova troca" + tabela read-only atuais.

3. **Motivo opcional**
   - A linha é salva mesmo sem motivo. A função `process_entrega_safe` já trata `motivo_id` ausente via `NULLIF(...)::int`, então o INSERT em `public.trocas` aceita NULL e o histórico continua funcional.

4. **Comportamento pós-entrega (já implementado, apenas confirmar)**
   - O migration anterior já zera `trocas_pendentes = '[]'` em ambos os ramos do UPDATE em `process_entrega_safe`.
   - O mesmo trecho já insere cada item de `trocas_pendentes` em `public.trocas` com `historico_entrega_id` apontando para a entrega recém-criada — então a aba **Controle de Trocas** (`TrocasHistoricoTable` que lê de `trocas`) já passa a mostrar essas trocas automaticamente.
   - Também registra a troca dentro da `observacao` do `historico_entregas` via concatenação? Hoje só concatena `observacoes_agendamento`. Vou **estender** essa concatenação para incluir um resumo `"Trocas: 2x Brownie Avelã (Quebrado), 1x Brownie Chocolate"` no campo `observacao` do `historico_entregas`, para que o usuário veja no histórico de entregas sem precisar abrir a aba de trocas.

### Arquivos afetados
- `src/components/agendamento/TrocasPendentesEditor.tsx` — reescrita do componente.
- **Nova migration** atualizando `process_entrega_safe` para anexar resumo das trocas em `historico_entregas.observacao` (mantém todo o resto da função intacto).

### Detalhes técnicos
- Componente continua exportando `TrocaPendente` com a mesma shape `{ produto_id?, produto_nome, quantidade, motivo_id?, motivo_nome }`, então `AgendamentoEditModal` não precisa mudar.
- Sem alterações em RLS, schema ou outras tabelas.