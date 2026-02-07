
# Investigacao: Filtros do Dashboard de Agendamentos Nao Funcionam Consistentemente

## Problemas Identificados

Encontrei **3 problemas** que explicam por que os filtros falham intermitentemente:

---

### Problema 1: Lista de clientes pode estar vazia (PRINCIPAL)

O `AgendamentoDashboard` **nao carrega a lista de clientes** na sua inicializacao. Ele depende de `clientes` do `useClienteStore`, que so e preenchido se o usuario tiver visitado outra pagina antes (como Home ou Clientes).

**Efeito:** Quando `clientes` esta vazio e voce seleciona um filtro de representante/rota, o calculo de `entregasHistoricoFiltradas` tenta cruzar entregas com uma lista vazia de clientes. Resultado: o `clienteIdsFiltrados` fica vazio, e TODAS as entregas sao filtradas (removidas). Os cards "Total da Semana", "Entregas Realizadas", "Produtos Entregues" e os graficos zeram.

**Por que funciona as vezes:** Se o usuario navegou pela Home primeiro, os clientes ja estao no store (Zustand persiste entre paginas). Se acessou o Dashboard diretamente, nao ha clientes.

```text
Fluxo atual (com bug):
  Home -> Agendamento/Dashboard -> Filtros funcionam (clientes ja carregados)
  URL direta /agendamento -> Filtros NAO funcionam (clientes vazio)
```

**Correcao:** Adicionar `carregarClientes()` no `useEffect` de inicializacao do Dashboard (linha 155), junto com agendamentos e historico.

---

### Problema 2: Filtro de nome nao se aplica ao historico de entregas

O filtro de busca por nome (`filtroNome`) filtra `agendamentosFiltrados`, mas nao filtra `entregasHistoricoFiltradas`. Quando o usuario busca por nome, os cards de agendamentos mudam, mas os dados de entregas realizadas continuam mostrando tudo.

**Correcao:** Adicionar filtragem por nome no `entregasHistoricoFiltradas`, cruzando `cliente_id` das entregas com clientes cujo nome corresponde ao filtro.

---

### Problema 3: Race condition na inicializacao

O `useEffect` de carregamento (linha 155) usa `agendamentos.length === 0` como condicao para carregar. Se os agendamentos ja estiverem no Zustand de outra pagina, eles nao sao recarregados, mas podem estar desatualizados. Alem disso, `carregarHistoricoEntregas()` e chamado sem argumentos, o que carrega TODOS os registros sem filtro de data, potencialmente trazendo dados desnecessarios.

Mais importante: nao ha garantia de que `clientes` esteja carregado antes que os `useMemo` de filtragem rodem. Na primeira renderizacao, `clientes` pode estar vazio enquanto `entregasHistorico` ja tem dados.

---

## Plano de Correcao

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

**1. Carregar clientes na inicializacao do Dashboard**

No `useEffect` de montagem (linha 155), adicionar carregamento de clientes:

```typescript
useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        agendamentos.length === 0 ? carregarTodosAgendamentos() : Promise.resolve(),
        clientes.length === 0 ? carregarClientes() : Promise.resolve(),  // NOVO
        carregarHistoricoEntregas()
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);
```

**2. Aplicar filtro de nome tambem ao historico de entregas**

No `entregasHistoricoFiltradas` (linha 214), incluir logica para `filtroNome`:

```typescript
const entregasHistoricoFiltradas = useMemo(() => {
  if (representanteFiltro.length === 0 && rotaFiltro.length === 0 && !filtroNome.trim()) {
    return entregasHistorico;
  }
  
  const clienteIdsFiltrados = new Set(
    clientes
      .filter(cliente => {
        // Filtro por nome
        const matchNome = !filtroNome.trim() || 
          cliente.nome.toLowerCase().includes(filtroNome.toLowerCase().trim());
        // Filtro por representante
        const matchRep = representanteFiltro.length === 0 || 
          (cliente.representanteId && representanteFiltro.includes(cliente.representanteId));
        // Filtro por rota
        const matchRota = rotaFiltro.length === 0 || 
          (cliente.rotaEntregaId && rotaFiltro.includes(cliente.rotaEntregaId));
        return matchNome && matchRep && matchRota;
      })
      .map(c => c.id)
  );
  
  return entregasHistorico.filter(e => clienteIdsFiltrados.has(e.cliente_id));
}, [entregasHistorico, clientes, representanteFiltro, rotaFiltro, filtroNome]);
```

### Arquivo: `src/components/agendamento/EntregasRealizadasSemanal.tsx`

**3. Proteger contra lista de clientes vazia**

Ja tem a logica de filtragem, mas quando `clientesProp` esta vazio e ha filtros ativos, a filtragem remove tudo. Adicionar protecao:

```typescript
const filtrarPorRepresentanteRota = (entregasList: typeof entregas) => {
  if (!entregasList) return [];
  if (representanteFiltro.length === 0 && rotaFiltro.length === 0) return entregasList;
  
  // Se nao ha clientes carregados, nao filtrar (evitar zerar dados)
  if (clientesProp.length === 0) return entregasList;
  
  // ... resto da logica
};
```

---

## Resumo das Mudancas

| Arquivo | Mudanca | Impacto |
|---------|---------|---------|
| `AgendamentoDashboard.tsx` | Carregar `clientes` no useEffect | Corrige falha total dos filtros em acesso direto |
| `AgendamentoDashboard.tsx` | Incluir `filtroNome` em `entregasHistoricoFiltradas` | Filtro de nome afeta todos os indicadores |
| `EntregasRealizadasSemanal.tsx` | Proteger contra `clientes` vazio | Evita zerar dados quando clientes nao carregou |
