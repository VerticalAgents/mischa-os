import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { toast } from "sonner";
import { Printer, FileText, Check, Undo } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { addBusinessDays, isWeekend, isSameDay } from "date-fns";

// Helper function to get the next business day
const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addBusinessDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

// Interface para pedidos virtuais baseados em agendamentos
interface PedidoVirtual {
  id: string;
  cliente: {
    id: string;
    nome: string;
  };
  totalPedidoUnidades: number;
  dataPrevistaEntrega: Date;
  tipoPedido: "Padrão" | "Alterado";
  statusPedido: "Agendado";
  substatusPedido: "Agendado" | "Separado";
  itensPedido: Array<{
    nomeSabor: string;
    quantidadeSabor: number;
  }>;
}

export const SeparacaoPedidos = () => {
  const [activeSubTab, setActiveSubTab] = useState<string>("todos");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  const { clientes } = useClienteStore();
  const { salvarAgendamento } = useAgendamentoClienteStore();
  
  // Get today's date with time set to beginning of day for comparison
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Calculate next business day
  const proximoDiaUtil = getProximoDiaUtil(hoje);
  
  // Converter agendamentos em pedidos virtuais para HOJE
  const pedidosHoje: PedidoVirtual[] = clientes
    .filter(cliente => {
      if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
      
      const dataReposicao = new Date(cliente.proximaDataReposicao);
      dataReposicao.setHours(0, 0, 0, 0);
      
      return cliente.statusAgendamento === "Agendado" && isSameDay(dataReposicao, hoje);
    })
    .map(cliente => ({
      id: `agendamento-${cliente.id}`,
      cliente: {
        id: cliente.id,
        nome: cliente.nome
      },
      totalPedidoUnidades: cliente.quantidadePadrao || 0,
      dataPrevistaEntrega: cliente.proximaDataReposicao!,
      tipoPedido: "Padrão" as const,
      statusPedido: "Agendado" as const,
      substatusPedido: (cliente.statusAgendamento === "Separado" ? "Separado" : "Agendado") as "Agendado" | "Separado",
      itensPedido: [
        // Simulação de distribuição de sabores - em produção viria de uma distribuição real
        { nomeSabor: "Brigadeiro", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.4) },
        { nomeSabor: "Beijinho", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.3) },
        { nomeSabor: "Bicho-de-pé", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.3) }
      ].filter(item => item.quantidadeSabor > 0)
    }));
  
  // Separar pedidos de hoje por tipo
  const pedidosPadraoHoje = pedidosHoje.filter(p => p.tipoPedido === "Padrão");
  const pedidosAlteradosHoje = pedidosHoje.filter(p => p.tipoPedido === "Alterado");

  // Converter agendamentos em pedidos virtuais para o PRÓXIMO DIA ÚTIL
  const pedidosProximoDia: PedidoVirtual[] = clientes
    .filter(cliente => {
      if (cliente.statusCliente !== "Ativo" || !cliente.proximaDataReposicao) return false;
      
      const dataReposicao = new Date(cliente.proximaDataReposicao);
      dataReposicao.setHours(0, 0, 0, 0);
      
      return cliente.statusAgendamento === "Agendado" && 
             isSameDay(dataReposicao, proximoDiaUtil) && 
             cliente.statusAgendamento !== "Separado";
    })
    .map(cliente => ({
      id: `agendamento-${cliente.id}`,
      cliente: {
        id: cliente.id,
        nome: cliente.nome
      },
      totalPedidoUnidades: cliente.quantidadePadrao || 0,
      dataPrevistaEntrega: cliente.proximaDataReposicao!,
      tipoPedido: "Padrão" as const,
      statusPedido: "Agendado" as const,
      substatusPedido: "Agendado" as "Agendado" | "Separado",
      itensPedido: [
        { nomeSabor: "Brigadeiro", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.4) },
        { nomeSabor: "Beijinho", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.3) },
        { nomeSabor: "Bicho-de-pé", quantidadeSabor: Math.floor((cliente.quantidadePadrao || 0) * 0.3) }
      ].filter(item => item.quantidadeSabor > 0)
    }));
  
  // Ordenar pedidos pelo tamanho do pacote (total de unidades)
  const pedidosPadraoOrdenados = [...pedidosPadraoHoje].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  const pedidosAlteradosOrdenados = [...pedidosAlteradosHoje].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  const pedidosProximoDiaOrdenados = [...pedidosProximoDia].sort((a, b) => a.totalPedidoUnidades - b.totalPedidoUnidades);
  
  // Lista combinada para a subaba "Todos os Pedidos" (apenas pedidos de hoje)
  const todosPedidosHoje = [
    ...pedidosPadraoOrdenados,
    ...pedidosAlteradosOrdenados
  ];

  const confirmarSeparacaoPedido = async (idPedido: string) => {
    try {
      // Extrair o ID do cliente do ID do pedido virtual
      const clienteId = idPedido.replace('agendamento-', '');
      const cliente = clientes.find(c => c.id === clienteId);
      
      if (!cliente) {
        toast.error("Cliente não encontrado");
        return;
      }

      // Atualizar o status no agendamento
      await salvarAgendamento(clienteId, {
        status_agendamento: 'Separado',
        data_proxima_reposicao: cliente.proximaDataReposicao!,
        quantidade_total: cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      toast.success("Separação confirmada para " + cliente.nome);
    } catch (error) {
      console.error('Erro ao confirmar separação:', error);
      toast.error("Erro ao confirmar separação");
    }
  };
  
  const desfazerSeparacao = async (idPedido: string) => {
    try {
      const clienteId = idPedido.replace('agendamento-', '');
      const cliente = clientes.find(c => c.id === clienteId);
      
      if (!cliente) {
        toast.error("Cliente não encontrado");
        return;
      }

      await salvarAgendamento(clienteId, {
        status_agendamento: 'Agendado',
        data_proxima_reposicao: cliente.proximaDataReposicao!,
        quantidade_total: cliente.quantidadePadrao || 0,
        tipo_pedido: 'Padrão'
      });

      toast.success("Separação desfeita para " + cliente.nome);
    } catch (error) {
      console.error('Erro ao desfazer separação:', error);
      toast.error("Erro ao desfazer separação");
    }
  };
  
  const marcarTodosSeparados = async () => {
    let listaAtual: PedidoVirtual[] = [];
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDiaOrdenados;
    } else {
      listaAtual = todosPedidosHoje;
    }
    
    if (listaAtual.length === 0) {
      toast.error("Não há pedidos para separar nesta categoria.");
      return;
    }
    
    try {
      for (const pedido of listaAtual) {
        if (pedido.substatusPedido !== "Separado") {
          await confirmarSeparacaoPedido(pedido.id);
        }
      }
      
      toast.success(`${listaAtual.length} pedidos foram marcados como Separados.`);
    } catch (error) {
      console.error('Erro na separação em massa:', error);
      toast.error("Erro na separação em massa");
    }
  };

  const imprimirListaSeparacao = () => {
    let listaAtual: PedidoVirtual[] = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
      tipoLista = "Pedidos Padrão";
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
      tipoLista = "Pedidos Alterados";
    } else if (activeSubTab === "proximos") {
      listaAtual = pedidosProximoDiaOrdenados;
      tipoLista = "Próximas Separações";
    } else {
      listaAtual = todosPedidosHoje;
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
                <th>Sabores</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    listaAtual.forEach(pedido => {
      const sabores = pedido.itensPedido.map(item => 
        `${item.nomeSabor}: ${item.quantidadeSabor}`
      ).join(", ");
      
      printContent += `
        <tr>
          <td>${pedido.cliente.nome}</td>
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
    let listaAtual: PedidoVirtual[] = [];
    let tipoLista = "";
    
    if (activeSubTab === "padrao") {
      listaAtual = pedidosPadraoOrdenados;
    } else if (activeSubTab === "alterados") {
      listaAtual = pedidosAlteradosOrdenados;
    } else {
      listaAtual = todosPedidosHoje;
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
            .sabores { font-size: 11px; }
          </style>
        </head>
        <body>
    `;
    
    listaAtual.forEach(pedido => {
      const sabores = pedido.itensPedido.map(item => 
        `${item.nomeSabor}: ${item.quantidadeSabor}`
      ).join(", ");
      
      printContent += `
        <div class="etiqueta">
          <div class="cliente">${pedido.cliente.nome}</div>
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
          defaultValue="todos" 
          value={activeSubTab}
          onValueChange={setActiveSubTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos os Pedidos ({todosPedidosHoje.length})</TabsTrigger>
            <TabsTrigger value="padrao" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span> Pedidos Padrão ({pedidosPadraoOrdenados.length})
            </TabsTrigger>
            <TabsTrigger value="alterados" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span> Pedidos Alterados ({pedidosAlteradosOrdenados.length})
            </TabsTrigger>
            <TabsTrigger value="proximos" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> Próximas Separações ({pedidosProximoDiaOrdenados.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            {todosPedidosHoje.length > 0 ? (
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
                  {todosPedidosHoje.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente.nome}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.tipoPedido === "Padrão" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
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
                          `${item.nomeSabor}: ${item.quantidadeSabor}`
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
                Não há pedidos agendados para hoje.
              </div>
            )}
          </TabsContent>
          
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
                      <TableCell>{pedido.cliente.nome}</TableCell>
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
                          `${item.nomeSabor}: ${item.quantidadeSabor}`
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
                Não há pedidos padrão agendados para hoje.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alterados">
            <div className="text-center py-6 text-muted-foreground">
              Não há pedidos alterados agendados para hoje.
            </div>
          </TabsContent>
          
          <TabsContent value="proximos">
            {pedidosProximoDiaOrdenados.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total Unidades</TableHead>
                    <TableHead>Sabores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosProximoDiaOrdenados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente.nome}</TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pedido.tipoPedido === "Padrão" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {pedido.tipoPedido}
                        </span>
                      </TableCell>
                      <TableCell>{pedido.totalPedidoUnidades}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {pedido.itensPedido.map(item => 
                          `${item.nomeSabor}: ${item.quantidadeSabor}`
                        ).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" 
                            size="sm"
                            onClick={() => confirmarSeparacaoPedido(pedido.id)}
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
