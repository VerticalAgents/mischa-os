
# Adicionar Percentual de Previstos no Card de Produtos Necessarios

## O que sera feito

Ao ativar o toggle "Incluir previstos", aparecera um campo de percentual (padrao 50%) que permite simular cenarios: "se X% dos previstos forem confirmados, quanto preciso produzir?". As quantidades dos pedidos previstos serao multiplicadas por esse percentual antes de somar com os confirmados.

## Mudancas na interface

Quando o toggle estiver ativado, um input de percentual aparecera ao lado (ou abaixo) do switch:

```text
Incluir previstos [ON]  [ 50 ] %
```

- O campo aceita valores de 1 a 100
- Padrao: 50%
- A descricao do card muda para: "Quantidades para pedidos confirmados e 50% dos previstos"

## Mudancas na logica de calculo

Atualmente, todos os agendamentos (Agendado + Previsto) sao processados igualmente no `useEffect` que chama `compute_entrega_itens_v2`. Para aplicar o percentual sem precisar re-chamar o RPC a cada mudanca de %, a estrategia sera:

1. Separar os resultados do RPC em dois mapas: `quantidadesConfirmados` e `quantidadesPrevistos`
2. No loop de calculo, verificar o `statusAgendamento` de cada agendamento e acumular no mapa correto
3. Criar um `useMemo` final que combina: `confirmados + (previstos * percentual / 100)`, arredondando para cima
4. Assim, mudar o slider/input de percentual recalcula instantaneamente sem novas chamadas ao banco

## Arquivo a modificar

**`src/components/pcp/ProjecaoProducaoTab.tsx`**

### 1. Novo estado

```typescript
const [percentualPrevistos, setPercentualPrevistos] = useState(50);
```

### 2. Separar quantidades no useEffect (linhas 72-135)

Em vez de um unico `quantidadesPorProduto`, armazenar dois estados separados:
- `quantidadesConfirmados` - quantidades dos agendamentos com status "Agendado"
- `quantidadesPrevistos` - quantidades dos agendamentos com status "Previsto"

O useEffect percorre `agendamentosSemana` e acumula em um ou outro mapa conforme o status.

### 3. Novo useMemo para combinar com percentual

```typescript
const quantidadesPorProduto = useMemo(() => {
  const resultado: Record<string, ProdutoQuantidade> = {};

  // Adicionar 100% dos confirmados
  for (const [id, produto] of Object.entries(quantidadesConfirmados)) {
    resultado[id] = { ...produto };
  }

  // Adicionar X% dos previstos
  for (const [id, produto] of Object.entries(quantidadesPrevistos)) {
    const qtdAjustada = Math.ceil(produto.quantidade * percentualPrevistos / 100);
    if (resultado[id]) {
      resultado[id] = {
        ...resultado[id],
        quantidade: resultado[id].quantidade + qtdAjustada
      };
    } else {
      resultado[id] = { ...produto, quantidade: qtdAjustada };
    }
  }

  return resultado;
}, [quantidadesConfirmados, quantidadesPrevistos, percentualPrevistos]);
```

Isso permite que ao alterar o percentual, o recalculo seja instantaneo (sem chamadas ao banco).

### 4. UI do percentual (linhas 181-190)

Quando `incluirPrevistos` for true, exibir um input numerico compacto ao lado do switch:

```text
Incluir previstos [ON]  [ 50 ]%
```

- Input tipo number, min=1, max=100, largura ~16 (w-16)
- Sufixo "%" ao lado
- Aparece com animacao suave (condicional ao toggle)

### 5. Atualizar descricao (linha 178)

Quando ativo, mostrar: "Quantidades para pedidos confirmados e {percentualPrevistos}% dos previstos"

## Comportamento esperado

- Toggle desligado: mostra apenas confirmados (como hoje)
- Toggle ligado com 50%: mostra confirmados + metade das quantidades previstas
- Toggle ligado com 100%: comportamento igual ao atual (todos os previstos)
- Toggle ligado com 25%: mostra confirmados + 1/4 das quantidades previstas
- Mudar o percentual recalcula tudo instantaneamente, sem loading
