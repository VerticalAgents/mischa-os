

# Duas alteracoes: esconder endereco para "Retirada" + remover checkbox "Contabilizar Giro"

## 1. Esconder campos de endereco quando logistica = "Retirada"

No formulario de cadastro do cliente (`ClienteFormDialog.tsx`), os campos "Endereco de Entrega" e "Link do Google Maps" serao condicionalmente exibidos. Quando o tipo de logistica selecionado for exatamente `"Retirada"` (case-insensitive), esses campos ficarao ocultos.

## 2. Remover checkbox "Contabilizar no giro medio"

O checkbox sera removido do formulario. Em todos os pontos do sistema que usam `contabilizarGiroMedio` para filtrar clientes, a logica sera substituida por `statusCliente === 'Ativo'`.

### Locais impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/clientes/ClienteFormDialog.tsx` | Esconder endereco/Google Maps quando logistica = "Retirada". Remover checkbox "Contabilizar no giro medio" |
| `src/components/clientes/ClienteDetalhesInfo.tsx` | Remover exibicao "Contabilizar no Giro: Sim/Nao" |
| `src/services/dreCalculations.ts` | Trocar filtro `contabilizarGiroMedio` por `statusCliente === 'Ativo'` |
| `src/components/gestao-financeira/ResumoGeralTab.tsx` | Trocar filtro `contabilizarGiroMedio` por `statusCliente === 'Ativo'` |
| `src/pages/gestao-financeira/PontoEquilibrio.tsx` | Trocar filtro `contabilizarGiroMedio` por `statusCliente === 'Ativo'` |

### Detalhes tecnicos

**Endereco condicional** - No `ClienteFormDialog.tsx`, envolver os campos de endereco e link Google Maps com:

```typescript
{formData.tipoLogistica?.toLowerCase() !== 'retirada' && (
  // campos de endereco e link google maps
)}
```

**Filtros de giro** - Nos 3 arquivos financeiros, substituir:

```typescript
// Antes
clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio)

// Depois
clientes.filter(c => c.statusCliente === 'Ativo')
```

O campo `contabilizarGiroMedio` continuara existindo no banco de dados e no tipo TypeScript (para nao quebrar nada), mas nao sera mais exibido nem editavel no formulario. Sempre sera salvo como `true` por padrao.

