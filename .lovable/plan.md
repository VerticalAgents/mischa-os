## Objetivo

Refazer a aba **Setup** do PCP para virar uma única tela coerente: definir **como o Estoque Alvo é calculado**, com 3 modos exclusivos. Esses parâmetros passam a alimentar o card "Sugestão de Produção".

Os "parâmetros de produção" que estavam na seção (unidades/forma, formas/lote, fornada, tempo, % previstos) **vão ser removidos** da aba Setup — eles realmente são ilhas e nem são usados pelo cálculo de sugestão. Continuam acessíveis em Configurações → Produção, sem mudança.

---

## Os 3 modos de Estoque Alvo

O usuário escolhe **um** modo via radio/tabs. Cada modo tem seu painel de configuração:

### 1. Fixo por produto
- Lista de produtos ativos.
- Para cada produto: input numérico "Estoque alvo (un)".
- Default = 0 (configurar manualmente).
- Cálculo: `alvo = valor_configurado_do_produto`.

### 2. % da média histórica (variável)
- Input único: "Percentual da média semanal (%)".
- Default = 20 (equivalente ao comportamento atual).
- Cálculo: `alvo = round(média_semanal × percentual / 100)`.

### 3. Cobertura por dias (já existente)
- Input único: "Cobertura alvo (dias)".
- Default = 3.
- Cálculo: `alvo = round(média_semanal × dias / 7)`.

---

## UI

`SetupPCPTab.tsx` reescrito com um único Card "Estoque Alvo":
- Header com `RadioGroup` em 3 cards-toggle clicáveis (modo selecionado tem borda primária).
- Abaixo, painel correspondente ao modo selecionado:
  - Modo 1 → tabela compacta `produto | input` (lista produtos ativos).
  - Modo 2 → input + preview "Para um produto com média 70 un/sem → alvo 14 un".
  - Modo 3 → input + preview equivalente.
- **Botão "Salvar Setup"** no rodapé, sempre visível (single submit que aplica modo + parâmetros).
- Pequeno alerta informativo: "O alvo definido aqui é usado pela Sugestão de Produção (Dashboard → Sugestão de Produção)."

Remover as seções "Parâmetros de Produção" (campos de fornada, lote, etc.) e "Cobertura alvo isolada" da aba Setup.

---

## Persistência

Hoje `useConfigStore` é Zustand **em memória** (perde no refresh). Vou:
- Adicionar `persist` middleware (localStorage `pcp-setup-v1`) para guardar o setup.
- Estender `ConfiguracoesProducao` (em `src/types/index.ts`):
  ```ts
  estoqueAlvoModo: 'fixo' | 'percentual' | 'cobertura';
  estoqueAlvoPercentual: number;          // default 20
  estoqueAlvoCoberturaDias: number;       // default 3 (renomeado de coberturaAlvoDias)
  estoqueAlvoFixoPorProduto: Record<string, number>;  // produto_id → unidades
  ```
- Migrar `coberturaAlvoDias` → `estoqueAlvoCoberturaDias` (manter compat lendo o campo antigo se existir).
- O store persiste **somente** os campos do setup do PCP (não os mocks legados).

---

## Aplicação no cálculo (`SugestaoProducao.tsx`)

Substituir a fórmula única atual por:
```ts
const modo = config.estoqueAlvoModo ?? 'cobertura';
let estoque_alvo = 0;
if (modo === 'fixo') {
  estoque_alvo = config.estoqueAlvoFixoPorProduto?.[produto.id] ?? 0;
} else if (modo === 'percentual') {
  estoque_alvo = Math.round(media_vendas * (config.estoqueAlvoPercentual ?? 20) / 100);
} else {
  estoque_alvo = Math.round(media_vendas * (config.estoqueAlvoCoberturaDias ?? 3) / 7);
}
```

Subtítulo do card descreve dinamicamente o modo ativo:
- "Alvo fixo por produto"
- "Alvo: 20% da média semanal"
- "Alvo: cobrir 3 dias de demanda"

---

## Arquivos a editar / criar

- `src/types/index.ts` — adicionar os 4 campos novos em `ConfiguracoesProducao`.
- `src/data/configData.ts` — incluir defaults nos mocks.
- `src/hooks/useConfigStore.ts` — adicionar `persist` middleware + defaults novos.
- `src/components/configuracoes/tabs/ProducaoTab.tsx` — incluir os campos novos no schema/save (manter paridade, sem expor UI nova ali).
- `src/components/pcp/SetupPCPTab.tsx` — **reescrito** (modo único, 3 opções, botão salvar).
- `src/components/pcp/SugestaoProducao.tsx` — usar o modo selecionado no cálculo + subtítulo dinâmico.

## Detalhes técnicos

- Lista de produtos ativos no modo "fixo" reaproveita a query já feita em `SugestaoProducao` (produtos_finais ativos). Vou extrair para um pequeno hook `useProdutosFinaisAtivos` ou simplesmente refazer o fetch dentro do componente (mesmo padrão do existente).
- Salvar é uma única ação que grava o objeto completo no `useConfigStore` → persist no localStorage → o `SugestaoProducao` reage por estar lendo do mesmo store.
- Sem mudanças no Supabase / DB.
- Não toco no Dashboard nem nas outras abas do PCP.
