
# Adicionar Badge "Entregues" e Detalhes de Entregas Realizadas no Calendario Semanal

## O que sera feito

Adicionar no calendario semanal um terceiro badge azul mostrando "Z Entregues" ao lado dos badges existentes de "Confirmados" (verde) e "Previstos" (amarelo). Ao expandir um dia, as entregas concluidas aparecerao no final da lista, com cards de fundo azul claro, em ordem alfabetica, separadas dos agendamentos.

## Mudancas Detalhadas

### Arquivo: `src/components/agendamento/AgendamentoDashboard.tsx`

**1. Badge "Entregues" no calendario (linhas ~1093-1101)**

Adicionar um terceiro badge azul claro no calendario semanal, apos os badges de Previstos e Confirmados:

```text
Previstos (amarelo)   -> ja existe
Confirmados (verde)   -> ja existe
Entregues (azul)      -> NOVO
```

A condicao "Livre" so aparecera se nao houver previstos, confirmados E entregues (`dia.total === 0 && dia.realizadas === 0`).

**2. Criar useMemo `entregasDiaSelecionado` (apos o `agendamentosDiaSelecionado`)**

Novo `useMemo` que filtra as entregas historicas do dia selecionado, enriquece com nome do cliente, e ordena alfabeticamente:

```typescript
const entregasDiaSelecionado = useMemo(() => {
  if (!diaSelecionado) return [];
  
  return entregasHistoricoFiltradas
    .filter(e => isSameDay(new Date(e.data), diaSelecionado) && e.tipo === 'entrega')
    .map(e => {
      const cliente = clientes.find(c => c.id === e.cliente_id);
      return { ...e, clienteNome: cliente?.nome || 'Cliente desconhecido' };
    })
    .sort((a, b) => a.clienteNome.localeCompare(b.clienteNome));
}, [diaSelecionado, entregasHistoricoFiltradas, clientes]);
```

**3. Atualizar descricao do dia selecionado (linhas ~1115-1117)**

Incluir contagem de entregas realizadas na descricao:

```text
"X agendamento(s) e Y entrega(s) realizada(s)"
```

**4. Renderizar cards de entregas realizadas no painel expandido (apos a lista de agendamentos, linhas ~1229-1232)**

Apos a lista dos agendamentos (Confirmados e Previstos), adicionar uma secao de entregas concluidas com:
- Separador visual com titulo "Entregas Realizadas"
- Cards com fundo azul claro (`bg-blue-50`)
- Exibindo: nome do cliente (ordem alfabetica), quantidade entregue, data/hora
- Badge "Entregue" em azul
- Sem checkbox (nao sao reagendaveis)

Layout de cada card de entrega concluida:

```text
+---------------------------------------------------+
| [bg-blue-50]                                       |
| Nome do Cliente                     Badge: Entregue|
| Quantidade: XX unidades                            |
| Observacao (se houver)                             |
+---------------------------------------------------+
```

**5. Ajustar condicao de "vazio" no painel do dia**

A mensagem "Nenhum agendamento para este dia" so aparecera se nao houver agendamentos E nao houver entregas realizadas.

## Ordem visual no painel expandido

```text
1. Agendados/Confirmados (fundo verde claro - ja existe)
2. Previstos (fundo amarelo claro - ja existe)  
3. --- Separador "Entregas Realizadas" ---
4. Entregues (fundo azul claro - NOVO, ordem alfabetica)
```

## Secao Tecnica

### Estrutura dos dados ja disponivel

O `dadosGraficoSemanal` ja computa `realizadas` e `clientesRealizadas` por dia -- so falta exibir no badge. Para o painel expandido, sera criado um novo `useMemo` que usa `entregasHistoricoFiltradas` filtrado pelo `diaSelecionado`.

### Campos disponiveis no historico de entregas

Cada registro de `entregasHistoricoFiltradas` contem:
- `id`, `cliente_id`, `cliente_nome`, `data`, `tipo`, `quantidade`, `itens[]`, `observacao`

### Arquivo unico a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Badge azul no calendario, novo useMemo, secao de entregas no painel expandido |
