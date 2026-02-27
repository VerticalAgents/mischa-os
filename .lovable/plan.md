
# Adicionar "Sem representante" no filtro de representantes

## O que muda

O filtro de representantes na Separacao de Pedidos (e Despacho, que usa o mesmo componente) vai ganhar uma opcao "Sem representante" para filtrar pedidos que nao tem representante associado.

## Abordagem

Usar um ID especial (ex: `-1`) para representar "Sem representante" na lista de IDs selecionados. Isso evita mudar a interface do componente (continua `number[]`).

## Arquivos alterados

### 1. `RepresentantesFilter.tsx`

- Adicionar uma opcao "Sem representante" na lista, entre "Todos" e os representantes reais, usando o ID `-1`
- Ajustar `handleToggleAll` para incluir `-1` ao selecionar todos
- Ajustar `allSelected` para considerar o `-1`
- Ajustar `getButtonText` para mostrar "Sem representante" quando so `-1` esta selecionado

### 2. `SeparacaoPedidos.tsx` (linha 206-207)

Ajustar a logica de filtragem para tratar o ID `-1`:

```typescript
const incluiSemRepresentante = filtroRepresentantes.includes(-1);
const idsReais = filtroRepresentantes.filter(id => id !== -1);

const matchRepresentante = filtroRepresentantes.length === 0 ||
  (incluiSemRepresentante && !pedido.representante_id) ||
  (pedido.representante_id && idsReais.includes(pedido.representante_id));
```

### 3. `Despacho.tsx` (linha 168-171)

Mesma logica de filtragem:

```typescript
const incluiSemRepresentante = filtroRepresentantes.includes(-1);
const idsReais = filtroRepresentantes.filter(id => id !== -1);

resultado = resultado.filter(pedido =>
  (incluiSemRepresentante && !pedido.representante_id) ||
  (pedido.representante_id && idsReais.includes(pedido.representante_id))
);
```

## Resultado

O usuario podera filtrar por representantes especificos, por "Sem representante", ou combinar ambos.
