
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileText, Check, Undo } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const SeparacaoPedidos = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<string>("padrao");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  // Use individual selectors instead of calling the function directly
  const pedidos = usePedidoStore(state => state.pedidos);
  const atualizarSubstatusPedido = usePedidoStore(state => state.atualizarSubstatusPedido);
  
  // Filtrar pedidos em separação/agendados e separá-los por tipo
  const pedidosPadrao = pedidos.filter(p => 
    (p.statusPedido === "Agendado") && 
    p.tipoPedido === "Padrão"
  );
  
  const pedidosAlterados = pedidos.filter(p => 
    (p.statusPedido === "Agendado") && 
    p.tipoPedido === "Alterado"
  );
  
  // Ordenar pedidos pelo tamanho do pacote (total de unidades)
  const pedidosPadraoOrdenados = [...pedidosPadrao].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  const pedidosAlteradosOrdenados = [...pedidosAlterados].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  
  // Nova lista combinada para a subaba "Todos os Pedidos"
  const todosPedidos = [
    ...pedidosPadraoOrdenados,
    ...pedidosAlteradosOrdenados
  ];

  // Nova função para confirmar separação - Atualiza diretamente para "Separado" conforme requisito
  const confirmarSeparacaoPedido = (idPedido: number) => {
    atualizarSubstatusPedido(idPedido, "Separado", "Separação confirmada manualmente");
    toast({
      title: "Separação confirmada",
      description: "O pedido foi marcado como Separado.",
    });
  };
  
  // Nova função para desfazer a separação
  const desfazerSeparacao = (idPedido: number) => {
    atualizarSubstatusPedido(idPedido, "Agendado", "Separação desfeita manualmente");
    toast({
      title: "Separação desfeita",
      description: "O pedido voltou para o status Agendado.",
    });
  };
  
  // Nova função para marcar todos como separados
  const marcarTodosSeparados = () => {
    let listaAtual: Array<any> = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast({
        title: "Sem pedidos para separação",
        description: "Não há pedidos para separar nesta categoria.",
        variant: "destructive"
      });
      return;
    }
    
    // Confirmar separação de todos os pedidos listados
    listaAtual.forEach(pedido => {
      if (pedido.substatusPedido !== "Separado") {
        atualizarSubstatusPedido(pedido.id, "Separado", "Separação confirmada em massa");
      }
    });
    
    toast({
      title: "Separação em massa concluída",
      description: `${listaAtual.length} pedidos foram marcados como Separados.`,
    });
  };

  // Função para imprimir lista de separação
  const imprimirListaSeparacao = () => {
    let listaAtual: Array<any> = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
      tipoLista = "Pedidos Padrão";
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
      tipoLista = "Pedidos Alterados";
    } else {
      listaAtual = todosPedidos;
      tipoLista = "Todos os Pedidos";
    }
    
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
    
    listaAtual.forEach(pedido => {
      const sabores = pedido.itensPedido.map(item => 
        `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
      ).join(", ");
      
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
    let listaAtual: Array<any> = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
      tipoLista = "Pedidos Padrão";
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
      tipoLista = "Pedidos Alterados";
    } else {
      listaAtual = todosPedidos;
      tipoLista = "Todos os Pedidos";
    }
    
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
      const sabores = pedido.itensPedido.map(item => 
        `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
      ).join(", ");
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente?.nome || "Pedido Único"}</div>
          <div class="data">Entrega: ${formatDate(new Date(pedido.dataPrevistaEntrega))}</div>
          <div class="unidades">Total: ${pedido.totalPedidoUnidades} unidades</div>
          <div class="detalhes">Pedido #${pedido.id} - ${pedido.tipoPedido || "Padrão"}</div>
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
            <Button 
              onClick={marcarTodosSeparados} 
              size="sm" 
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" /> Marcar todos como separados
            </Button>
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
            <TabsTrigger value="todos">Todos os Pedidos</TabsTrigger>
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
                        {pedido.substatusPedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatusPedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => 
                          `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
                        ).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatusPedido === "Separado" ? (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => desfazerSeparacao(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Undo className="h-4 w-4" />
                              Desfazer
                            </Button>
                          ) : (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => confirmarSeparacaoPedido(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Confirmar Separação
                            </Button>
                          )}
                        </div>
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
                        {pedido.substatusPedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatusPedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => 
                          `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
                        ).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatusPedido === "Separado" ? (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => desfazerSeparacao(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Undo className="h-4 w-4" />
                              Desfazer
                            </Button>
                          ) : (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => confirmarSeparacaoPedido(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Confirmar Separação
                            </Button>
                          )}
                        </div>
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
          
          {/* Nova subaba "Todos os Pedidos" */}
          <TabsContent value="todos">
            {todosPedidos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sabores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todosPedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.tipoPedido === "Padrão" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {pedido.tipoPedido}
                        </span>
                      </TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                        {pedido.substatusPedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatusPedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => 
                          `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
                        ).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatusPedido === "Separado" ? (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => desfazerSeparacao(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Undo className="h-4 w-4" />
                              Desfazer
                            </Button>
                          ) : (
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => confirmarSeparacaoPedido(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Confirmar Separação
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos para separação.
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
