

# Fix: "Número da venda já está sendo utilizado" no GestaoClick

## Problema

Ao tentar gerar venda para "Argentum Investimentos", a Edge Function falha porque o código sequencial da venda já está em uso. Os logs mostram:

- A API retorna `2060` como último código
- Mas códigos `2061` até `2066` já existem (provavelmente criados em massa recentemente)
- O sistema tenta 5 vezes (2061→2066) e esgota as tentativas

Isso indica que a query `GET /vendas?limite=1&ordenar_por=codigo&ordem=desc` não retorna o código mais alto real — possivelmente porque vendas recentes ainda não aparecem na listagem, ou a ordenação é alfabética em vez de numérica.

## Solução

Duas mudanças na Edge Function `gestaoclick-proxy/index.ts`:

### 1. Aumentar limite da consulta e buscar maior código corretamente

Na função `getProximoCodigoVenda` (~linha 70), buscar mais resultados para garantir que pegamos o maior código real:

```ts
// De: limite=1
// Para: limite=50 e pegar o maior numericamente
const response = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?limite=50&ordenar_por=codigo&ordem=desc`, ...);
```

Depois iterar os resultados e pegar o `Math.max()` dos códigos numéricos, em vez de confiar que o primeiro é o maior (a ordenação pode ser alfabética: "999" > "2060").

### 2. Aumentar maxRetries de 5 para 20

Em ambos os blocos de retry (~linhas 731 e 1051):

```ts
const maxRetries = 20; // era 5
```

Isso dá margem para cenários de criação em massa onde muitos códigos sequenciais são ocupados simultaneamente.

### 3. Melhorar mensagem de erro

Quando esgota as tentativas, retornar mensagem mais clara ao usuário indicando o problema de código duplicado, em vez do genérico "Erro 400".

