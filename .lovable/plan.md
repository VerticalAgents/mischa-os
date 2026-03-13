

# Diagnóstico: Campos Zerados no Modal de Edição de Cliente

## Problema Identificado

Analisei o banco de dados e confirmei que os valores estão **corretamente salvos** (ex: cliente "Jardim São Geraldo" tem `representante_id=4`, `rota_entrega_id=7`, `categoria_estabelecimento_id=9`). O problema é de **exibição, não de persistência**.

A sessão de replay confirma: os selects inicialmente mostram valores, mas são substituídos por placeholders ("Selecione um representante", etc.) durante um re-render.

## Causa Raiz

Quando o dialog de edição abre, os hooks (`useSupabaseRepresentantes`, `useSupabaseRotasEntrega`, `useSupabaseCategoriasEstabelecimento`) iniciam com arrays vazios e carregam dados assincronamente. Durante esse carregamento:

1. O `formData` tem `representanteId: 4` (correto)
2. O Select recebe `value="4"`
3. Mas não existe nenhum `<SelectItem value="4">` porque o array de opções está vazio
4. O Radix Select mostra o placeholder em vez do valor

Quando as opções carregam, o Select deveria atualizar, mas o Radix Select não re-avalia o texto do trigger quando opções são adicionadas dinamicamente com value controlado que já existia.

**Nota**: Os campos de string (Tipo de Logística, Status) funcionam porque usam `value={formData.tipoLogistica || 'Própria'}` — o fallback impede o valor `undefined`.

## Solução

### Alteração 1: `src/components/clientes/ClienteFormDialog.tsx`

Adicionar um guard de carregamento para os hooks antes de renderizar o form. Os selects de ID só devem renderizar quando suas opções estiverem disponíveis:

```tsx
// Após os hooks existentes (~linha 98)
const representantesLoaded = representantes.length > 0 || !formData.representanteId;
const rotasLoaded = rotasEntrega.length > 0 || !formData.rotaEntregaId;
const categoriasEstLoaded = categoriasEstabelecimento.length > 0 || !formData.categoriaEstabelecimentoId;
```

Para cada Select de ID, adicionar um fallback que mostra o valor atual enquanto as opções não carregaram:

**Representante (~linha 531-545)**: Se `formData.representanteId` existe mas `representantes` está vazio, mostrar um Input disabled com o nome do representante (lookup do array quando disponível) ou "Carregando...":

```tsx
{representantes.length === 0 && formData.representanteId ? (
  <Input value="Carregando..." disabled className="bg-muted" />
) : (
  <Select value={formData.representanteId?.toString() || undefined} ...>
    ...
  </Select>
)}
```

Aplicar o mesmo padrão para **Rota de Entrega** e **Categoria do Estabelecimento**.

### Alteração 2: Forçar re-render quando opções carregam

Adicionar um `key` no Select que muda quando as opções carregam, forçando o Radix Select a re-avaliar o valor:

```tsx
<Select 
  key={`rep-${representantes.length}`}
  value={formData.representanteId?.toString() || undefined}
  ...
>
```

Aplicar o mesmo padrão para os outros selects baseados em ID:
- Rota de Entrega: `key={`rota-${rotasEntrega.length}`}`
- Categoria Estabelecimento: `key={`cat-${categoriasEstabelecimento.length}`}`

Esta é a correção mais simples e confiável — força o React a remontar o Select quando as opções ficam disponíveis, garantindo que o valor controlado seja corretamente associado ao SelectItem correspondente.

## Resumo

Duas mudanças complementares:
1. **Fallback de loading** para evitar que o usuário veja selects vazios
2. **Key dinâmica** nos selects para forçar re-mount quando opções carregam

