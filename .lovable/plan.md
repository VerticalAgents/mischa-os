

# Card "Producao Agendada" + Toggle no Estoque Disponivel

## Resumo

Duas mudancas conectadas:

1. **Novo card "Producao Agendada"** no topo da aba Projecao de Producao, mostrando registros de producao com status "Registrado" (ainda nao confirmados), agrupados por produto com total de unidades.

2. **Toggle "Incluir producao agendada"** no card Estoque Disponivel, que ao ser ativado soma as unidades de producoes agendadas (nao confirmadas) ao estoque disponivel de cada produto.

## Como vai funcionar

A producao agendada sao os registros na tabela `historico_producao` com `status = 'Registrado'`. Esses brownies estao planejados para serem produzidos mas ainda nao foram confirmados (nao entraram no estoque oficialmente).

Ao ativar o toggle no card de Estoque Disponivel, o sistema somara essas unidades previstas ao estoque, permitindo visualizar como ficara o estoque apos a producao ser concluida. Isso facilita o planejamento semanal completo.

## Mudancas detalhadas

### 1. Novo hook `useProducaoAgendada`

**Arquivo**: `src/hooks/useProducaoAgendada.ts` (novo)

Busca registros de `historico_producao` com `status = 'Registrado'`, agrupa por `produto_id` e retorna:
- Lista de produtos com unidades previstas (usando `unidades_previstas` ou `unidades_calculadas`)
- Total geral de unidades agendadas
- Mapa `Record<string, number>` de produto_id -> unidades (para uso no estoque)
- Funcao de recarregar

### 2. Novo componente `ProducaoAgendadaCard`

**Arquivo**: `src/components/pcp/ProducaoAgendadaCard.tsx` (novo)

Card com design semelhante ao "Produtos Necessarios":
- Icone + titulo "Producao Agendada"
- Descricao: "Producoes registradas aguardando confirmacao"
- Bloco destaque com total de unidades agendadas + badge com quantidade de registros
- Collapsible com detalhes por produto (nome + unidades previstas)
- Estado vazio quando nao ha producoes agendadas

### 3. Modificar `ProjecaoProducaoTab.tsx`

- Importar e usar o hook `useProducaoAgendada`
- Renderizar `ProducaoAgendadaCard` acima do grid de 2 colunas (full width)
- Passar o mapa de producao agendada para o `EstoqueDisponivel`

### 4. Modificar `EstoqueDisponivel.tsx`

- Adicionar prop `producaoAgendada?: Record<string, number>` (produto_id -> unidades)
- Adicionar toggle "Incluir producao agendada" no canto superior direito (ao lado do botao refresh)
- Estado `incluirProducaoAgendada` (default: false)
- Quando ativo, somar as unidades agendadas ao estoque disponivel de cada produto na exibicao
- Atualizar descricao do card para refletir o estado do toggle
- Passar essa informacao tambem para o `useEstoqueDisponivel` ou calcular localmente no componente

### 5. Modificar `useEstoqueDisponivel.ts`

- Adicionar parametro opcional `producaoAgendada?: Record<string, number>`
- Quando fornecido, somar as unidades agendadas ao `estoque_disponivel` de cada produto no calculo final
- Isso afeta o status (critico/baixo/adequado/excesso) automaticamente

## Layout da pagina apos as mudancas

```text
+--------------------------------------------------+
|  Producao Agendada (full width)                   |
|  Total: 640 unidades | 3 registros                |
|  > Detalhes por Produto                           |
+--------------------------------------------------+

+------------------------+-------------------------+
|  Produtos Necessarios  |  Estoque Disponivel     |
|  ...                   |  [x] Incluir prod. agend|
|                        |  ...                    |
+------------------------+-------------------------+

+--------------------------------------------------+
|  Sugestao de Producao                             |
+--------------------------------------------------+
```

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useProducaoAgendada.ts` | Criar |
| `src/components/pcp/ProducaoAgendadaCard.tsx` | Criar |
| `src/components/pcp/ProjecaoProducaoTab.tsx` | Modificar |
| `src/components/pcp/EstoqueDisponivel.tsx` | Modificar |
| `src/hooks/useEstoqueDisponivel.ts` | Modificar |

