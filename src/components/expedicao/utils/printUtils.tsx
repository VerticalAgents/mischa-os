
import { Pedido } from "@/types";
import { formatDate } from "@/lib/utils";

/**
 * Creates content for printing a list of pedidos for separation
 */
export const createPrintListContent = (pedidos: Pedido[], tipoLista: string) => {
  if (pedidos.length === 0) return null;
  
  let printContent = `
    <html>
      <head>
        <title>Lista de Separação - ${tipoLista}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { text-align: center; }
          .header { text-align: center; margin-bottom: 20px; }
          .data { font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lista de Separação - ${tipoLista}</h1>
          <p>Data de impressão: ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total Unidades</th>
              <th>Data Entrega</th>
              <th>Sabores</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  pedidos.forEach(pedido => {
    const itensPedidoArray = pedido.itensPedido || [];
    const sabores = itensPedidoArray.map((item: any) => 
      `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
    ).join(", ");
    
    printContent += `
      <tr>
        <td>${pedido.cliente?.nome || "Pedido Único"}</td>
        <td>${pedido.totalPedidoUnidades || 0}</td>
        <td>${formatDate(new Date(pedido.dataPrevistaEntrega))}</td>
        <td>${sabores}</td>
      </tr>
    `;
  });
  
  printContent += `
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  return printContent;
};

/**
 * Creates content for printing etiquetas (labels) for pedidos
 */
export const createPrintEtiquetasContent = (pedidos: Pedido[]) => {
  if (pedidos.length === 0) return null;
  
  let printContent = `
    <html>
      <head>
        <title>Etiquetas de Pedidos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .etiqueta {
            width: 4in;
            height: 2in;
            padding: 0.2in;
            margin: 0.1in;
            border: 1px dashed #aaa;
            page-break-inside: avoid;
            display: inline-block;
            box-sizing: border-box;
          }
          .cliente { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .data { margin-bottom: 5px; }
          .unidades { margin-bottom: 5px; }
          .detalhes { font-size: 12px; }
          .sabores { font-size: 11px; }
        </style>
      </head>
      <body>
  `;
  
  pedidos.forEach(pedido => {
    const itensPedidoArray = pedido.itensPedido || [];
    const sabores = itensPedidoArray.map((item: any) => 
      `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
    ).join(", ");
    
    printContent += `
      <div class="etiqueta">
        <div class="cliente">${pedido.cliente?.nome || "Pedido Único"}</div>
        <div class="data">Entrega: ${formatDate(new Date(pedido.dataPrevistaEntrega))}</div>
        <div class="unidades">Total: ${pedido.totalPedidoUnidades || 0} unidades</div>
        <div class="detalhes">Pedido #${pedido.id} - ${pedido.tipoPedido || "Padrão"}</div>
        <div class="sabores">${sabores}</div>
      </div>
    `;
  });
  
  printContent += `
      </body>
    </html>
  `;
  
  return printContent;
};

/**
 * Prints content in a hidden iframe
 */
export const printContent = (iframe: HTMLIFrameElement | null, content: string): void => {
  if (!iframe) return;
  
  const iframeWindow = iframe.contentWindow;
  if (iframeWindow) {
    iframe.style.height = "0px";
    iframe.style.width = "0px";
    iframe.style.position = "absolute";
    
    iframeWindow.document.open();
    iframeWindow.document.write(content);
    iframeWindow.document.close();
    
    setTimeout(() => {
      iframeWindow.print();
    }, 500);
  }
};
