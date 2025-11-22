
import { useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { Cliente } from '@/types';

interface ClienteExportacao extends Cliente {
  statusConfirmacao: string;
  dataReposicao: Date;
  tipoPedido?: string;
  observacoes?: string;
}

export const useExportacao = () => {
  
  // Exportar Entregas para CSV (formato específico para expedição)
  const exportarEntregasCSV = useCallback((entregas: any[], nomeArquivo = 'entregas_expedicao', enderecoPartida?: string) => {
    const headers = [
      '1. Endereço',
      '2. Nome',
      '3. Telefone',
      '4. Bloco/piso'
    ];

    const linhas = [];
    
    // Adicionar cabeçalhos
    linhas.push(headers.join('\t'));
    
    // Adicionar endereço de partida como primeira linha após o cabeçalho
    if (enderecoPartida) {
      linhas.push([
        `"${enderecoPartida}"`,
        `"Fábrica Mischa's Bakery"`,
        `""`,
        `""`
      ].join('\t'));
    }
    
    // Adicionar dados dos clientes
    entregas.forEach(entrega => {
      linhas.push([
        `"${entrega.cliente_endereco || ''}"`,
        `"${entrega.cliente_nome || ''}"`,
        `"${entrega.cliente_telefone || ''}"`,
        `""` // Bloco/piso - campo vazio por enquanto
      ].join('\t'));
    });

    const csvContent = linhas.join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nomeArquivo}_${format(new Date(), 'ddMMyyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);
  
  // Exportar para CSV
  const exportarCSV = useCallback((clientes: ClienteExportacao[], nomeArquivo = 'confirmacao_reposicao') => {
    const headers = [
      'Nome do Cliente',
      'Data Prevista',
      'Status Atual', 
      'Contato',
      'Telefone',
      'Tipo de Pedido',
      'Observações'
    ];

    const csvContent = [
      headers.join(','),
      ...clientes.map(cliente => [
        `"${cliente.nome}"`,
        cliente.dataReposicao ? format(cliente.dataReposicao, 'dd/MM/yyyy') : '',
        `"${cliente.statusConfirmacao}"`,
        `"${cliente.contatoNome || ''}"`,
        `"${cliente.contatoTelefone || ''}"`,
        `"${cliente.tipoPedido || 'Padrão'}"`,
        `"${cliente.observacoes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nomeArquivo}_${format(new Date(), 'ddMMyyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  // Exportar para PDF
  const exportarPDF = useCallback((clientes: ClienteExportacao[], nomeArquivo = 'confirmacao_reposicao') => {
    const doc = new jsPDF();
    
    // Configurar fonte
    doc.setFont('helvetica');
    
    // Título
    doc.setFontSize(16);
    doc.text('Lista de Confirmação de Reposição', 20, 20);
    
    // Data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
    
    // Cabeçalhos da tabela
    let yPosition = 50;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    const colunas = [
      { titulo: 'Cliente', x: 20, width: 50 },
      { titulo: 'Data', x: 70, width: 25 },
      { titulo: 'Status', x: 95, width: 35 },
      { titulo: 'Contato', x: 130, width: 30 },
      { titulo: 'Telefone', x: 160, width: 30 }
    ];
    
    colunas.forEach(col => {
      doc.text(col.titulo, col.x, yPosition);
    });
    
    // Linha separadora
    doc.line(20, yPosition + 2, 190, yPosition + 2);
    yPosition += 8;
    
    // Dados dos clientes
    doc.setFont('helvetica', 'normal');
    
    clientes.forEach((cliente, index) => {
      if (yPosition > 270) { // Nova página se necessário
        doc.addPage();
        yPosition = 20;
      }
      
      const dados = [
        { texto: cliente.nome.length > 25 ? cliente.nome.substring(0, 25) + '...' : cliente.nome, x: 20 },
        { texto: cliente.dataReposicao ? format(cliente.dataReposicao, 'dd/MM/yy') : '', x: 70 },
        { texto: cliente.statusConfirmacao.length > 15 ? cliente.statusConfirmacao.substring(0, 15) + '...' : cliente.statusConfirmacao, x: 95 },
        { texto: (cliente.contatoNome || '').length > 15 ? (cliente.contatoNome || '').substring(0, 15) + '...' : (cliente.contatoNome || ''), x: 130 },
        { texto: cliente.contatoTelefone || '', x: 160 }
      ];
      
      dados.forEach(dado => {
        doc.text(dado.texto, dado.x, yPosition);
      });
      
      yPosition += 6;
      
      // Linha separadora a cada 5 registros
      if ((index + 1) % 5 === 0) {
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 3;
      }
    });
    
    // Rodapé
    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPaginas}`, 20, 290);
      doc.text(`Total de registros: ${clientes.length}`, 150, 290);
    }
    
    // Salvar arquivo
    doc.save(`${nomeArquivo}_${format(new Date(), 'ddMMyyyy')}.pdf`);
  }, []);

  return {
    exportarCSV,
    exportarPDF,
    exportarEntregasCSV
  };
};
