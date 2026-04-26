## Objetivo

Criar uma experiência dedicada para representantes comerciais em rotas `/rep/*`, com layout próprio e telas simplificadas focadas no fluxo deles (cadastro de clientes vinculados e gestão de status/data dos próprios agendamentos). Hoje o rep cai no `/home` do dono e vê KPIs do negócio inteiro — não faz sentido.

A segurança (RLS, RPC restrito de update, edge function de criação de credenciais) já está pronta da fase anterior. Este plano é puramente de UI/roteamento.

---

## Estrutura de rotas

```text
/rep                       → redirect para /rep/home
/rep/home                  → dashboard do representante
/rep/clientes              → lista + cadastro/edição de clientes dele
/rep/agendamentos          → lista de agendamentos com edição limitada (status + data)
```

Tudo dentro de um novo `RepLayout` com sidebar enxuta (3 itens) e header próprio. Sem acesso a outras rotas — qualquer tentativa redireciona para `/rep/home`.

---

## Comportamento por tela

### 1. Login e redirecionamento
- Após login, se `userRole === 'representante'` → redirecionar para `/rep/home` (em vez de `/home`).
- Guard global: se usuário é representante e tenta acessar qualquer rota fora de `/rep/*`, redireciona para `/rep/home`.
- Inversamente, se um admin/staff acessa `/rep/*`, redireciona para `/home`.

### 2. `/rep/home` — Dashboard do representante
Quatro blocos:
- **Saudação + total de PDVs ativos**: "Olá, {nome}" + card com contagem de clientes ativos vinculados a ele.
- **Próximos agendamentos (7 dias)**: lista enxuta dos próximos pedidos previstos dos clientes dele (data, cliente, status). Clicar abre o modal de edição.
- **Pendentes de confirmação**: agendamentos com status `Previsto` ou `Agendar` que precisam de ação. Mesmo padrão de clique.
- **Atalhos rápidos**: 3 botões grandes — "Cadastrar cliente", "Ver clientes", "Ver agendamentos".

### 3. `/rep/clientes` — Lista simplificada
- Tabela com colunas essenciais: Nome, Status, Categoria, Telefone, Próxima reposição, Ações (editar).
- Botão destacado "Novo cliente" no topo.
- Busca por nome/CNPJ.
- Filtro por status (Ativo, Standby, A ativar, Inativo).
- Reusa o `ClienteFormDialog` existente (já trava o campo Representante automaticamente para usuários rep — feito na fase anterior).

### 4. `/rep/agendamentos` — Lista simplificada
- Lista (não calendário, mais simples) agrupada por data, com filtro de período (Hoje / 7 dias / 30 dias / Todos).
- Cada linha: data, cliente, quantidade, status. Clique abre o modal de edição.
- Modal de edição reusa o `AgendamentoEditModal` existente, que já está restrito para reps via RPC `representante_update_agendamento` (só edita status e data).
- Filtro por cliente e por status.

---

## Arquivos a criar/editar

### Novos
- `src/layouts/RepLayout.tsx` — shell com sidebar enxuta (3 itens) + header com nome do rep e logout.
- `src/components/rep/RepSidebar.tsx` — sidebar dedicada.
- `src/pages/rep/RepHome.tsx` — dashboard do rep.
- `src/pages/rep/RepClientes.tsx` — lista de clientes simplificada.
- `src/pages/rep/RepAgendamentos.tsx` — lista de agendamentos simplificada.
- `src/components/rep/RepGuard.tsx` — bloqueia acesso a `/rep/*` para não-reps.
- `src/hooks/useRepDashboardData.ts` — busca dados agregados para a Home (total de clientes, próximos agendamentos, pendentes).

### Editar
- `src/App.tsx` — registrar as novas rotas `/rep/*` envolvidas pelo `RepLayout` + `RepGuard`.
- `src/contexts/AuthContext.tsx` (ou onde acontece o redirecionamento pós-login) — redirecionar reps para `/rep/home`.
- Guard global existente (provavelmente em `App.tsx` ou em `MainLayout`) — se `isRepresentante`, redirecionar qualquer rota não-`/rep/*` para `/rep/home`.

---

## Detalhes técnicos

- **Filtros de dados**: como o RLS já filtra por `get_my_representante_id()`, as queries no front são as mesmas usadas hoje (`from('clientes').select(...)` e `from('agendamentos_clientes').select(...)`) — o Postgres devolve só o que o rep pode ver. Sem necessidade de filtros adicionais no client.
- **Edição de agendamento**: o `AgendamentoEditModal` já detecta `isRepresentante` e roteia o save pela RPC `representante_update_agendamento`. Reusamos sem mudanças.
- **Cadastro de cliente**: `ClienteFormDialog` já auto-preenche e trava `representante_id` quando o usuário é rep. Reusamos sem mudanças.
- **Sidebar do dono**: a lógica atual em `useMyPermissions` para representante (`/home`, `/clientes`, `/agendamento`) deixa de ser usada na prática, mas pode ficar como fallback. O guard novo garante que o rep nunca renderiza `MainLayout`.
- **Estilo**: mantém a identidade Mischa (vermelho #d1193a no header/sidebar) seguindo `mem://brand/identity-and-ui-standards`.

---

## Fora de escopo (fase 2, conforme combinado)
- Funil de leads para o rep.
- Indicadores de performance (meta vs realizado, conversão).
- Visão financeira detalhada.
