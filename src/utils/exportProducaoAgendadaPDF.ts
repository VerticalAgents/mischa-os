import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DiaProducaoAgendada } from '@/hooks/useProducaoAgendada';
import type { ValidacaoDia } from '@/hooks/useValidacaoInsumosProducaoAgendada';

export function exportProducaoAgendadaPDF(
  dias: DiaProducaoAgendada[],
  validacoes: Map<string, ValidacaoDia>,
  options: { print?: boolean } = {}
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Planejamento de Produção Agendada', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    margin,
    y
  );
  doc.setTextColor(0);
  y += 20;

  let totalFormas = 0;
  let totalUnidades = 0;

  dias.forEach((dia) => {
    if (y > 760) {
      doc.addPage();
      y = margin;
    }
    const validacao = validacoes.get(dia.data);
    const statusLabel =
      validacao?.status === 'faltante'
        ? 'INSUMOS INSUFICIENTES'
        : validacao?.status === 'sem_receita'
        ? 'SEM RECEITA CADASTRADA'
        : 'INSUMOS OK';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(dia.dataFormatada, margin, y);

    // status badge color
    if (validacao?.status === 'faltante') doc.setTextColor(200, 30, 30);
    else if (validacao?.status === 'sem_receita') doc.setTextColor(180, 120, 0);
    else doc.setTextColor(20, 140, 60);
    doc.setFontSize(9);
    doc.text(statusLabel, pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(0);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `${dia.totalFormas} formas · ${dia.totalUnidades} unidades · ${dia.registros.length} registro(s)`,
      margin,
      y + 8
    );
    doc.setTextColor(0);
    y += 14;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Produto', 'Formas', 'Rend.', 'Unidades']],
      body: dia.registros.map((r) => [
        r.produto_nome,
        String(r.formas_producidas),
        r.rendimento_usado ? `${r.rendimento_usado}/forma` : '—',
        String(r.unidades),
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [234, 179, 8], textColor: [0, 0, 0] },
      theme: 'striped',
    });
    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 6;

    if (validacao?.insumosFaltantes?.length) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(200, 30, 30);
      doc.text('Insumos faltantes:', margin, y);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      y += 12;
      validacao.insumosFaltantes.forEach((f) => {
        if (y > 800) {
          doc.addPage();
          y = margin;
        }
        doc.text(
          `• ${f.nome}: necessário ${f.necessario.toFixed(2)} ${f.unidade}, disponível ${f.disponivel.toFixed(2)} ${f.unidade} (falta ${f.faltante.toFixed(2)} ${f.unidade})`,
          margin + 8,
          y
        );
        y += 11;
      });
    }

    y += 14;
    totalFormas += dia.totalFormas;
    totalUnidades += dia.totalUnidades;
  });

  if (y > 760) {
    doc.addPage();
    y = margin;
  }
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `Total geral: ${totalFormas} formas · ${totalUnidades} unidades`,
    margin,
    y
  );

  if (options.print) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl') as unknown as string;

    // Embute o PDF num iframe oculto e dispara o print do navegador.
    // Evita popup blockers (Brave/Chrome) que barram window.open de blob:.
    const existing = document.getElementById('__print_iframe__') as HTMLIFrameElement | null;
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = '__print_iframe__';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // último fallback: salvar
        doc.save(`producao-agendada-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    };
  } else {
    doc.save(`producao-agendada-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}