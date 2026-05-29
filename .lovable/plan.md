## Objetivo

1. Trocar a exportação XLSX por **PDF aberto em nova aba** (visualização no navegador, sem download forçado).
2. Adicionar um campo **"Margem de segurança (%)"** ao lado da seleção de cobertura, aplicando esse acréscimo no cálculo do necessário/a comprar/custo.

## Mudanças

### `src/hooks/useListaComprasAutomatica.ts`
- `gerar(coberturaDias, margemPct = 0)` passa a aceitar a margem.
- Aplicar margem no `necessario`: `necessario = medioSemanal * (cobertura/7) * (1 + margem/100)`.
- `aComprar`, `custoTotal` e `totalCompra` recalculam naturalmente em cima disso.
- Expor `margemUsada` no retorno (pra usar no PDF/cabeçalho).

### `src/components/estoque/tabs/NecessidadeInsumosTab.tsx`
- Novo estado `margem` (number, default 0) com um `<Input type="number" min=0 max=100>` ao lado dos botões de cobertura, com label "Margem de segurança (%)".
- `handleGerar` passa `margem` para `gerar`.
- Substituir `handleExportar` (XLSX) por `handleExportarPDF` usando **jsPDF + jspdf-autotable** (já no projeto se disponível; senão `bun add jspdf jspdf-autotable`):
  - Gerar o PDF em memória, `doc.output('bloburl')`, abrir com `window.open(url, '_blank')`.
  - Cabeçalho: título "Lista de Compras", data, cobertura `Xd`, margem `Y%`, total estimado.
  - Tabela: Insumo, Consumo/semana, Estoque, Necessário, A comprar, Custo total.
  - Ícone do botão muda para `FileText` e label "Abrir PDF".

### Detalhes técnicos
- Verificar se `jspdf` já existe no projeto (`utils/exportProducaoAgendadaPDF.ts` provavelmente já usa). Reusar a mesma lib pra manter consistência.
- A margem só afeta o cálculo a partir do clique em "Gerar lista" (mesma UX dos botões de cobertura).
- Popup blockers: como `window.open` é disparado dentro de um onClick síncrono (gerando o PDF antes), funciona normalmente.

## Não muda
- Lógica de janela de 28 dias, rendimentos, produtos ignorados.
- Layout da tabela na tela.
