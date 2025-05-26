import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { toast } from "sonner";
import { Printer, FileText, Check, Undo } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const SeparacaoPedidos = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("todos");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  const {
    pedidos,
    isLoading,
    confirmarSeparacao,
    desfazerSeparacao,
    marcarTodosSeparados,
    getPedidosParaSeparacao,
    getPedidosProximoDia
  } = useExpedicaoStore();

  // Usar hook de sincronização
  const { carregarPedidos } = useExpedicaoSync();

  // Carregar pedidos ao montar o componente
  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  
  // Obter pedidos filtrados
  const pedidosParaSeparacao = getPedidosParaSeparacao();
  const pedidosProximoDia = getPedidosProximoDia();
  
  // Separar por tipo (assumindo que todos são padrão por enquanto)
  const pedidosPadrao = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Padrão");
  const pedidosAlterados = pedidosParaSeparacao.filter(p => p.tipo_pedido === "Alterado");
  
  // Lista combinada para "todos"
  const todosPedidos = [...pedidosPadrao, ...pedidosAlterados];

  const marcarTodosComoSeparados = async () => {
    let listaAtual: any[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadrao;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlterados;
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDia;
    } else {
      listaAtual = todosPedidos;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    await marcarTodosSeparados(listaAtual);
  };

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
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    listaAtual.forEach(pedido => {
      printContent += `
        <tr>
          <td>${pedido.cliente_nome}</td>
          <td>${pedido.quantidade_total}</td>
          <td>${formatDate(new Date(pedido.data_prevista_entrega))}</td>
          <td>${pedido.tipo_pedido}</td>
        </tr>
      `;
    });
    
    printContent += `
            </tbody>
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
          </style>
        </head>
        <body>
    `;
    
    listaAtual.forEach(pedido => {
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente_nome}</div>
          <div class="data">Entrega: ${formatDate(new Date(pedido.data_prevista_entrega))}</div>
          <div class="unidades">Total: ${pedido.quantidade_total} unidades</div>
          <div class="detalhes">Pedido #${pedido.id} - ${pedido.tipo_pedido}</div>
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Carregando pedidos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={marcarTodosComoSeparados} 
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
          defaultValue="todos" 
          value={activeSubTab}
          onValueChange={setActiveSubTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos os Pedidos ({todosPedidos.length})</TabsTrigger>
            <TabsTrigger value="padrao" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> Pedidos Padrão ({pedidosPadrao.length})
            </TabsTrigger>
            <TabsTrigger value="alterados" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Pedidos Alterados ({pedidosAlterados.length})
            </TabsTrigger>
            <TabsTrigger value="proximos" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> Próximas Separações ({pedidosProximoDia.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            {todosPedidos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todosPedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente_nome}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.tipo_pedido === "Padrão" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {pedido.tipo_pedido}
                        </span>
                      </TableCell>
                      <TableCell>{pedido.quantidade_total}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.data_prevista_entrega))}</TableCell>
                      <TableCell>
                        <StatusBadge status="Agendado" />
                        {pedido.substatus_pedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatus_pedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatus_pedido === "Separado" ? (
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
                              onClick={() => confirmarSeparacao(pedido.id)}
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
                Não há pedidos agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          
          <TabsContent value="padrao">
            {pedidosPadrao.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosPadrao.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente_nome}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.data_prevista_entrega))}</TableCell>
                      <TableCell>{pedido.quantidade_total}</TableCell>
                      <TableCell>
                        <StatusBadge status="Agendado" />
                        {pedido.substatus_pedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatus_pedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatus_pedido === "Separado" ? (
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
                              onClick={() => confirmarSeparacao(pedido.id)}
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
                Não há pedidos padrão agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alterados">
            {pedidosAlterados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosAlterados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente_nome}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.data_prevista_entrega))}</TableCell>
                      <TableCell>{pedido.quantidade_total}</TableCell>
                      <TableCell>
                        <StatusBadge status="Agendado" />
                        {pedido.substatus_pedido && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({pedido.substatus_pedido})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {pedido.substatus_pedido === "Separado" ? (
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
                              onClick={() => confirmarSeparacao(pedido.id)}
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
                Não há pedidos alterados agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="proximos">
            {pedidosProximoDia.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosProximoDia.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente_nome}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.data_prevista_entrega))}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.tipo_pedido === "Padrão" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {pedido.tipo_pedido}
                        </span>
                      </TableCell>
                      <TableCell>{pedido.quantidade_total}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => confirmarSeparacao(pedido.id)}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Confirmar Separação Antecipada
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos pendentes para separação antecipada.
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
