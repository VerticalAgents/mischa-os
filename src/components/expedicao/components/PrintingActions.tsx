
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PrintingActionsProps {
  activeSubTab: string;
  pedidosPadrao: any[];
  pedidosAlterados: any[];
  pedidosProximoDia: any[];
  todosPedidos: any[];
}

export const PrintingActions = ({ 
  activeSubTab, 
  pedidosPadrao, 
  pedidosAlterados, 
  pedidosProximoDia, 
  todosPedidos 
}: PrintingActionsProps) => {
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const imprimirListaSeparacao = () => {
    let listaAtual: any[] = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
      tipoLista = "Pedidos Padrão";
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
      tipoLista = "Pedidos Alterados";
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDia;
      tipoLista = "Próximas Separações";
    } else {
      listaAtual = todosPedidos;
      tipoLista = "Todos os Pedidos";
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    let printContent = `
      <html>
        <head>
          <title>Lista de Separação - ${tipoLista}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { text-align: center; margin-bottom: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .produtos-lista { font-size: 11px; line-height: 1.3; }
            .produto-item { margin-bottom: 2px; display: flex; justify-content: space-between; }
            .produto-nome { flex: 1; }
            .produto-qtd { font-weight: bold; margin-left: 10px; }
            .total-geral { border-top: 1px solid #ccc; padding-top: 2px; margin-top: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista de Separação - ${tipoLista}</h1>
            <p>Data de impressão: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
            <p>Total de pedidos: ${listaAtual.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Cliente</th>
                <th style="width: 15%;">Data Entrega</th>
                <th style="width: 10%;">Tipo</th>
                <th style="width: 40%;">Produtos e Quantidades</th>
                <th style="width: 10%;">Total</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      
      // Filtrar produtos com quantidade maior que 0
      const produtosFiltrados = produtos.filter((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        return quantidade > 0;
      });
      
      const produtosParaExibir = produtosFiltrados.length > 0 ? produtosFiltrados : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '<div class="produtos-lista">';
      produtosParaExibir.forEach((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        produtosHtml += `
          <div class="produto-item">
            <span class="produto-nome">${item.nome || item.produto || item.sabor || 'Produto'}</span>
            <span class="produto-qtd">${quantidade}</span>
          </div>
        `;
      });
      
      if (produtosParaExibir.length > 1) {
        produtosHtml += `
          <div class="produto-item total-geral">
            <span class="produto-nome">TOTAL</span>
            <span class="produto-qtd">${pedido.quantidade_total}</span>
          </div>
        `;
      }
      
      produtosHtml += '</div>';
      
      printContent += `
        <tr>
          <td><strong>${pedido.cliente_nome}</strong></td>
          <td>${formatDate(new Date(pedido.data_prevista_entrega))}</td>
          <td>${pedido.tipo_pedido}</td>
          <td>${produtosHtml}</td>
          <td style="text-align: center; font-weight: bold;">${pedido.quantidade_total}</td>
        </tr>
      `;
    });
    
    // Adicionar resumo total
    const totalGeral = listaAtual.reduce((sum, pedido) => sum + pedido.quantidade_total, 0);
    
    printContent += `
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAL GERAL:</td>
                <td style="text-align: center; font-size: 14px;">${totalGeral}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;
    
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframe.style.height = "0px";
        iframe.style.width = "0px";
        iframe.style.position = "absolute";
        
        iframeWindow.document.open();
        iframeWindow.document.write(printContent);
        iframeWindow.document.close();
        
        setTimeout(() => {
          iframeWindow.print();
          toast.success("A lista de separação foi enviada para impressão.");
        }, 500);
      }
    }
  };
  
  const imprimirEtiquetas = () => {
    let listaAtual: any[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para gerar etiquetas nesta categoria.");
      return;
    }
    
    let printContent = `
      <html>
        <head>
          <title>Etiquetas de Pedidos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .etiqueta {
              width: 4in;
              height: 2.5in;
              padding: 0.2in;
              margin: 0.1in;
              border: 1px dashed #aaa;
              page-break-inside: avoid;
              display: inline-block;
              box-sizing: border-box;
            }
            .cliente { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .data { margin-bottom: 5px; font-size: 12px; }
            .produtos { font-size: 10px; margin-bottom: 5px; max-height: 0.8in; overflow: hidden; }
            .produto-linha { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-etiqueta { font-size: 12px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 2px; }
            .detalhes { font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
    `;
    
    listaAtual.forEach(pedido => {
      const produtos = pedido.itens_personalizados || [];
      
      // Filtrar produtos com quantidade maior que 0
      const produtosFiltrados = produtos.filter((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        return quantidade > 0;
      });
      
      const produtosParaExibir = produtosFiltrados.length > 0 ? produtosFiltrados : [
        { nome: "Distribuição Padrão", quantidade: pedido.quantidade_total }
      ];
      
      let produtosHtml = '';
      produtosParaExibir.forEach((item: any) => {
        const quantidade = item.quantidade || item.quantidade_sabor || 0;
        produtosHtml += `
          <div class="produto-linha">
            <span>${(item.nome || item.produto || item.sabor || 'Produto').substring(0, 25)}</span>
            <span>${quantidade}</span>
          </div>
        `;
      });
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente_nome}</div>
          <div class="data">Entrega: ${formatDate(new Date(pedido.data_prevista_entrega))}</div>
          <div class="produtos">${produtosHtml}</div>
          <div class="total-etiqueta">Total: ${pedido.quantidade_total} unidades</div>
          <div class="detalhes">Pedido - ${pedido.tipo_pedido}</div>
        </div>
      `;
    });
    
    printContent += `
        </body>
      </html>
    `;
    
    if (printFrameRef.current) {
      const iframe = printFrameRef.current;
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        iframe.style.height = "0px";
        iframe.style.width = "0px";
        iframe.style.position = "absolute";
        
        iframeWindow.document.open();
        iframeWindow.document.write(printContent);
        iframeWindow.document.close();
        
        setTimeout(() => {
          iframeWindow.print();
          toast.success("As etiquetas foram enviadas para impressão.");
        }, 500);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card Lista de Separação */}
      <Card className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
            onClick={imprimirListaSeparacao}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500 hover:bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10">
              <Printer className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-left space-y-2">
            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors text-left">
              Lista de Separação
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium text-left">
              Imprime lista organizada para separação de pedidos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
            <span className="font-semibold text-left">Imprimir Lista</span>
            <Printer className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>

      {/* Card Etiquetas */}
      <Card className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
            onClick={imprimirEtiquetas}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-green-500 hover:bg-green-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10">
              <FileText className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-left space-y-2">
            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors text-left">
              Etiquetas de Pedidos
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium text-left">
              Gera etiquetas individuais para cada pedido
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
            <span className="font-semibold text-left">Imprimir Etiquetas</span>
            <FileText className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
      
      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />
    </div>
  );
};
