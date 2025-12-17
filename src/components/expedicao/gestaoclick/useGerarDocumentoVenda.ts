import { jsPDF } from "jspdf";
import { VendaGC } from "./types";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const EMPRESA = {
  nome: "MISCHA'S BAKERY",
  razaoSocial: "LUCCA BALLVERDÚ MILLETO",
  cnpj: "36.448.140/0001-61",
  endereco: "R. Cel. Paulino Teixeira, 35 - Rio Branco, Porto Alegre - RS, 90420-160",
  telefone: "(51) 99212-7961",
  email: "mischasbakery@gmail.com"
};

export function useGerarDocumentoVenda() {
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calcularDataVencimento = (venda: VendaGC): Date => {
    const dataEntrega = parseISO(venda.data_proxima_reposicao);
    
    if (venda.forma_pagamento === 'DINHEIRO') {
      return dataEntrega;
    } else if (venda.forma_pagamento === 'PIX') {
      return addDays(dataEntrega, 1);
    } else {
      // BOLETO
      return addDays(dataEntrega, venda.prazo_pagamento_dias || 7);
    }
  };

  const gerarDocumentoA4 = (venda: VendaGC): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Header - Empresa
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(EMPRESA.nome, margin, yPos);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(EMPRESA.telefone, pageWidth - margin, yPos, { align: "right" });
    
    yPos += 6;
    doc.text(`CNPJ: ${EMPRESA.cnpj}`, margin, yPos);
    
    yPos += 5;
    doc.text(EMPRESA.endereco, margin, yPos);
    
    yPos += 5;
    doc.text(EMPRESA.email, margin, yPos);

    // Linha divisória
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Número do Pedido e Data
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`PEDIDO Nº ${venda.gestaoclick_venda_id}`, margin, yPos);
    
    const dataVenda = venda.gestaoclick_sincronizado_em 
      ? format(parseISO(venda.gestaoclick_sincronizado_em), "dd/MM/yyyy", { locale: ptBR })
      : format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(dataVenda, pageWidth - margin, yPos, { align: "right" });

    yPos += 7;
    const dataEntrega = format(parseISO(venda.data_proxima_reposicao), "dd/MM/yyyy", { locale: ptBR });
    doc.text(`PRAZO DE ENTREGA: ${dataEntrega}`, margin, yPos);

    // Linha divisória
    yPos += 8;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Dados do Cliente
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text(`Razão social: ${venda.cliente_razao_social || venda.cliente_nome}`, margin, yPos);
    yPos += 5;
    doc.text(`Nome fantasia: ${venda.cliente_nome}`, margin, yPos);
    yPos += 5;
    doc.text(`CNPJ/CPF: ${venda.cliente_cnpj_cpf || '-'}`, margin, yPos);
    yPos += 5;
    doc.text(`Endereço: ${venda.cliente_endereco || '-'}`, margin, yPos);
    yPos += 5;
    doc.text(`Telefone: ${venda.cliente_telefone || '-'}`, margin, yPos);

    // Linha divisória
    yPos += 10;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Produtos - Tabela
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUTOS", margin, yPos);

    yPos += 8;
    
    // Cabeçalho da tabela
    const colWidths = [15, 85, 25, 25, 30];
    const colX = [margin, margin + 15, margin + 100, margin + 125, margin + 150];
    
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", colX[0], yPos);
    doc.text("NOME", colX[1], yPos);
    doc.text("QTD", colX[2], yPos);
    doc.text("UNIT", colX[3], yPos);
    doc.text("SUBTOTAL", colX[4], yPos);

    yPos += 8;
    doc.setFont("helvetica", "normal");

    // Linhas da tabela
    venda.itens.forEach((item, index) => {
      doc.text(String(index + 1), colX[0], yPos);
      
      // Truncar nome se muito longo
      const nomeMax = 45;
      const nome = item.produto_nome.length > nomeMax 
        ? item.produto_nome.substring(0, nomeMax) + '...' 
        : item.produto_nome;
      doc.text(nome, colX[1], yPos);
      
      doc.text(String(item.quantidade), colX[2], yPos);
      doc.text(formatarMoeda(item.preco_unitario).replace('R$', '').trim(), colX[3], yPos);
      doc.text(formatarMoeda(item.subtotal).replace('R$', '').trim(), colX[4], yPos);
      
      yPos += 6;
    });

    // Total
    yPos += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`TOTAL: ${formatarMoeda(venda.valor_total)}`, pageWidth - margin, yPos, { align: "right" });

    // Observações (se houver)
    if (venda.observacoes_gerais || venda.observacoes_agendamento) {
      yPos += 10;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVAÇÕES", margin, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      if (venda.observacoes_gerais) {
        doc.text(`Gerais: ${venda.observacoes_gerais}`, margin, yPos);
        yPos += 5;
      }
      if (venda.observacoes_agendamento) {
        doc.text(`Pedido: ${venda.observacoes_agendamento}`, margin, yPos);
        yPos += 5;
      }
    }

    // Trocas a realizar (se houver)
    if (venda.trocas_pendentes && venda.trocas_pendentes.length > 0) {
      yPos += 5;
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TROCAS A REALIZAR", margin, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      venda.trocas_pendentes.forEach((troca) => {
        doc.text(`• ${troca.produto_nome} (${troca.quantidade} un) - ${troca.motivo_nome}`, margin, yPos);
        yPos += 5;
      });
    }

    // Linha divisória
    yPos += 10;
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Dados do Pagamento
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PAGAMENTO", margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const dataVencimento = calcularDataVencimento(venda);
    doc.text(`Vencimento: ${format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
    yPos += 5;
    doc.text(`Valor: ${formatarMoeda(venda.valor_total)}`, margin, yPos);
    yPos += 5;
    
    const formaPgtoLabel = venda.forma_pagamento === 'BOLETO' 
      ? `Boleto (${venda.prazo_pagamento_dias || 7} dias)`
      : venda.forma_pagamento;
    doc.text(`Forma: ${formaPgtoLabel}`, margin, yPos);

    // Linha de assinatura
    yPos += 25;
    doc.line(margin, yPos, margin + 80, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.text("Assinatura do cliente", margin, yPos);

    // Salvar PDF
    const nomeArquivo = `Venda_${venda.gestaoclick_venda_id}_${venda.cliente_nome.replace(/\s+/g, '_').substring(0, 20)}.pdf`;
    doc.save(nomeArquivo);
  };

  const gerarPDFConsolidado = (vendas: VendaGC[]): void => {
    if (vendas.length === 0) return;

    const doc = new jsPDF();
    let isFirstPage = true;

    vendas.forEach((venda) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Header - Empresa
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(EMPRESA.nome, margin, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(EMPRESA.telefone, pageWidth - margin, yPos, { align: "right" });
      
      yPos += 6;
      doc.text(`CNPJ: ${EMPRESA.cnpj}`, margin, yPos);
      
      yPos += 5;
      doc.text(EMPRESA.endereco, margin, yPos);
      
      yPos += 5;
      doc.text(EMPRESA.email, margin, yPos);

      yPos += 8;
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`PEDIDO Nº ${venda.gestaoclick_venda_id}`, margin, yPos);
      
      const dataVenda = venda.gestaoclick_sincronizado_em 
        ? format(parseISO(venda.gestaoclick_sincronizado_em), "dd/MM/yyyy", { locale: ptBR })
        : format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(dataVenda, pageWidth - margin, yPos, { align: "right" });

      yPos += 7;
      const dataEntrega = format(parseISO(venda.data_proxima_reposicao), "dd/MM/yyyy", { locale: ptBR });
      doc.text(`PRAZO DE ENTREGA: ${dataEntrega}`, margin, yPos);

      yPos += 8;
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO CLIENTE", margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      doc.text(`Razão social: ${venda.cliente_razao_social || venda.cliente_nome}`, margin, yPos);
      yPos += 5;
      doc.text(`Nome fantasia: ${venda.cliente_nome}`, margin, yPos);
      yPos += 5;
      doc.text(`CNPJ/CPF: ${venda.cliente_cnpj_cpf || '-'}`, margin, yPos);
      yPos += 5;
      doc.text(`Endereço: ${venda.cliente_endereco || '-'}`, margin, yPos);
      yPos += 5;
      doc.text(`Telefone: ${venda.cliente_telefone || '-'}`, margin, yPos);

      yPos += 10;
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUTOS", margin, yPos);

      yPos += 8;
      
      const colX = [margin, margin + 15, margin + 100, margin + 125, margin + 150];
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 4, pageWidth - margin * 2, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM", colX[0], yPos);
      doc.text("NOME", colX[1], yPos);
      doc.text("QTD", colX[2], yPos);
      doc.text("UNIT", colX[3], yPos);
      doc.text("SUBTOTAL", colX[4], yPos);

      yPos += 8;
      doc.setFont("helvetica", "normal");

      venda.itens.forEach((item, index) => {
        doc.text(String(index + 1), colX[0], yPos);
        
        const nomeMax = 45;
        const nome = item.produto_nome.length > nomeMax 
          ? item.produto_nome.substring(0, nomeMax) + '...' 
          : item.produto_nome;
        doc.text(nome, colX[1], yPos);
        
        doc.text(String(item.quantidade), colX[2], yPos);
        doc.text(venda.itens[index].preco_unitario.toFixed(2).replace('.', ','), colX[3], yPos);
        doc.text(venda.itens[index].subtotal.toFixed(2).replace('.', ','), colX[4], yPos);
        
        yPos += 6;
      });

      yPos += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`TOTAL: R$ ${venda.valor_total.toFixed(2).replace('.', ',')}`, pageWidth - margin, yPos, { align: "right" });

      yPos += 10;
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO PAGAMENTO", margin, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const dataVencimento = calcularDataVencimento(venda);
      doc.text(`Vencimento: ${format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })}`, margin, yPos);
      yPos += 5;
      doc.text(`Valor: R$ ${venda.valor_total.toFixed(2).replace('.', ',')}`, margin, yPos);
      yPos += 5;
      
      const formaPgtoLabel = venda.forma_pagamento === 'BOLETO' 
        ? `Boleto (${venda.prazo_pagamento_dias || 7} dias)`
        : venda.forma_pagamento;
      doc.text(`Forma: ${formaPgtoLabel}`, margin, yPos);

      yPos += 25;
      doc.line(margin, yPos, margin + 80, yPos);
      yPos += 5;
      doc.setFontSize(9);
      doc.text("Assinatura do cliente", margin, yPos);
    });

    const dataHoje = format(new Date(), "yyyy-MM-dd");
    doc.save(`Documentos_Vendas_${dataHoje}.pdf`);
  };

  return {
    gerarDocumentoA4,
    gerarPDFConsolidado
  };
}
