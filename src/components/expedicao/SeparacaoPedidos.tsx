
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const SeparacaoPedidos = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<string>("padrao");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  // Fix: Use individual selectors instead of calling the function directly
  const pedidos = usePedidoStore(state => state.pedidos);
  const updatePedidoStatus = usePedidoStore(state => state.atualizarPedido);
  
  // Filtrar pedidos em separação/agendados e separá-los por tipo
  const pedidosPadrao = pedidos.filter(p => 
    (p.statusPedido === "Agendado" || p.statusPedido === "Em Separação") && 
    p.tipoPedido === "Padrão"
  );
  
  const pedidosAlterados = pedidos.filter(p => 
    (p.statusPedido === "Agendado" || p.statusPedido === "Em Separação") && 
    p.tipoPedido === "Alterado"
  );
  
  // Ordenar pedidos pelo tamanho do pacote (total de unidades)
  const pedidosPadraoOrdenados = [...pedidosPadrao].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  const pedidosAlteradosOrdenados = [...pedidosAlterados].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);

  // Nova função para confirmar separação
  const confirmarSeparacaoPedido = (idPedido: number) => {
    updatePedidoStatus(idPedido, { statusPedido: "Em Separação" });
    toast({
      title: "Separação confirmada",
      description: "O pedido foi movido para a fila de despacho.",
    });
  };

  // Função para imprimir lista de separação
  const imprimirListaSeparacao = () => {
    const listaAtual = activeSubTab === "padrao" ? pedidosPadraoOrdenados : pedidosAlteradosOrdenados;
    if (listaAtual.length === 0) {
      toast({
        title: "Sem pedidos para separação",
        description: "Não há pedidos para separar nesta categoria.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar conteúdo para impressão
    let printContent = `
      <html>
        <head>
          <title>Lista de Separação - ${activeSubTab === "padrao" ? "Pedidos Padrão" : "Pedidos Alterados"}</title>
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
            <h1>Lista de Separação - ${activeSubTab === "padrao" ? "Pedidos Padrão" : "Pedidos Alterados"}</h1>
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
    
    listaAtual.forEach(pedido => {
      const sabores = pedido.itensPedido.map(item => `${item.sabor?.nome}: ${item.quantidadeSabor}`).join(", ");
      
      printContent += `
        <tr>
          <td>${pedido.cliente?.nome || "Pedido Único"}</td>
          <td>${pedido.totalPedidoUnidades}</td>
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
    
    // Criar iframe para impressão
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
          toast({
            title: "Impressão iniciada",
            description: "A lista de separação foi enviada para impressão."
          });
        }, 500);
      }
    }
  };
  
  // Função para imprimir etiquetas
  const imprimirEtiquetas = () => {
    const listaAtual = activeSubTab === "padrao" ? pedidosPadraoOrdenados : pedidosAlteradosOrdenados;
    if (listaAtual.length === 0) {
      toast({
        title: "Sem pedidos para etiquetagem",
        description: "Não há pedidos para gerar etiquetas nesta categoria.",
        variant: "destructive"
      });
      return;
    }
    
    // Criar conteúdo para impressão de etiquetas
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
    
    listaAtual.forEach(pedido => {
      const sabores = pedido.itensPedido.map(item => `${item.sabor?.nome}: ${item.quantidadeSabor}`).join(", ");
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente?.nome || "Pedido Único"}</div>
          <div class="data">Entrega: ${formatDate(new Date(pedido.dataPrevistaEntrega))}</div>
          <div class="unidades">Total: ${pedido.totalPedidoUnidades} unidades</div>
          <div class="detalhes">Pedido #${pedido.id} - ${pedido.tipoPedido}</div>
          <div class="sabores">${sabores}</div>
        </div>
      `;
    });
    
    printContent += `
        </body>
      </html>
    `;
    
    // Criar iframe para impressão
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
          toast({
            title: "Impressão de etiquetas iniciada",
            description: "As etiquetas foram enviadas para impressão."
          });
        }, 500);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={imprimirListaSeparacao} size="sm" variant="outline" className="flex items-center gap-1">
              <Printer className="h-4 w-4" /> Imprimir Lista
            </Button>
            <Button onClick={imprimirEtiquetas} size="sm" variant="outline" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Imprimir Etiquetas
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="padrao" 
          value={activeSubTab}
          onValueChange={setActiveSubTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="padrao">Pedidos Padrão</TabsTrigger>
            <TabsTrigger value="alterados">Pedidos Alterados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="padrao">
            {pedidosPadraoOrdenados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sabores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosPadraoOrdenados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => `${item.sabor?.nome}: ${item.quantidadeSabor}`).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmarSeparacaoPedido(pedido.id)}
                          className="flex items-center gap-1"
                          disabled={pedido.statusPedido === "Em Separação"}
                        >
                          <Check className="h-4 w-4" />
                          {pedido.statusPedido === "Em Separação" ? "Separado" : "Confirmar Separação"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos padrão para separação.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alterados">
            {pedidosAlteradosOrdenados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sabores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosAlteradosOrdenados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => `${item.sabor?.nome}: ${item.quantidadeSabor}`).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmarSeparacaoPedido(pedido.id)}
                          className="flex items-center gap-1"
                          disabled={pedido.statusPedido === "Em Separação"}
                        >
                          <Check className="h-4 w-4" />
                          {pedido.statusPedido === "Em Separação" ? "Separado" : "Confirmar Separação"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos alterados para separação.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />
    </div>
  );
};
