# Inadimplência: links corretos para o GestãoClick

## O que está errado hoje
O ícone monta `app.gestaoclick.com/vendas/visualizar/{id}`, que não é uma página válida. Pela URL que você enviou, o padrão real é o domínio `gestaoclick.com` com o **id interno da venda** e o **id da loja** como parâmetros.

A resolução do id já funciona (validado na API): a descrição do título é sempre `Venda de nº {codigo}` e `GET /vendas?codigo={codigo}` devolve `id` (ex.: `3547` → `376906865`) e `hash`.

## O que vou fazer

### 1. Dois ícones por título
Em cada título expandido, no lugar do ícone único:
- **Recebimentos da venda** (ícone de nota/recibo) → abre
  `https://gestaoclick.com/financeiro/movimentacoes_financeiras/index_recebimento/?venda={vendaId}&loja={lojaId}`
  (padrão confirmado por você).
- **Venda** (ícone de link externo) → abre a venda usando o mesmo domínio e o `loja` na query.

Cada botão tem seu próprio estado de carregamento e tooltip.

### 2. Nada de URL "chutada" no código
Os dois caminhos ficam como **templates configuráveis** salvos em `integracoes_config.config` (`url_recebimentos_venda`, `url_venda`), com os padrões acima já preenchidos e placeholders `{vendaId}`, `{lojaId}`, `{hash}`. Se o caminho da venda estiver diferente no seu GestãoClick, basta ajustar o template na tela de integração — sem alterar código. O `loja_id` já está salvo na configuração (467630).

### 3. Resolução de venda mais robusta
- Extrair o código com regex ancorada em `Venda de nº (\d+)` (em vez de "qualquer número"), com fallback para o primeiro número da descrição.
- Títulos sem venda vinculada (ex.: "Ressarcimento Doce de Leite Nahuel") não mostram os ícones — ficam com um aviso discreto "sem venda vinculada" em vez de erro.
- Cache do mapeamento código → id da venda durante a sessão, para não refazer a chamada ao reabrir o mesmo cliente.
- Mensagens de erro claras quando a API não encontra a venda.

### 4. Validação
Depois de implementar, testo a resolução do id via a função e te aviso para clicar em um título: o link de recebimentos deve abrir exatamente a tela que você enviou.

## Detalhes técnicos
- `supabase/functions/gestaoclick-proxy/index.ts`: `buscar_venda_por_codigo` passa a retornar também `loja_id` da venda (fallback para o `loja_id` da config).
- `src/components/gestao-financeira/InadimplenciaPanel.tsx`: dois botões, cache em `useRef`/react-query, montagem da URL a partir dos templates.
- Sem mudanças de banco além da leitura de `integracoes_config`.
