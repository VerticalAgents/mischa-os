

# Plano: Nova Aba "Periodicidade" no Menu Agendamentos

## Objetivo
Criar uma nova aba chamada **"Periodicidade"** dentro do menu Agendamentos para permitir a visualização e gestao da periodicidade dos clientes que possuem:
- Agendamento ativo (status "Previsto" ou "Agendado")
- Status de cliente "Ativo"

---

## Escopo Funcional

### Dados Exibidos
A nova aba apresentara uma tabela com as seguintes informacoes por cliente:

| Coluna | Descricao |
|--------|-----------|
| PDV (Nome) | Nome do cliente |
| Periodicidade Atual | Valor em dias configurado (`periodicidadePadrao`) |
| Quantidade Padrao | Unidades padrao por reposicao |
| Ultima Reposicao | Data da ultima entrega efetiva |
| Proxima Reposicao | Data do proximo agendamento |
| Status Agendamento | "Previsto" ou "Agendado" |
| Acoes | Botao para editar periodicidade |

### Filtros Disponiveis
- **Pesquisa por nome**: Filtro de texto para buscar clientes
- **Filtro por periodicidade**: Selecionar faixas (ex: "Semanal (7 dias)", "Quinzenal (14 dias)", "Mensal (30 dias)", "Outros")
- **Ordenacao**: Por nome, periodicidade, proxima reposicao

### Cards de Resumo (Estatisticas)
No topo da aba, exibir cards com:
1. **Total de Clientes**: Numero total de clientes ativos com agendamento
2. **Periodicidade Media**: Media de dias de periodicidade
3. **Distribuicao por Faixa**: Quantos clientes em cada faixa de periodicidade

### Funcionalidade de Edicao
- Modal para editar a periodicidade do cliente diretamente
- Opcao de alterar `periodicidadePadrao` e `quantidadePadrao`
- Ao salvar, atualiza o cliente no banco de dados

---

## Arquitetura Tecnica

### Novo Componente
**Arquivo:** `src/components/agendamento/AgendamentosPeriodicidade.tsx`

```typescript
// Estrutura do componente
interface ClientePeriodicidade {
  clienteId: string;
  nome: string;
  periodicidadePadrao: number;
  quantidadePadrao: number;
  ultimaReposicao?: Date;
  proximaReposicao: Date;
  statusAgendamento: "Previsto" | "Agendado";
}
```

### Integracao com Stores Existentes
1. **useAgendamentoClienteStore**: Para obter agendamentos ativos
2. **useClienteStore**: Para obter dados de periodicidade e atualizar cliente

### Logica de Filtragem
```typescript
const clientesComPeriodicidade = useMemo(() => {
  // Filtrar agendamentos com status Previsto ou Agendado
  return agendamentos.filter(a => 
    (a.statusAgendamento === "Previsto" || a.statusAgendamento === "Agendado") &&
    a.cliente.ativo === true
  ).map(a => ({
    clienteId: a.cliente.id,
    nome: a.cliente.nome,
    periodicidadePadrao: a.cliente.periodicidadePadrao,
    quantidadePadrao: a.cliente.quantidadePadrao,
    ultimaReposicao: a.cliente.ultimaDataReposicaoEfetiva,
    proximaReposicao: a.dataReposicao,
    statusAgendamento: a.statusAgendamento
  }));
}, [agendamentos]);
```

---

## Alteracoes Necessarias

### 1. Criar Componente Principal
**Novo arquivo:** `src/components/agendamento/AgendamentosPeriodicidade.tsx`

Estrutura:
- Cards de estatisticas no topo
- Barra de filtros (pesquisa + filtro de faixa de periodicidade)
- Tabela com dados dos clientes
- Modal de edicao de periodicidade

### 2. Criar Modal de Edicao
**Novo arquivo:** `src/components/agendamento/EditarPeriodicidadeModal.tsx`

Campos editaveis:
- Periodicidade (dias)
- Quantidade Padrao (unidades)

### 3. Atualizar Pagina de Agendamentos
**Arquivo:** `src/pages/Agendamento.tsx`

Adicoes:
- Import do novo componente `AgendamentosPeriodicidade`
- Nova aba "periodicidade" no TabsList
- Novo TabsContent renderizando o componente
- Adicionar "periodicidade" na lista de tabs validas para navegacao via URL

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/agendamento/AgendamentosPeriodicidade.tsx` | Componente principal da aba Periodicidade |
| `src/components/agendamento/EditarPeriodicidadeModal.tsx` | Modal para edicao de periodicidade do cliente |

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/Agendamento.tsx` | Adicionar nova aba e importar componente |

---

## Interface Visual Proposta

```
+-----------------------------------------------------------------------+
| [Dashboard] [Agendamentos] [Periodicidade] [Positivacao] [...]        |
+-----------------------------------------------------------------------+

+-------------------+  +-------------------+  +-------------------+
| Total de Clientes |  | Periodicidade     |  | Distribuicao      |
|       42          |  | Media: 12 dias    |  | Semanal: 15       |
|                   |  |                   |  | Quinzenal: 18     |
|                   |  |                   |  | Mensal: 9         |
+-------------------+  +-------------------+  +-------------------+

+-----------------------------------------------------------------------+
| [Pesquisar...] | [Filtrar por Faixa ▼] | Ordenar por: [▼]    42 PDVs |
+-----------------------------------------------------------------------+

| PDV           | Periodicidade | Qtd Padrao | Ultima   | Proxima    | Status   | Acoes  |
|---------------|---------------|------------|----------|------------|----------|--------|
| Cafe Central  | 7 dias        | 20 un      | 25/01    | 01/02      | Agendado | [Edit] |
| Padaria Sol   | 14 dias       | 15 un      | 20/01    | 03/02      | Previsto | [Edit] |
| ...           | ...           | ...        | ...      | ...        | ...      | ...    |
```

---

## Resultado Esperado

1. **Nova aba "Periodicidade"** visivel no menu de Agendamentos
2. **Visualizacao clara** de todos os clientes ativos com sua periodicidade configurada
3. **Filtros funcionais** para encontrar clientes por nome ou faixa de periodicidade
4. **Estatisticas uteis** para entender a distribuicao de periodicidades
5. **Edicao rapida** da periodicidade diretamente da aba sem precisar ir ao cadastro de clientes

