

# Correcao: Dropdown "Tipo de Logistica" zerando cadastro do cliente

## Causa raiz identificada

O problema esta no `sanitizeClienteData` em `src/utils/clienteDataSanitizer.ts`. O sanitizador tem uma lista **hardcoded** de apenas 2 tipos de logistica validos:

```text
LOGISTICA_TO_CANONICAL = {
  'Própria': 'PROPRIA',
  'Terceirizada': 'TERCEIRIZADA'
}
VALID_LOGISTICA = ['PROPRIA', 'TERCEIRIZADA']
```

Porem, a tabela `tipos_logistica` no banco de dados permite que o usuario cadastre tipos customizados (como "Distribuicao", "Retirada pelo cliente", etc.). Quando o usuario seleciona um tipo que nao esta na lista hardcoded, acontece o seguinte encadeamento:

```text
1. Usuario seleciona "Distribuicao" no dropdown
2. Salva o formulario
3. sanitizeClienteData() recebe tipoLogistica = "Distribuicao"
4. Nao encontra no LOGISTICA_TO_CANONICAL nem no VALID_LOGISTICA
5. Marca isValid = false (linha 343-346)
6. transformClienteToDbRow() detecta isValid = false
7. Ativa "PROTECAO DE ULTIMO RECURSO" (linha 58-84)
8. createSafeClienteDefaults() sobrescreve TODOS os dados com zeros/defaults
9. Dados sao salvos no banco praticamente zerados
10. Unica coisa preservada: nome, endereco, link_google_maps
```

Os console logs confirmam exatamente isso -- a mensagem "PAYLOAD DE ULTIMO RECURSO CRIADO" aparece, e os dados sao zerados (quantidadePadrao: 0, categoriasHabilitadas: [], janelasEntrega: [], etc.).

## Solucao

O sanitizador precisa aceitar qualquer valor de tipo de logistica que nao seja um token problematico (traducao automatica), em vez de rejeitar tudo que nao esta numa lista hardcoded de 2 itens.

## Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/utils/clienteDataSanitizer.ts` | Alterar logica de validacao de `tipoLogistica` para aceitar valores customizados |

## Detalhes tecnicos

### `src/utils/clienteDataSanitizer.ts` - Bloco de logistica (linhas 328-348)

Logica atual (problematica):
```text
Se valor esta em LOGISTICA_CORRECTIONS -> corrige
Se valor esta em LOGISTICA_TO_CANONICAL -> canoniza
Se valor esta em VALID_LOGISTICA -> aceita
SENAO -> rejeita (isValid = false) e usa default "PROPRIA"
```

Nova logica:
```text
Se valor esta em LOGISTICA_CORRECTIONS -> corrige
Se valor esta em LOGISTICA_TO_CANONICAL -> canoniza
Se valor esta em VALID_LOGISTICA -> aceita
SENAO -> aceita o valor como esta (tipo customizado do usuario)
         Registra como correcao informativa, mas NAO marca isValid = false
```

Isso significa que valores como "Distribuicao", "Retirada pelo cliente" ou qualquer outro tipo customizado cadastrado pelo usuario serao aceitos e salvos normalmente, sem acionar a protecao de ultimo recurso.

A mesma correcao sera aplicada aos demais campos que podem ter valores customizados do banco:
- `tipoCobranca` (tipos_cobranca tambem e tabela dinamica)
- `formaPagamento` (formas_pagamento tambem e tabela dinamica)
- `statusCliente` (este pode manter a lista fixa, pois os status sao controlados pelo sistema)

