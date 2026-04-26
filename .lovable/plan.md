Identifiquei a causa real do erro: não é mais um erro genérico de RLS aparecendo diretamente. O console mostra `PGRST116: The result contains 0 rows`, que acontece porque o código salva com `.select().single()` e espera receber a linha salva de volta. Para o representante, a operação acaba retornando 0 linhas, então o front interpreta como falha.

Além disso, confirmei no banco que as políticas de `INSERT/UPDATE/DELETE` para representantes em `agendamentos_clientes` ainda não aparecem aplicadas; só existe a política de leitura. Também há clientes com representante sem registro de agendamento, então o fluxo de criação precisa estar 100% liberado.

Plano de correção:

1. Corrigir RLS de `agendamentos_clientes`
   - Criar/aplicar políticas explícitas para representantes criarem e atualizarem agendamentos apenas dos próprios clientes.
   - Não liberar edição de clientes de outros representantes.
   - Não liberar acesso amplo a histórico ou dados administrativos.
   - Manter admin/owner/staff como já está.
   - Avaliar se `DELETE` deve ficar bloqueado para representante; para o fluxo atual de salvar agendamento, só precisamos de `INSERT` e `UPDATE`.

2. Tornar o salvamento mais resiliente no frontend
   - Em `src/hooks/agendamento/actions.ts`, trocar os pontos frágeis com `.single()` no salvar por uma abordagem que não falhe quando o PostgREST não retornar linha após `insert/update`.
   - Para `UPDATE`, preferir filtrar por `cliente_id`, executar a mutação e depois recarregar o agendamento com `carregarAgendamentoPorCliente` ou usar `.maybeSingle()` quando fizer sentido.
   - Para `INSERT`, idem: salvar e depois buscar o registro criado, evitando que o erro `PGRST116` apareça como falha quando o banco não retornou linha.

3. Melhorar diagnóstico para erros futuros
   - Ajustar o tratamento de erro para mostrar uma mensagem mais específica quando vier erro do Supabase, ao invés de sempre “Erro ao salvar agendamento”.
   - Manter logs técnicos no console para facilitar depuração, mas sem expor detalhes sensíveis ao usuário final.

4. Validar o fluxo afetado
   - Testar leitura de agendamento existente.
   - Testar criação de agendamento para cliente do representante sem agendamento ainda.
   - Testar atualização de agendamento existente para cliente do próprio representante.
   - Confirmar que representante continua sem poder editar histórico de entregas.

Detalhe técnico principal:

```text
Erro atual:
frontend -> insert/update agendamentos_clientes -> .select().single()
PostgREST retorna 0 linhas -> PGRST116 -> toast genérico

Correção:
frontend -> insert/update com política RLS correta
frontend -> não depender de .single() na mutação
frontend -> recarregar registro salvo de forma segura
```