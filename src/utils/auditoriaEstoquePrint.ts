interface InsumoLinha {
  nome: string;
  categoria: string;
  estoqueSistema: number;
  unidade: string;
  estoqueEmKg: number | null;
}

interface ProdutoLinha {
  nome: string;
  categoria: string;
  estoqueSistema: number;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(n: number, dec = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function agrupar<T extends { categoria: string }>(linhas: T[]): Record<string, T[]> {
  return linhas.reduce((acc, l) => {
    const k = l.categoria || "Sem categoria";
    (acc[k] = acc[k] || []).push(l);
    return acc;
  }, {} as Record<string, T[]>);
}

export function gerarFolhaAuditoria(opts: {
  insumos: InsumoLinha[];
  produtos: ProdutoLinha[];
  incluirInsumos: boolean;
  incluirProdutos: boolean;
}) {
  const { insumos, produtos, incluirInsumos, incluirProdutos } = opts;
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Por favor, permita pop-ups para imprimir.");
    return;
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  const renderInsumos = () => {
    if (!incluirInsumos || insumos.length === 0) return "";
    const grupos = agrupar(insumos);
    const cats = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
    let i = 0;
    const blocos = cats
      .map((cat) => {
        const linhas = grupos[cat]
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((l) => {
            i += 1;
            const sistemaKg = l.estoqueEmKg !== null ? `${fmt(l.estoqueEmKg, 3)} kg` : `${fmt(l.estoqueSistema, 2)} ${escapeHtml(l.unidade)}`;
            return `
              <tr>
                <td class="num">${i}</td>
                <td>${escapeHtml(l.nome)}</td>
                <td class="sistema">${sistemaKg}</td>
                <td class="contagem"></td>
                <td class="check">&#9633;</td>
                <td class="obs"></td>
              </tr>`;
          })
          .join("");
        return `
          <tr class="cat-row"><td colspan="6">${escapeHtml(cat)}</td></tr>
          ${linhas}`;
      })
      .join("");

    return `
      <h2>Insumos</h2>
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Insumo</th>
            <th style="width:110px">Sistema</th>
            <th style="width:130px">Contagem (kg)</th>
            <th style="width:60px">Comprar?</th>
            <th style="width:140px">Observação</th>
          </tr>
        </thead>
        <tbody>${blocos}</tbody>
      </table>`;
  };

  const renderProdutos = () => {
    if (!incluirProdutos || produtos.length === 0) return "";
    const grupos = agrupar(produtos);
    const cats = Object.keys(grupos).sort((a, b) => a.localeCompare(b));
    let i = 0;
    const blocos = cats
      .map((cat) => {
        const linhas = grupos[cat]
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((l) => {
            i += 1;
            return `
              <tr>
                <td class="num">${i}</td>
                <td>${escapeHtml(l.nome)}</td>
                <td class="sistema">${fmt(l.estoqueSistema, 0)} un</td>
                <td class="contagem"></td>
                <td class="check">&#9633;</td>
                <td class="obs"></td>
              </tr>`;
          })
          .join("");
        return `
          <tr class="cat-row"><td colspan="6">${escapeHtml(cat)}</td></tr>
          ${linhas}`;
      })
      .join("");

    return `
      <h2>Produtos prontos</h2>
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Produto</th>
            <th style="width:110px">Sistema</th>
            <th style="width:130px">Contagem (un)</th>
            <th style="width:60px">Comprar?</th>
            <th style="width:140px">Observação</th>
          </tr>
        </thead>
        <tbody>${blocos}</tbody>
      </table>`;
  };

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Auditoria de Estoque</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11px; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 12px; }
  header h1 { font-size: 18px; margin: 0; }
  .meta { font-size: 11px; }
  .meta .linha { margin-top: 4px; }
  .meta .campo { display:inline-block; border-bottom: 1px solid #444; min-width: 140px; height: 14px; margin-left: 4px; }
  h2 { font-size: 13px; margin: 18px 0 6px; padding-bottom: 2px; border-bottom: 1px solid #888; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: middle; font-size: 11px; word-wrap: break-word; }
  th { background: #eee; text-align: left; }
  td.num, td.check, td.sistema { text-align: center; }
  td.contagem, td.obs { height: 26px; }
  td.check { font-size: 16px; }
  tr.cat-row td { background: #f4f4f4; font-weight: bold; font-size: 11px; }
  .assinaturas { display: flex; gap: 40px; margin-top: 28px; page-break-inside: avoid; }
  .assinaturas .col { flex: 1; text-align: center; }
  .assinaturas .linha-ass { border-top: 1px solid #111; margin-top: 40px; padding-top: 4px; font-size: 11px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <header>
    <div>
      <h1>Auditoria de Estoque</h1>
      <div class="meta">Gerado em ${dataHoje}</div>
    </div>
    <div class="meta">
      <div class="linha"><strong>Data da contagem:</strong><span class="campo"></span></div>
      <div class="linha"><strong>Responsável:</strong><span class="campo"></span></div>
    </div>
  </header>

  ${renderInsumos()}
  ${renderProdutos()}

  <div class="assinaturas">
    <div class="col"><div class="linha-ass">Conferente</div></div>
    <div class="col"><div class="linha-ass">Responsável</div></div>
  </div>

  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
