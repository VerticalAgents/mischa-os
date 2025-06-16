
import { useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface NecessidadeDiaria {
  data: Date;
  produtosPorData: Record<string, number>;
}

interface ProdutoComCategoria {
  nome: string;
  categoria: string;
  categoriaId: number;
}

export const useExportacaoNecessidadeDiaria = () => {
  
  // Exportar para Excel
  const exportarExcel = useCallback((
    necessidadeDiaria: NecessidadeDiaria[], 
    produtosAtivos: ProdutoComCategoria[]
  ) => {
    try {
      if (necessidadeDiaria.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      // Criar dados para o Excel
      const dadosExcel: any[] = [];
      
      // Cabeçalhos
      const cabecalhos = [
        'Produto',
        'Categoria',
        ...necessidadeDiaria.map(dia => format(dia.data, 'dd/MM')),
        'Total'
      ];
      dadosExcel.push(cabecalhos);

      // Dados dos produtos
      produtosAtivos.forEach(produto => {
        const linha = [
          produto.nome,
          produto.categoria,
          ...necessidadeDiaria.map(dia => dia.produtosPorData[produto.nome] || 0),
          necessidadeDiaria.reduce((sum, dia) => sum + (dia.produtosPorData[produto.nome] || 0), 0)
        ];
        dadosExcel.push(linha);
      });

      // Criar workbook
      const ws = XLSX.utils.aoa_to_sheet(dadosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Necessidade Diária');

      // Aplicar formatação básica
      const range = XLSX.utils.decode_range(ws['!ref']!);
      
      // Definir larguras das colunas
      ws['!cols'] = [
        { width: 25 }, // Produto
        { width: 15 }, // Categoria
        ...Array(necessidadeDiaria.length).fill({ width: 8 }), // Dias
        { width: 10 } // Total
      ];

      // Salvar arquivo
      XLSX.writeFile(wb, `necessidade-diaria-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast.success('Dados exportados para Excel!');
    } catch (error) {
      console.error('Erro na exportação Excel:', error);
      toast.error('Erro ao exportar para Excel');
    }
  }, []);

  // Exportar para PDF
  const exportarPDF = useCallback((
    necessidadeDiaria: NecessidadeDiaria[], 
    produtosAtivos: ProdutoComCategoria[]
  ) => {
    try {
      if (necessidadeDiaria.length === 0) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para mais espaço
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título
      doc.setFontSize(16);
      doc.text('Necessidade Diária de Produção', 20, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30);
      
      // Cabeçalhos da tabela
      let yPosition = 50;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      // Definir colunas
      const colProduto = 20;
      const colCategoria = 60;
      const colWidth = 15;
      let xPosition = colCategoria + 30;
      
      doc.text('Produto', colProduto, yPosition);
      doc.text('Categoria', colCategoria, yPosition);
      
      // Cabeçalhos dos dias
      necessidadeDiaria.slice(0, 10).forEach((dia, index) => { // Limitar a 10 dias para caber na página
        doc.text(format(dia.data, 'dd/MM'), xPosition + (index * colWidth), yPosition);
      });
      
      doc.text('Total', xPosition + (10 * colWidth), yPosition);
      
      // Linha separadora
      doc.line(20, yPosition + 2, 280, yPosition + 2);
      yPosition += 8;
      
      // Dados dos produtos
      doc.setFont('helvetica', 'normal');
      
      produtosAtivos.forEach((produto, produtoIndex) => {
        if (yPosition > 180) { // Nova página se necessário
          doc.addPage();
          yPosition = 20;
        }
        
        // Nome do produto (truncado se muito longo)
        const nomeProduto = produto.nome.length > 20 ? produto.nome.substring(0, 20) + '...' : produto.nome;
        doc.text(nomeProduto, colProduto, yPosition);
        
        // Categoria
        const categoria = produto.categoria.length > 12 ? produto.categoria.substring(0, 12) + '...' : produto.categoria;
        doc.text(categoria, colCategoria, yPosition);
        
        // Quantidades por dia
        necessidadeDiaria.slice(0, 10).forEach((dia, index) => {
          const quantidade = dia.produtosPorData[produto.nome] || 0;
          doc.text(quantidade.toString(), xPosition + (index * colWidth), yPosition);
        });
        
        // Total
        const total = necessidadeDiaria.reduce((sum, dia) => sum + (dia.produtosPorData[produto.nome] || 0), 0);
        doc.text(total.toString(), xPosition + (10 * colWidth), yPosition);
        
        yPosition += 6;
        
        // Linha separadora a cada 5 registros
        if ((produtoIndex + 1) % 5 === 0) {
          doc.line(20, yPosition, 280, yPosition);
          yPosition += 3;
        }
      });
      
      // Rodapé
      const totalPaginas = doc.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${totalPaginas}`, 20, 200);
        doc.text(`Total de produtos: ${produtosAtivos.length}`, 220, 200);
      }
      
      // Salvar arquivo
      doc.save(`necessidade-diaria-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.success('Dados exportados para PDF!');
    } catch (error) {
      console.error('Erro na exportação PDF:', error);
      toast.error('Erro ao exportar para PDF');
    }
  }, []);

  return {
    exportarExcel,
    exportarPDF
  };
};
