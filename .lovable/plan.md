## Auditoria de Estoque - Folha Imprimível

Criar uma folha de auditoria imprimível para contagem física de insumos e produtos, com posterior ajuste no sistema.

### 1. Renomear aba "Pedidos de Compra" → "Contagem de Estoque"

**Arquivos:**
- `src/pages/EstoqueInsumos.tsx` — alterar label "Compras" → manter "Compras" (já é a aba pai). A sub-aba é a interna.
- `src/components/estoque/tabs/PedidosTab.tsx` — renomear sub-aba `"pedidos"` para "Contagem de Estoque" com ícone `ClipboardCheck`. Substituir o conteúdo "Em Desenvolvimento" pelo novo componente de auditoria.

### 2. Novo componente `AuditoriaEstoqueTab.tsx`

Localização: `src/components/estoque/tabs/AuditoriaEstoqueTab.tsx`

Conteúdo da tela (visualização):
- Card explicativo do fluxo: imprimir → contar → ajustar.
- Filtros: incluir/excluir insumos, incluir/excluir produtos prontos, ordenar por categoria.
- Botão **"Imprimir folha de auditoria"** (ícone `Printer`).
- Botão secundário **"Lançar contagem"** (ajuste em massa) — opcional, pode ficar como "em breve" para manter o escopo focado em impressão.

### 3. Folha imprimível (HTML print)

Implementação: abrir nova janela com layout otimizado para impressão A4 retrato, usando `window.open` + template HTML (padrão `SecurePrint`-like, mas controlado).

**Cabeçalho:**
- Título: "Auditoria de Estoque"
- Data da contagem (campo em branco para preenchimento manual)
- Responsável (campo em branco)

**Seção INSUMOS** — tabela:
| # | Insumo | Categoria | Estoque sistema | Unidade | Contagem física (kg) | Comprar? | Obs |
|---|--------|-----------|-----------------|---------|----------------------|----------|-----|

- Coluna "Estoque sistema": valor atual convertido para Kg quando aplicável (g→kg, ml→l mantém como referência).
- Coluna "Contagem física (kg)": linha em branco para preenchimento.
- Coluna "Comprar?": checkbox vazio (`☐`).
- Linhas com altura confortável para escrita manual (~28px).

**Seção PRODUTOS PRONTOS** — tabela:
| # | Produto | Categoria | Estoque sistema (un) | Contagem física (un) | Comprar? | Obs |

- Agrupado por categoria com subtítulos.
- Apenas produtos ativos.

**Rodapé:**
- Espaço para assinatura do responsável e do conferente.
- CSS `@media print` para remover margens desnecessárias, repetir cabeçalho da tabela em cada página (`thead { display: table-header-group }`).

### 4. Detalhes técnicos

- Hooks reutilizados: `useSupabaseInsumos`, `useEstoqueComExpedicao` (para saldos reais de produtos).
- Conversão kg para insumos: se `unidade_medida === 'g'` → dividir por 1000; `'kg'` → manter; outros → exibir na unidade original com aviso.
- Ordenação: insumos por categoria + nome; produtos por categoria + nome.
- Sanitização: escapar todo conteúdo dinâmico ao montar o HTML da janela de impressão (evitar XSS via nomes de insumos/produtos).

### Arquivos a criar/editar

- **Criar:** `src/components/estoque/tabs/AuditoriaEstoqueTab.tsx`
- **Criar:** `src/utils/auditoriaEstoquePrint.ts` — função `gerarFolhaAuditoria({ insumos, produtos })` que abre a janela de impressão.
- **Editar:** `src/components/estoque/tabs/PedidosTab.tsx` — renomear sub-aba e montar `AuditoriaEstoqueTab`.
- **Editar:** `src/components/estoque/InsumosTabs.tsx` — exportar novo tab se necessário.

### Fora de escopo (confirmar antes)

- Salvar histórico de auditorias no banco.
- Tela de "Lançar contagem" para ajuste em massa direto no sistema (atualmente o ajuste seria feito manualmente via tela de movimentação existente).
