## Problema

A página de Expedição (Separação e Despacho) está lenta porque:

1. **Recarregamento completo a cada troca de aba**: `Expedicao.tsx` chama `recarregarDados()` (full reload) toda vez que o usuário troca de aba ou sub-aba.
2. **Recarregamento ao voltar para a aba do navegador**: `useExpedicaoSync` dispara reload no evento `visibilitychange`.
3. **Recarregamento após cada edição**: `SeparacaoPedidos` e o `useAgendamentoActions` chamam `carregarPedidos()` depois de cada salvamento, mesmo quando o store já fez atualização otimista.
4. **Razões sociais bloqueando o load**: `carregarPedidos`/`recarregarSilencioso` chamam a edge function `gestaoclick-proxy` (`buscar_razoes_sociais_lote`) sincronamente. Essa é a chamada mais lenta e bloqueia a renderização dos pedidos.
5. **Mount duplo**: `Despacho` e `SeparacaoPedidos` também chamam `carregarPedidos()` no próprio `useEffect` de mount, redundante com o sync do page.

A aba "Agendamentos" é rápida porque faz **uma única query** com join (`agendamentos_clientes` + `clientes`), sem edge function, e mantém um Map em memória.

## Solução

Aplicar o mesmo padrão da página de Agendamentos: uma carga inicial rápida + atualizações otimistas, sem reloads em troca de aba.

### 1. `src/pages/Expedicao.tsx`
- Remover as chamadas `recarregarDados()` em `handleTabChange` e `handleEntregasTabChange`. Dados ficam em memória; trocar de aba é instantâneo.

### 2. `src/hooks/useExpedicaoSync.ts`
- Remover o listener de `visibilitychange` que recarrega tudo ao voltar para a aba.
- Manter apenas a carga inicial única.

### 3. `src/hooks/useExpedicaoStore.ts` — acelerar `carregarPedidos`
- Fazer a query principal com **join embutido** (`agendamentos_clientes` com `clientes(...)` em uma única chamada) em vez de duas queries separadas.
- **Renderizar os pedidos imediatamente** sem esperar pelas razões sociais.
- Mover a busca de `razoes_sociais` para um passo assíncrono em background: depois que `pedidos` for setado, disparar fetch da edge function e fazer `set()` apenas atualizando `cliente_razao_social` quando chegar.
- Adicionar um cache simples por sessão para `razoesSociaisMap` (evitar refetch se já carregado).

### 4. Remover reloads redundantes após edições
- `src/components/expedicao/SeparacaoPedidos.tsx`: tirar os `await carregarPedidos()` após confirmar/desfazer separação e após edição (linhas 81, 89, 168, 178, 233). O store já atualiza otimisticamente. Manter apenas o load inicial.
- `src/components/expedicao/Despacho.tsx`: tirar os `carregarPedidos()` e `recarregarSilencioso()` após ações pontuais (linhas 109/116/124/228/249/269/313). Substituir por confiança nos updates otimistas do store. Manter apenas a carga inicial se necessário (idealmente remover, pois o page já dispara via `useExpedicaoSync`).
- `src/components/expedicao/hooks/useAgendamentoActions.ts`: substituir `carregarPedidos()` por atualização local no store quando aplicável; manter reload apenas se a ação afetar múltiplos campos não cobertos pela atualização otimista.

### 5. Manter
- O comportamento de update otimista que já existe em `confirmarSeparacao`, `confirmarDespacho`, etc.
- O botão manual "Atualizar" no `ResumoExpedicao` (única forma explícita de refresh full).

## Resultado esperado

- Primeira carga: ~2–3x mais rápida (uma query com join, sem bloquear na edge function do GestaoClick).
- Trocar entre Separação/Despacho/sub-abas: instantâneo (sem refetch).
- Editar/confirmar um pedido: instantâneo (otimista), sem reload da lista inteira.
- Razões sociais aparecem progressivamente em segundo plano sem travar a UI.
