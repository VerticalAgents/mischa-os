
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SecurePrintingActionsProps {
  pedidos: any[];
  onPrintSuccess?: () => void;
}

export function SecurePrintingActions({ pedidos, onPrintSuccess }: SecurePrintingActionsProps) {
  const handlePrint = () => {
    try {
      // Create a secure print window without using document.write
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Erro de Impressão",
          description: "Não foi possível abrir janela de impressão. Verifique o bloqueador de pop-ups.",
          variant: "destructive"
        });
        return;
      }

      // Create secure HTML content
      const printContent = createSecurePrintContent(pedidos);
      
      // Use innerHTML instead of document.write for better security
      printWindow.document.documentElement.innerHTML = printContent;
      
      // Wait for content to load before printing
      printWindow.addEventListener('load', () => {
        printWindow.print();
        printWindow.close();
      });

      // Fallback for older browsers
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      onPrintSuccess?.();
      
      toast({
        title: "Impressão Iniciada",
        description: "Documento enviado para impressão com sucesso"
      });
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        title: "Erro de Impressão",
        description: "Não foi possível imprimir o documento",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Printer size={16} />
      Imprimir Pedidos
    </Button>
  );
}

function createSecurePrintContent(pedidos: any[]): string {
  // Sanitize and escape content to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const printStyles = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .pedido { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
      .pedido-header { background-color: #f5f5f5; padding: 10px; margin: -15px -15px 15px -15px; }
      .item { margin-bottom: 10px; }
      .total { font-weight: bold; margin-top: 15px; }
      @media print { 
        body { margin: 0; }
        .pedido { page-break-inside: avoid; }
      }
    </style>
  `;

  const headerContent = `
    <div class="header">
      <h1>Pedidos de Expedição</h1>
      <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
  `;

  const pedidosContent = pedidos.map(pedido => `
    <div class="pedido">
      <div class="pedido-header">
        <h3>Cliente: ${escapeHtml(pedido.cliente_nome || 'N/A')}</h3>
        <p>Data: ${escapeHtml(pedido.data_proxima_reposicao || 'N/A')}</p>
      </div>
      <div class="itens">
        ${pedido.itens_personalizados?.map((item: any) => `
          <div class="item">
            ${escapeHtml(item.produto_nome || 'Produto')}: ${escapeHtml(String(item.quantidade || 0))} unidades
          </div>
        `).join('') || '<div class="item">Sem itens</div>'}
      </div>
      <div class="total">
        Total: ${escapeHtml(String(pedido.quantidade_total || 0))} unidades
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedidos de Expedição</title>
      ${printStyles}
    </head>
    <body>
      ${headerContent}
      ${pedidosContent}
    </body>
    </html>
  `;
}
