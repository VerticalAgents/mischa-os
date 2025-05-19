
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/common/StatusBadge";
import SubstatusBadge from "@/components/common/SubstatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Truck, Check, Map, Printer, Download } from "lucide-react";

export const Despacho = () => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<string>("agendado");
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<number[]>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  // Use individual selectors instead of calling the function directly
  const pedidos = usePedidoStore(state => state.pedidos);
  const atualizarSubstatusPedido = usePedidoStore(state => state.atualizarSubstatusPedido);
  
  // Filtrar pedidos por substatus
  const pedidosSeparados = pedidos.filter(p => p.substatusPedido === "Separado");
  const pedidosDespachados = pedidos.filter(p => p.substatusPedido === "Despachado");
  const pedidosEntregues = pedidos.filter(p => p.substatusPedido === "Entregue");
  const pedidosRetorno = pedidos.filter(p => p.substatusPedido === "Retorno");
  
  // Agrupar pedidos por rota de entrega (simulação)
  const agruparPorRota = (pedidos: any[]) => {
    return pedidos.reduce((acc: any, pedido) => {
      // Simular a atribuição de rotas com base no id do cliente
      const rotaEntrega = pedido.cliente?.rotaEntregaId || (pedido.idCliente % 3 === 0 ? 'Norte' : pedido.idCliente % 3 === 1 ? 'Sul' : 'Leste');
      
      if (!acc[rotaEntrega]) {
        acc[rotaEntrega] = [];
      }
      acc[rotaEntrega].push(pedido);
      return acc;
    }, {});
  };
  
  const rotasPedidosSeparados = agruparPorRota(pedidosSeparados);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPedidoIds(pedidosSeparados.map(p => p.id));
      setSelectedAll(true);
    } else {
      setSelectedPedidoIds([]);
      setSelectedAll(false);
    }
  };
  
  const handleSelectPedido = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPedidoIds([...selectedPedidoIds, id]);
    } else {
      setSelectedPedidoIds(selectedPedidoIds.filter(pedidoId => pedidoId !== id));
    }
  };
  
  const handleConfirmarDespacho = () => {
    if (selectedPedidoIds.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para despachar.",
        variant: "destructive"
      });
      return;
    }
    
    selectedPedidoIds.forEach(id => {
      atualizarSubstatusPedido(id, "Despachado", "Despacho confirmado em massa");
    });
    
    toast({
      title: "Despacho confirmado",
      description: `${selectedPedidoIds.length} pedidos foram despachados.`,
    });
    
    // Limpar seleção
    setSelectedPedidoIds([]);
    setSelectedAll(false);
  };
  
  const handleConfirmarEntrega = () => {
    if (selectedPedidoIds.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para confirmar entrega.",
        variant: "destructive"
      });
      return;
    }
    
    let contadorAtualizados = 0;
    selectedPedidoIds.forEach(id => {
      const pedido = pedidos.find(p => p.id === id);
      // Fix: Only check if substatusPedido is "Despachado" - this is the only valid state for changing to "Entregue"
      if (pedido && pedido.substatusPedido === "Despachado") {
        atualizarSubstatusPedido(id, "Entregue", "Entrega confirmada em massa");
        contadorAtualizados++;
      }
    });
    
    toast({
      title: "Entrega confirmada",
      description: `${contadorAtualizados} pedidos foram marcados como entregues.`,
    });
    
    // Limpar seleção
    setSelectedPedidoIds([]);
    setSelectedAll(false);
  };
  
  const handleGerarRoteirizacao = () => {
    // Verificar se há pedidos para roteirização
    if (pedidosSeparados.length === 0) {
      toast({
        title: "Sem pedidos para roteirização",
        description: "Não há pedidos separados para gerar roteiros.",
        variant: "destructive"
      });
      return;
    }
    
    // Gerar conteúdo para impressão das rotas
    let printContent = `
      <html>
        <head>
          <title>Roteirização de Entregas</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
            }
            h1 { 
              color: #333; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 10px; 
            }
            h2 { 
              color: #555; 
              margin-top: 20px; 
              background-color: #f9f9f9; 
              padding: 5px; 
              border-radius: 4px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            th, td { 
              padding: 8px; 
              text-align: left; 
              border-bottom: 1px solid #ddd; 
            }
            th { 
              background-color: #f2f2f2; 
            }
            .rota-header { 
              display: flex; 
              align-items: center; 
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .rota-info {
              display: flex;
              flex-direction: column;
            }
            .clientes-count {
              color: #666;
              font-size: 14px;
            }
            .total-unidades {
              font-weight: bold;
              color: #333;
            }
            .page-break {
              page-break-before: always;
            }
            .timestamp {
              color: #888;
              font-size: 12px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <h1>Roteirização de Entregas</h1>
          <div class="timestamp">
            <p>Gerado em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</p>
          </div>
    `;
    
    Object.entries(rotasPedidosSeparados).forEach(([rota, pedidosRota]: [string, any[]]) => {
      // Calcular totais por rota
      const totalUnidades = pedidosRota.reduce((sum, pedido) => sum + pedido.totalPedidoUnidades, 0);
      const totalClientes = pedidosRota.length;
      
      printContent += `
        <h2>Rota: ${rota}</h2>
        <div class="rota-header">
          <div class="rota-info">
            <span class="clientes-count">${totalClientes} clientes</span>
            <span class="total-unidades">Total: ${totalUnidades} unidades</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Endereço</th>
              <th>Qtde. Unidades</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      pedidosRota.forEach(pedido => {
        printContent += `
          <tr>
            <td>${pedido.cliente?.nome || "Pedido sem cliente"}</td>
            <td>${pedido.cliente?.enderecoEntrega || "Sem endereço cadastrado"}</td>
            <td>${pedido.totalPedidoUnidades}</td>
            <td>${pedido.observacoes || ""}</td>
          </tr>
        `;
      });
      
      printContent += `
          </tbody>
        </table>
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
            title: "Impressão iniciada",
            description: "A roteirização foi enviada para impressão."
          });
        }, 500);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Despacho e Entrega</h2>
            <p className="text-muted-foreground">Gerenciamento de pedidos prontos para despacho</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSubTab === "separado" && (
              <>
                <Button 
                  onClick={handleConfirmarDespacho} 
                  size="sm" 
                  className="flex items-center gap-1"
                  disabled={selectedPedidoIds.length === 0}
                >
                  <Truck className="h-4 w-4" /> Confirmar Despacho
                </Button>
                <Button 
                  onClick={handleGerarRoteirizacao} 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                >
                  <Map className="h-4 w-4" /> Gerar Roteirização
                </Button>
              </>
            )}
            {activeSubTab === "despachado" && (
              <Button 
                onClick={handleConfirmarEntrega} 
                size="sm" 
                className="flex items-center gap-1"
                disabled={selectedPedidoIds.length === 0}
              >
                <Check className="h-4 w-4" /> Confirmar Entrega
              </Button>
            )}
            {(activeSubTab === "entregue" || activeSubTab === "retorno") && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1"
              >
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
            )}
            {(activeSubTab === "entregue" || activeSubTab === "retorno") && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> Exportar
              </Button>
            )}
          </div>
        </div>
        
        <Tabs 
          defaultValue="separado" 
          value={activeSubTab}
          onValueChange={(value) => {
            setActiveSubTab(value);
            setSelectedPedidoIds([]);
            setSelectedAll(false);
          }}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="separado">Separados</TabsTrigger>
            <TabsTrigger value="despachado">Despachados</TabsTrigger>
            <TabsTrigger value="entregue">Entregues</TabsTrigger>
            <TabsTrigger value="retorno">Retorno</TabsTrigger>
          </TabsList>
          
          <TabsContent value="separado">
            {pedidosSeparados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedAll} 
                        onCheckedChange={handleSelectAll} 
                      />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosSeparados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPedidoIds.includes(pedido.id)} 
                          onCheckedChange={(checked) => handleSelectPedido(pedido.id, !!checked)} 
                        />
                      </TableCell>
                      <TableCell>{pedido.cliente?.nome || "Cliente não encontrado"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                        {pedido.substatusPedido && pedido.substatusPedido !== pedido.statusPedido && (
                          <SubstatusBadge 
                            substatus={pedido.substatusPedido} 
                            statusPrincipal={pedido.statusPedido}
                            className="ml-2" 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos separados para despacho.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="despachado">
            {pedidosDespachados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedAll} 
                        onCheckedChange={handleSelectAll} 
                      />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosDespachados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPedidoIds.includes(pedido.id)} 
                          onCheckedChange={(checked) => handleSelectPedido(pedido.id, !!checked)} 
                        />
                      </TableCell>
                      <TableCell>{pedido.cliente?.nome || "Cliente não encontrado"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                        {pedido.substatusPedido && pedido.substatusPedido !== pedido.statusPedido && (
                          <SubstatusBadge 
                            substatus={pedido.substatusPedido} 
                            statusPrincipal={pedido.statusPedido}
                            className="ml-2" 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos despachados no momento.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="entregue">
            {pedidosEntregues.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Data Efetiva</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosEntregues.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Cliente não encontrado"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.dataEfetivaEntrega ? formatDate(new Date(pedido.dataEfetivaEntrega)) : 'N/A'}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                        {pedido.substatusPedido && pedido.substatusPedido !== pedido.statusPedido && (
                          <SubstatusBadge 
                            substatus={pedido.substatusPedido} 
                            statusPrincipal={pedido.statusPedido}
                            className="ml-2" 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há entregas confirmadas recentemente.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="retorno">
            {pedidosRetorno.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Motivo Retorno</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosRetorno.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Cliente não encontrado"}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>{pedido.observacoes || "Não especificado"}</TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                        {pedido.substatusPedido && pedido.substatusPedido !== pedido.statusPedido && (
                          <SubstatusBadge 
                            substatus={pedido.substatusPedido} 
                            statusPrincipal={pedido.statusPedido}
                            className="ml-2" 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos com retorno registrado.
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
