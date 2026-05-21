## Problema

A página de Clientes está lenta pelo mesmo padrão que a Expedição tinha:

1. **`Clientes.tsx`** chama `carregarClientes()` toda vez que monta. Além disso, um `refreshTrigger` é incrementado após fechar formulário, voltar dos detalhes e deletar — cada incremento dispara um **recarregamento completo** da lista (já redundante com os updates otimistas do store).
2. **`useClienteStore.carregarClientes`** seta `loading: true` no início → a tabela inteira é desmontada e substituída por "Carregando clientes...", mesmo quando já há dados em memória.
3. **`ClientesTable`** dispara `buscarRazoesSociaisLote` no `useEffect` a cada mudança em `clientes`. O cache (`cacheRef`) vive **dentro do hook** — ao desmontar/remontar o componente (navegação, voltar dos detalhes, fechar form), o cache é perdido e a edge function `gestaoclick-proxy` é chamada de novo para **todos** os clientes. Essa é a chamada mais lenta.
4. **Sem guarda de carga inicial**: voltar para /clientes vindo de outra rota refaz tudo — fetch dos clientes + fetch das razões sociais.

## Solução

Aplicar o mesmo padrão que resolveu a Expedição: carga inicial única, sem reloads em fechamento de modal/navegação, cache global de razões sociais e renderização não bloqueante.

### 1. `src/hooks/useClienteStore.ts`
- Adicionar flag `hasLoaded: boolean` no estado.
- Em `carregarClientes`, **não setar `loading: true`** se já houver dados em memória (refresh em background). Setar loading apenas na primeira carga.
- Marcar `hasLoaded = true` após sucesso.
- Adicionar `recarregarSilencioso()` opcional para refreshes manuais (sem flash de loading).
- Manter os updates otimistas que já existem em `adicionarCliente`, `atualizarCliente`, `excluirCliente`.

### 2. `src/pages/Clientes.tsx`
- Criar/usar `useClientesSync` (espelho de `useExpedicaoSync`) que carrega **uma única vez** via `useRef(false)` na montagem da página.
- Remover o `useEffect` complexo que depende de `loading`, `processingUrlParam`, `clienteAtual`, `refreshTrigger` etc. Separar em dois efeitos pequenos:
  - Carga inicial (uma vez).
  - Processamento do `clienteId` da URL, só quando `hasLoaded` e `clientes.length > 0`.
- **Eliminar `refreshTrigger`**: tirar `setRefreshTrigger(prev => prev + 1)` de:
  - `handleFormClose` (o store já fez update otimista).
  - `handleBackToList` (nada precisa ser refeito).
  - `confirmDeleteCliente` (delete já remove do estado).
- Remover o segundo `useEffect` que reage ao `refreshTrigger`.
- Tela de "Carregando..." só aparece quando `loading && !hasLoaded` (primeira carga).

### 3. `src/hooks/useRazaoSocialGC.ts` — cache em escopo de módulo
- Mover `cacheRef`, `pendingIdsRef`, `fetchingRef` para variáveis **fora** do hook (escopo de módulo), com TTL de ~5 min como na Expedição.
- Adicionar throttle (não disparar lote se outro disparou nos últimos 2s).
- Assim, sair de /clientes, entrar em detalhes ou fechar form **não** invalida o cache. Razões sociais já carregadas não voltam a ser buscadas.

### 4. `src/components/clientes/ClientesTable.tsx`
- Manter o `useEffect` que chama `buscarRazoesSociaisLote`, mas confiar no cache de módulo — primeira vez busca, depois é instantâneo.
- Sem mudança na renderização (já é não bloqueante: razões sociais aparecem progressivamente).

### 5. Manter
- Updates otimistas (`adicionarCliente`, `atualizarCliente`, `excluirCliente`) já em vigor.
- Comportamento de filtros, seleção e ordenação.

## Resultado esperado

- Primeira carga: igual ao atual (uma query) + razões sociais em background.
- Voltar para /clientes, fechar formulário, sair dos detalhes de um cliente: **instantâneo** — sem refetch de clientes e sem refetch de razões sociais.
- Adicionar/editar/deletar cliente: lista atualiza instantaneamente via update otimista, sem flash de "Carregando...".
- Edge function `gestaoclick-proxy` chamada **uma única vez por sessão** para os IDs já vistos.
