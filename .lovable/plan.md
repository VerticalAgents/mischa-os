## Diagnóstico

O banco está correto: os 20 insumos da Odara têm `estoque_atual` preenchido e também possuem movimentações iniciais. A função `saldo_insumo(id)` retorna valores corretos quando consultada no banco.

A causa mais provável da tela continuar zerada é no frontend: a aba de insumos só usa o saldo vindo do RPC (`saldos[insumo.id] || 0`). Se o RPC falhar, demorar, não executar por sessão/permissão, ou retornar um valor falsy durante o carregamento, a UI força `0` e ignora o `estoque_atual` já correto do próprio registro do insumo.

## Plano de correção

1. **Ajustar a aba Estoque → Insumos**
   - Inicializar os saldos da tabela usando `insumo.estoque_atual` imediatamente.
   - Manter o RPC `saldo_insumo` como fonte preferencial quando ele retornar valor válido.
   - Se o RPC retornar `0`/falhar enquanto o `estoque_atual` tiver saldo, usar `estoque_atual` como fallback.

2. **Corrigir todos os pontos que usam saldo na aba**
   - Coluna “Saldo Atual”.
   - Badge de status (“Normal”, “Sem estoque”, etc.).
   - Cards de resumo (“Valor total em estoque”, “Estoque baixo”).
   - Botão de baixa e saldo passado para o modal.

3. **Preservar a lógica existente de movimentações**
   - Não alterar o banco novamente.
   - Não mexer nas quantidades já cadastradas.
   - As próximas entradas/saídas seguem registrando movimentações normalmente.

4. **Validação**
   - Conferir que, para os insumos consignados da Odara, a tela passa a exibir os saldos já confirmados no banco: Açúcar 66, Farinha 88, Choco em Pó 30, etc.