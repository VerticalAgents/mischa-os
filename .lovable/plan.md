## Objetivo

1. **Redefinir o conceito de "Estoque Alvo"**: passa a ser o estoque que se quer ter ao **fechar a fábrica na sexta** (= estoque com que a semana abre, cobrindo seg-qua sem produção).
2. **Limpar o card `SugestaoProducao`** para ficar muito mais legível.
3. **Criar uma nova aba "Setup" no PCP** para configurar os parâmetros usados pelo próprio PCP, sem precisar ir em Configurações.

---

## Parte 1 — Novo conceito de Estoque Alvo

Hoje (`SugestaoProducao.tsx` linhas 116-135) o alvo é hardcoded: `20% da média de vendas das últimas 12 semanas`. Vou trocar pela seguinte lógica configurável:

**Estoque Alvo do produto = média semanal × `coberturaAlvoDias` / 7**

Onde `coberturaAlvoDias` é um número inteiro de dias que a fábrica quer ter de "colchão" no fechamento da semana (default sugerido: **3 dias**, cobrindo seg/ter/qua). Configurável na nova aba Setup.

Cálculo de produção fica (sem mudança estrutural):
- Se estoque atual < 0 → `producao = |deficit| + alvo`
- Se estoque atual ≥ 0 → `producao = max(0, alvo - estoque_atual)`

---

## Parte 2 — Card "Sugestão de Produção" mais limpo

Reformular `src/components/pcp/SugestaoProducao.tsx`:

### Header
- Manter título e o switch "Apenas com proporção".
- **Remover** a descrição genérica e o `Alert` azul de "estoque alvo de 20%". Substituir por um único subtítulo curto com o parâmetro atual: "Alvo: cobrir X dias após fechamento (= Y un médias)".

### Bloco principal (totalizador)
- Manter o card grande com "Total de Formas a Produzir" e os 3 badges (produzir / sem rendimento / estoque OK).

### Linha por produto (collapsible) — simplificar drasticamente
Hoje tem 4 sub-blocos por produto (Produção Base, Estoque Alvo, Total, com tooltip extra). Reduzir para uma única linha por produto:

```
[Produto X]                              [N formas]
Estoque 12 → alvo 30 · produzir 18 un (÷6 un/forma)
```

- Cabeçalho: nome + badge final de formas (ou "Estoque OK" / "Sem rendimento").
- Subtítulo única linha em texto cinza pequeno: `Estoque {atual} → alvo {alvo} · produzir {qtd} un (÷ {rendimento} un/forma)`.
- Remover ícones Package/Target/Factory duplicados; manter apenas o Factory do header e nada mais.
- Remover o tooltip extra (a info já está visível).
- Remover legenda "(20% média: ...)" porque vira texto da seção.

### Resultado visual
Antes: ~6 linhas/badges por produto. Depois: 2 linhas (header + 1 subtítulo).

---

## Parte 3 — Nova aba "Setup" no PCP

Adicionar em `src/pages/PCP.tsx` uma nova aba `setup` (label "Setup"), entre "Dashboard" e "Projeção de Produção". Dashboard fica como está (placeholder por enquanto).

Criar `src/components/pcp/SetupPCPTab.tsx` com:

### Seção 1 — Estoque Alvo (foco do request)
- Input numérico **"Cobertura alvo (dias)"** — quantos dias de estoque ter no fechamento de sexta (default 3).
- Texto explicativo curto: "Estoque que a fábrica fecha na sexta = estoque que abre na segunda. Cobre seg-qua até a próxima leva."
- Preview ao lado: "Para um produto com média de 70 un/sem, alvo = 30 un".

### Seção 2 — Parâmetros gerais de produção (espelho do que existe em Configurações → Produção)
Reutilizar/duplicar de forma leve os campos de `ProducaoTab.tsx`:
- Unidades por forma
- Formas por lote
- Formas por fornada
- Tempo médio por fornada
- Switch "Incluir pedidos previstos" + percentual

Persistência: usar o `useConfigStore` já existente (`atualizarConfiguracoesProducao`). Assim a edição no PCP-Setup e na tela de Configurações fica espelhada — sem duplicar storage.

### Seção 3 — Estoque mínimo / ideal por produto
Tabela rápida (lista de produtos) com 2 inputs por linha:
- `estoque_minimo` (alerta crítico)
- `estoque_ideal` (opcional, atualmente não usado em SugestaoProducao mas usado em `useEstoqueDisponivel`)

Persistência: `useProdutoStore.atualizarEstoqueMinimo` (já existe) + adicionar handler análogo para `estoque_ideal` se ainda não houver (verificar e estender hook se necessário).

### Persistência de "Cobertura alvo (dias)"
Adicionar campo `coberturaAlvoDias: number` em `ConfiguracoesProducao` (`src/types/index.ts`) e no `useConfigStore`. Default = 3. SugestaoProducao lê esse valor em vez do 20% hardcoded.

---

## Arquivos a editar / criar

- `src/types/index.ts` — adicionar `coberturaAlvoDias` em `ConfiguracoesProducao`.
- `src/hooks/useConfigStore.ts` — incluir default e persistência.
- `src/components/pcp/SugestaoProducao.tsx` — limpar UI + trocar fórmula do alvo para usar `coberturaAlvoDias` × média/7.
- `src/components/configuracoes/tabs/ProducaoTab.tsx` — adicionar campo "Cobertura alvo (dias)" para manter paridade.
- **Novo** `src/components/pcp/SetupPCPTab.tsx` — três seções acima.
- `src/pages/PCP.tsx` — registrar a aba "Setup" (mobile grid e desktop TabsList + TabsContent).

## Detalhes técnicos

- A conversão `coberturaAlvoDias → unidades` é `Math.round(media_vendas_semanal * dias / 7)`.
- Manter retro-compatibilidade: se `coberturaAlvoDias` estiver indefinido na config persistida, usar fallback 3 (~equivalente aos 20% atuais para semana de 5 dias úteis).
- Não tocar no Dashboard (`HistoricoAnalytics`) conforme pedido.
