## Problema

O banco tem 30 pedidos atrasados válidos (`status_agendamento='Agendado'`, `substatus='Separado'`, datas 03/06 e 05/06), confirmados via SQL. Eles aparecem no app publicado, mas no editor o filtro **Atrasados** mostra 0 e até o preset **Todos** não inclui esses 30 registros — apenas alguns futuros.

A lógica em `Despacho.tsx` (filtro `pedidosBase` + preset `atrasados`) é equivalente à antiga `getPedidosAtrasados`. Como o filtro parece correto, preciso instrumentar o código para identificar onde os 30 registros estão sendo perdidos antes de propor a correção definitiva.

## Etapa 1 — Diagnóstico (adicionar logs temporários)

Em `src/components/expedicao/Despacho.tsx`, dentro do `useMemo` que calcula `pedidosBase` e `pedidosFiltrados`, adicionar logs detalhados:

- Total de `pedidos` recebidos do store
- Lista compacta: `{ id, cliente, status_agendamento, substatus_pedido, data_prevista_entrega }` para todos os pedidos
- Total após filtro base (Agendado + Separado/Despachado)
- Total após cada etapa do preset (hoje/semana/atrasados/todos)
- Valor de `hoje` e datas comparadas no filtro `atrasados`

Logs prefixados com `🩺 [Despacho]` para fácil identificação no console.

## Etapa 2 — Validar com o usuário

Após adicionar os logs, pedir ao usuário para:
1. Atualizar a página do editor (Ctrl+F5)
2. Abrir a aba Despacho → clicar em **Todos** → depois em **Atrasados**
3. Copiar os logs prefixados com 🩺 do console

Com base nos logs vou identificar a causa exata (provavelmente uma destas):
- a) `pedidos` no store está incompleto (problema em `carregarPedidos`/RLS/throttle de cache)
- b) Alguma transformação está mudando `status_agendamento` ou `substatus_pedido` para esses 30
- c) `data_prevista_entrega` está chegando como `null`/objeto inválido para esses registros
- d) Comparação de datas tem problema com fuso horário

## Etapa 3 — Aplicar a correção apropriada

Com a causa identificada, aplicar o fix mínimo necessário. Hipóteses prováveis e suas correções:

- **Se (a)**: forçar `recarregarSilencioso()` ao montar Despacho ou ajustar throttle do `carregamentoEmAndamento`.
- **Se (c) ou (d)**: trocar `new Date(p.data_prevista_entrega)` por `parseDataSegura(...)` (mesma função usada no resto do store) e exportá-la para uso compartilhado.

## Etapa 4 — Remover logs de diagnóstico

Após confirmar o fix, remover os logs `🩺 [Despacho]` adicionados na Etapa 1.

## Arquivos a tocar

- `src/components/expedicao/Despacho.tsx` (logs + possível fix de parsing)
- Possivelmente `src/hooks/useExpedicaoStore.ts` (exportar `parseDataSegura` ou ajustar throttle)

## Fora de escopo

- Mudanças visuais ou de outros filtros
- Refatoração de outras abas (Separação, Documentos, Histórico, Rota)
- Alteração de schema/RLS no Supabase
