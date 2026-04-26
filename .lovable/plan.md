## Objetivo

Reorganizar a página `/rep/agendamentos` (representante) em duas abas:

1. **Dashboard** (aba principal/padrão) — igual ao Dashboard de Agendamento do admin, mas naturalmente restrito aos clientes do representante via RLS.
2. **Lista** — a tabela atual de agendamentos, com a busca expandida para também encontrar por **CNPJ/CPF** e razão social (nome).

## Mudanças

### 1. `src/pages/rep/RepAgendamentos.tsx` (refator)

- Envolver o conteúdo num `<Tabs>` com duas abas: `dashboard` (padrão) e `lista`.
- Usar o padrão responsivo de abas do projeto (grid 2 colunas no mobile, `TabsList` horizontal no desktop), igual ao usado em `src/pages/Agendamento.tsx`.
- Mover toda a lista/tabela atual para o `TabsContent value="lista"`.
- Renderizar `<AgendamentoDashboard />` dentro de `TabsContent value="dashboard"`, envolto em `<EditPermissionProvider value={{ canEdit: true }}>` (representante pode editar seus próprios agendamentos via RLS).
- Manter o auto-abrir-modal pelo `?id=` apenas na aba lista (mudar para `dashboard` se preferir, mas mantemos na lista pois é onde a tabela está).
- Atualizar a busca: filtrar por `cliente.nome` **e** `cliente.cnpjCpf` (normalizando — removendo `.`, `-`, `/`), seguindo o padrão já usado em `AgendamentoDashboard.tsx` (linhas 197–200) e na memória `busca-cnpj-normalizada`.
- Atualizar o placeholder do input para "Buscar por nome, CNPJ ou CPF…".

### 2. Reuso do Dashboard

`AgendamentoDashboard` usa `useAgendamentoClienteStore` e `useClienteStore`. O RLS do Supabase (políticas `Representante reads own agendamentos` / `Representante reads own clientes`) garante que o representante vê **apenas** seus próprios dados — nenhuma alteração de query é necessária.

O Dashboard mostra filtros internos de Representante e Rota; para o representante isso fica redundante mas inofensivo (a lista de representantes filtráveis é apenas dele mesmo, dado que `useSupabaseRepresentantes` retorna o que o RLS permite). Se quiser ocultar esses filtros para o rep, posso fazê-lo num passo seguinte.

## Detalhes técnicos

- Persistência da aba ativa: usar `useTabPersistence("dashboard")` (mesmo hook usado em `/agendamento`) com chave própria (`rep-agendamentos`) para não conflitar.
- Não há mudanças de banco de dados nem novas dependências.

## Arquivos alterados

- `src/pages/rep/RepAgendamentos.tsx` — refator para tabs + busca por CNPJ.

Nenhum outro arquivo precisa ser modificado.