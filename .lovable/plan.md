## Objetivo

Flexibilizar o prazo de pagamento do cliente para:
1. Aplicar também ao **PIX** (hoje só aparece para Boleto, e PIX é hardcoded em +1 dia).
2. Permitir **digitar o prazo em dias** (input numérico livre), além das opções padrão.
3. Adicionar um novo **tipo de prazo "Próximo dia da semana após N dias"** (ex.: primeira segunda-feira ≥ 7 dias após a entrega).

## Mudanças no banco (clientes)

Adicionar 3 colunas em `public.clientes` (não destrutivo, defaults preservam comportamento atual):

- `prazo_pagamento_tipo text not null default 'dias'` — valores: `'dias'` | `'proximo_dia_semana'`.
- `prazo_pagamento_dia_semana smallint` — 0=Domingo … 6=Sábado (usado só quando tipo = `proximo_dia_semana`).
- `prazo_pagamento_dias_minimos smallint` — dias mínimos antes do próximo dia da semana (usado só quando tipo = `proximo_dia_semana`).

A coluna existente `prazo_pagamento_dias` continua sendo usada quando tipo = `'dias'`.

## Mudanças no formulário do cliente (`ClienteFormDialog.tsx`)

Na seção financeira, substituir o `Select` atual de prazo por um bloco condicional que aparece quando `formaPagamento` for **Boleto OU PIX**:

1. Select "Tipo de prazo":
   - "Dias corridos após a entrega"
   - "Próximo dia da semana após N dias"
2. Se tipo = "Dias corridos":
   - `Input type="number"` livre (placeholder 7), com sugestões rápidas (chips: 7 / 14 / 21 / 28) que apenas preenchem o input.
3. Se tipo = "Próximo dia da semana":
   - Select "Dia da semana" (Dom…Sáb).
   - `Input type="number"` "Dias mínimos antes" (ex.: 7).
   - Texto explicativo: *"Ex.: entrega na sexta + 7 dias mínimos → vence na 2ª segunda-feira."*

Atualizar tipos (`src/types/index.ts`), defaults (`utils/clienteDataSanitizer.ts`) e mapeamento camelCase ↔ snake_case para incluir os 3 novos campos.

## Mudanças no cálculo de vencimento

`src/components/expedicao/gestaoclick/useGerarDocumentoVenda.ts` → `calcularDataVencimento`:

- `DINHEIRO` → mantém (entrega).
- `PIX` e `BOLETO` → mesma lógica baseada nos novos campos:
  - tipo `'dias'` → `addDays(entrega, prazo_pagamento_dias)`.
  - tipo `'proximo_dia_semana'` → partindo de `addDays(entrega, dias_minimos)`, avançar até cair em `dia_semana`.

Propagar os novos campos por:
- `gestaoclick/types.ts` (`VendaGC`).
- `GestaoClickTab.tsx` (select do cliente e montagem do payload da venda).

Atualizar os rótulos exibidos no PDF/checkout que hoje dizem `Boleto (N dias)` para refletir o tipo escolhido (ex.: `Boleto (toda segunda-feira, mín. 7 dias)`).

## Compatibilidade

- Clientes existentes: `prazo_pagamento_tipo = 'dias'` por default → comportamento idêntico ao atual.
- PIX antigo (hardcoded +1 dia): novos clientes/edição passam a respeitar o campo; clientes não tocados continuam com `prazoPagamentoDias` default 7 — **vou setar o default migrado para 1 apenas quando `forma_pagamento = 'PIX'` e o campo estiver nulo**, para não mudar vencimentos já existentes silenciosamente.

## Fora de escopo

- Não alterar UI de Expedição/GestãoClick além da propagação dos campos.
- Não alterar regras de negócio do agendamento, separação, despacho ou impressão.

## Detalhes técnicos

```text
calcularDataVencimento(venda):
  base = entrega
  if forma == DINHEIRO: return base
  if tipo == 'dias':
    return base + prazo_dias
  if tipo == 'proximo_dia_semana':
    d = base + dias_minimos
    while weekday(d) != dia_semana: d += 1
    return d
```

Arquivos a tocar: migration em `clientes`; `ClienteFormDialog.tsx`; `types/index.ts`; `utils/clienteDataSanitizer.ts`; `gestaoclick/types.ts`; `gestaoclick/useGerarDocumentoVenda.ts`; `expedicao/GestaoClickTab.tsx`.
