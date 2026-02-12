
# Agrupar lista de separacao impressa por representante

## O que muda

A lista de separacao impressa (PDF para impressao) passara a agrupar os pedidos por representante, com cabecalhos visuais separando cada grupo. Isso espelha a mesma logica de agrupamento ja aplicada no calendario semanal.

## Como funciona hoje

A lista e uma tabela unica com todos os pedidos em sequencia, sem agrupamento. Os pedidos possuem `representante_id` (numero) vindo do store, mas esse dado nao e utilizado na impressao.

## O que sera alterado

### 1. `PrintingActions.tsx` - Receber e usar dados de representantes

- Adicionar uma nova prop `representantes` (array com `id` e `nome`) ao componente
- Na funcao `imprimirListaSeparacao`, agrupar `listaAtual` por `representante_id`:
  - Resolver o nome usando a lista de representantes
  - Pedidos sem representante ficam no grupo "Sem representante" (exibido por ultimo)
  - Grupos ordenados alfabeticamente pelo nome do representante
- Para cada grupo, renderizar um cabecalho de secao na tabela (linha com colspan, fundo cinza mais escuro, nome do representante e contagem de pedidos)
- O resumo total (TOTAL GERAL) continua no rodape somando tudo

### 2. `SeparacaoActionsCard.tsx` - Passar representantes

- Receber `representantes` como nova prop e repassar ao `PrintingActions`

### 3. `SeparacaoPedidos.tsx` - Buscar e fornecer representantes

- Buscar representantes do Supabase (similar ao que ja e feito em outros componentes como `OrganizadorEntregas.tsx`)
- Passar a lista para `SeparacaoActionsCard`

## Resultado visual na impressao

```text
+--------------------------------------------------+
| Lista de Separacao - Todos os Pedidos             |
| Data: 12/02/2026  Total: 15 pedidos               |
+--------------------------------------------------+
| >> Joao Silva (5 pedidos)                         |
+--------+------+------+-----------+-------+--------+
| Client | Data | Tipo | Produtos  | Total | Obs    |
+--------+------+------+-----------+-------+--------+
| ...    | ...  | ...  | ...       | ...   | ...    |
+--------+------+------+-----------+-------+--------+
| >> Maria Santos (7 pedidos)                       |
+--------+------+------+-----------+-------+--------+
| ...    | ...  | ...  | ...       | ...   | ...    |
+--------+------+------+-----------+-------+--------+
| >> Sem representante (3 pedidos)                  |
+--------+------+------+-----------+-------+--------+
| ...    | ...  | ...  | ...       | ...   | ...    |
+--------+------+------+-----------+-------+--------+
|                        TOTAL GERAL:  450          |
+--------------------------------------------------+
```

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/expedicao/SeparacaoPedidos.tsx` | Buscar representantes e passar ao SeparacaoActionsCard |
| `src/components/expedicao/components/SeparacaoActionsCard.tsx` | Nova prop `representantes`, repassar ao PrintingActions |
| `src/components/expedicao/components/PrintingActions.tsx` | Nova prop `representantes`, agrupar pedidos por representante na geracao do HTML de impressao |

Nenhum arquivo novo sera criado. A lista de documentos nao sera alterada (apenas a lista de separacao).
