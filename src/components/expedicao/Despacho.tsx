
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import SubstatusBadge from "@/components/common/SubstatusBadge";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowRight, Map, Check, Undo, MapPinned, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubstatusPedidoAgendado } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isToday, isYesterday, addDays, format, isBefore } from "date-fns";
import { cn } from "@/lib/utils";

interface DespachoProps {
  tipoFiltro?: 'hoje' | 'proximas' | 'atrasadas';
}

export const Despacho = ({ tipoFiltro = 'hoje' }: DespachoProps) => {
  const [observacao, setObservacao] = useState("");
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [substatusSelecionado, setSubstatusSelecionado] = useState<SubstatusPedidoAgendado | null>(null);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  const {
    pedidos,
    carregarPedidos,
    confirmarDespacho,
    confirmarEntrega,
    confirmarRetorno,
    confirmarDespachoEmMassa,
    getPedidosParaDespacho,
    getPedidosAtrasados
  } = useExpedicaoStore();

  // Carregar pedidos ao montar o componente
  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Get today and tomorrow dates for filtering
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Filter pedidos based on the tab
  const filtrarPedidosPorData = useCallback(() => {
    switch (tipoFiltro) {
      case 'hoje':
        return getPedidosParaDespacho();
      case 'atrasadas':
        return getPedidosAtrasados();
      case 'proximas':
        const proximaData = addDays(hoje, 1);
        return pedidos.filter(p => {
          const dataEntrega = new Date(p.data_prevista_entrega);
          dataEntrega.setHours(0, 0, 0, 0);
          return p.status_agendamento === 'Agendado' && 
                 (p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado') &&
                 dataEntrega > hoje;
        });
      default:
        return [];
    }
  }, [pedidos, tipoFiltro, getPedidosParaDespacho, getPedidosAtrasados, hoje]);

  // Filtrar pedidos em despacho
  const pedidosEmDespacho = filtrarPedidosPorData();

  // Filtrar apenas pedidos separados para exibição no modo roteirização
  const pedidosSeparados = pedidosEmDespacho.filter(p => p.substatus_pedido === "Separado");

  // Filtrar apenas pedidos despachados para entrega
  const pedidosDespachados = pedidosEmDespacho.filter(p => p.substatus_pedido === "Despachado");

  // Função para reagendar um pedido atrasado para hoje
  const reagendarParaHoje = async (pedidoId: string) => {
    // Esta funcionalidade será implementada se necessário
    toast.info("Funcionalidade de reagendamento será implementada");
  };

  // Função para reagendar todos os pedidos atrasados para hoje
  const reagendarTodosParaHoje = async () => {
    toast.info("Funcionalidade de reagendamento em massa será implementada");
  };

  // Função para copiar informações para o WhatsApp
  const copiarInfoEntrega = (pedido: any) => {
    const textoCopia = `
📦 *ENTREGA - ${pedido.cliente_nome}*
📅 Data: ${formatDate(new Date(pedido.data_prevista_entrega))}
📍 Endereço: ${pedido.cliente_endereco || "Endereço não disponível"}
📱 Telefone: ${pedido.cliente_telefone || "Telefone não disponível"}
🧁 Total: ${pedido.quantidade_total} unidades
`;
    navigator.clipboard.writeText(textoCopia);
    toast.success("Informações copiadas para a área de transferência");
  };

  // Função para retornar à separação
  const retornarParaSeparacao = async (idPedido: string) => {
    try {
      // Implementar lógica para retornar à separação
      toast.info("Funcionalidade de retorno à separação será implementada");
    } catch (error) {
      console.error('Erro ao retornar à separação:', error);
      toast.error("Erro ao retornar à separação");
    }
  };

  // Função para despacho em massa
  const confirmarDespachoEmMassaLocal = async () => {
    if (pedidosSeparados.length === 0) {
      toast.error("Não há pedidos com status 'Separado' para despachar.");
      return;
    }

    setIsLoading({...isLoading, despachoMassa: true});

    try {
      await confirmarDespachoEmMassa(pedidosSeparados);
    } catch (error) {
      console.error("Erro ao confirmar despacho em massa:", error);
      toast.error("Ocorreu um erro ao processar os pedidos.");
    } finally {
      setIsLoading({...isLoading, despachoMassa: false});
    }
  };

  // Função para confirmar entrega em massa
  const confirmarEntregaEmMassa = async () => {
    if (pedidosDespachados.length === 0) {
      toast.error("Não há pedidos com status 'Despachado' para entregar.");
      return;
    }

    setIsLoading({...isLoading, entregaMassa: true});

    try {
      for (const pedido of pedidosDespachados) {
        await confirmarEntrega(pedido.id);
      }
      toast.success(`${pedidosDespachados.length} pedidos foram marcados como entregues.`);
    } catch (error) {
      console.error("Erro ao confirmar entrega em massa:", error);
      toast.error("Ocorreu um erro ao processar os pedidos.");
    } finally {
      setIsLoading({...isLoading, entregaMassa: false});
    }
  };

  // Função para obter o valor do progresso baseado no substatus
  const getProgressValue = (substatus: SubstatusPedidoAgendado | undefined): number => {
    switch (substatus) {
      case "Agendado":
        return 20;
      case "Separado":
        return 40;
      case "Despachado":
        return 60;
      case "Entregue":
        return 100;
      case "Retorno":
        return 100;
      default:
        return 0;
    }
  };

  // Função para renderizar o botão de substatus
  const renderBotaoSubstatus = (statusAtual: SubstatusPedidoAgendado | undefined, novoStatus: SubstatusPedidoAgendado, pedidoId: string, label: string) => {
    const isCurrentStatus = statusAtual === novoStatus;
    const isPastStatus = getProgressValue(statusAtual) > getProgressValue(novoStatus);

    // Determinar se este é o próximo status lógico
    const isNextStatus = (() => {
      if (!statusAtual) return novoStatus === "Agendado";
      if (statusAtual === "Agendado") return novoStatus === "Separado";
      if (statusAtual === "Separado") return novoStatus === "Despachado";
      if (statusAtual === "Despachado") return novoStatus === "Entregue" || novoStatus === "Retorno";
      return false;
    })();
    
    // Ocultar botões "Entregue" e "Retorno" se o status atual não for "Despachado"
    if ((novoStatus === "Entregue" || novoStatus === "Retorno") && statusAtual !== "Despachado") {
      return null;
    }

    // Verificar se as ações estão habilitadas com base no tipoFiltro
    const isDisabled = tipoFiltro === 'proximas';

    const buttonLabel = (novoStatus === "Despachado" && !isCurrentStatus) ? "Confirmar Despacho" : label;

    const isEntregaRetorno = novoStatus === "Entregue" || novoStatus === "Retorno";
    
    let buttonVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" = isNextStatus ? "default" : "outline";
    
    if (novoStatus === "Despachado") {
      buttonVariant = isCurrentStatus ? "success" : "default";
    } else if (novoStatus === "Entregue") {
      buttonVariant = "default";
    } else if (novoStatus === "Retorno") {
      buttonVariant = "destructive";
    }
    
    if (isCurrentStatus && novoStatus === "Despachado") {
      return <Button 
        variant="success" 
        size="sm" 
        className="pointer-events-none opacity-90 bg-[#A5D6A7] text-gray-900 hover:bg-[#A5D6A7]/90"
      >
        <Check className="h-3 w-3 mr-1" /> Despachado
      </Button>;
    }
    
    if (isCurrentStatus) {
      return <Button
        variant={novoStatus === "Despachado" ? "success" : "secondary"}
        size="sm"
        className="pointer-events-none opacity-50"
      >
        <Check className="h-3 w-3 mr-1" /> {buttonLabel}
      </Button>;
    }
    
    if (isPastStatus) {
      return <Button
        variant="outline"
        size="sm"
        className="opacity-50"
        onClick={() => {
          setPedidoSelecionado(pedidoId);
          setSubstatusSelecionado(novoStatus);
        }}
      >
        {buttonLabel}
      </Button>;
    }
    
    if (isEntregaRetorno) {
      return <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size="sm"
          disabled={isDisabled}
          onClick={() => {
            setPedidoSelecionado(pedidoId);
            setSubstatusSelecionado(novoStatus);
          }}
          className={cn(
            novoStatus === "Entregue" ? "bg-[#2E7D32] hover:bg-[#2E7D32]/90" : "",
            novoStatus === "Retorno" ? "bg-[#D32F2F] hover:bg-[#D32F2F]/90" : ""
          )}
        >
          {buttonLabel}
        </Button>
      </DialogTrigger>;
    }
    
    if (novoStatus === "Despachado" && !isCurrentStatus) {
      return <Button
        variant="default"
        size="sm"
        disabled={isDisabled}
        className="bg-[#2E7D32] hover:bg-[#2E7D32]/90"
        onClick={() => confirmarDespacho(pedidoId)}
      >
        {buttonLabel}
      </Button>;
    }
    
    return <Button
      variant={buttonVariant}
      size="sm"
      disabled={isDisabled}
      onClick={() => {
        if (novoStatus === "Despachado") {
          confirmarDespacho(pedidoId);
        }
      }}
    >
      {buttonLabel}
    </Button>;
  };

  // Obter o status e classe de cor
  const getSubstatusColor = (substatus: SubstatusPedidoAgendado | undefined): string => {
    switch (substatus) {
      case "Agendado":
        return "bg-blue-500";
      case "Separado":
        return "bg-amber-500";
      case "Despachado":
        return "bg-purple-500";
      case "Entregue":
        return "bg-green-500";
      case "Retorno":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Renderizar header específico por tipo de filtro
  const renderHeaderActions = () => {
    if (tipoFiltro === 'atrasadas') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={reagendarTodosParaHoje} 
              disabled={pedidosEmDespacho.length === 0}
              size="sm" 
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" /> Reagendar Todos para Hoje
            </Button>
            <Button 
              onClick={confirmarEntregaEmMassa}
              disabled={pedidosEmDespacho.length === 0 || isLoading.entregaMassa}
              size="sm" 
              className="flex items-center gap-1"
            >
              {isLoading.entregaMassa ? (
                <>Processando...</>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar Entregas em Massa
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (tipoFiltro === 'hoje') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={confirmarDespachoEmMassaLocal} 
              disabled={pedidosSeparados.length === 0 || isLoading.despachoMassa}
              size="sm" 
              className="flex items-center gap-1 bg-[#2E7D32] hover:bg-[#2E7D32]/90"
            >
              {isLoading.despachoMassa ? (
                <>Processando...</>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar Despacho em Massa
                </>
              )}
            </Button>
            <Button 
              onClick={confirmarEntregaEmMassa}
              disabled={pedidosDespachados.length === 0 || isLoading.entregaMassa}
              size="sm" 
              className="flex items-center gap-1 bg-[#2E7D32] hover:bg-[#2E7D32]/90"
            >
              {isLoading.entregaMassa ? (
                <>Processando...</>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirmar Entrega em Massa
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Renderizar ações adicionais para pedidos atrasados
  const renderAcoesAtrasadas = (pedido: any) => {
    if (tipoFiltro !== 'atrasadas') return null;

    return (
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => reagendarParaHoje(pedido.id)}
          className="flex items-center gap-1"
        >
          <Calendar className="h-4 w-4" /> Reagendar para Hoje
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          {tipoFiltro === 'hoje' && "Entregas de Hoje"}
          {tipoFiltro === 'proximas' && "Próximas Entregas"}
          {tipoFiltro === 'atrasadas' && "Entregas Atrasadas (Ontem)"}
        </h2>
        
        {renderHeaderActions()}
        
        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pedidos">Despacho</TabsTrigger>
            <TabsTrigger value="roteirizacao">Roteirização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pedidos">
            {pedidosEmDespacho.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-6">
                  {pedidosEmDespacho.map(pedido => (
                    <Card key={pedido.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{pedido.cliente_nome}</h3>
                              <StatusBadge status="Agendado" />
                              {pedido.substatus_pedido && <SubstatusBadge substatus={pedido.substatus_pedido} />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {pedido.cliente_endereco || "Endereço não disponível"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Entrega prevista: {formatDate(new Date(pedido.data_prevista_entrega))} • 
                              {pedido.quantidade_total} unidades
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" onClick={() => copiarInfoEntrega(pedido)} className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Info
                          </Button>
                          
                          {tipoFiltro === 'hoje' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retornarParaSeparacao(pedido.id)}
                              className="flex items-center gap-1"
                            >
                              <Undo className="h-4 w-4" /> Retornar à Separação
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {renderAcoesAtrasadas(pedido)}
                      
                      <div className="mt-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status operacional</span>
                            <span className="text-sm text-muted-foreground">
                              {pedido.substatus_pedido || "Agendado"}
                            </span>
                          </div>
                          <Progress value={getProgressValue(pedido.substatus_pedido)} className={`h-2 ${getSubstatusColor(pedido.substatus_pedido)}`} />
                          <div className="flex justify-between gap-2 mt-2 flex-wrap">
                            <Dialog>
                              {renderBotaoSubstatus(pedido.substatus_pedido, "Despachado", pedido.id, "Confirmar Despacho")}
                              {renderBotaoSubstatus(pedido.substatus_pedido, "Entregue", pedido.id, "Entregue")}
                              {renderBotaoSubstatus(pedido.substatus_pedido, "Retorno", pedido.id, "Retorno")}
                              
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {substatusSelecionado === "Entregue" ? "Confirmar Entrega" : "Registrar Retorno"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {substatusSelecionado === "Entregue" 
                                      ? "Confirme a entrega do pedido ao cliente. Um novo agendamento será criado automaticamente." 
                                      : "Registre o retorno do pedido à fábrica. O sistema irá sugerir o próximo dia útil para reagendamento."}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid gap-4">
                                    <Label htmlFor="observacao">Observações (opcional)</Label>
                                    <Textarea 
                                      id="observacao" 
                                      placeholder="Informe detalhes adicionais..." 
                                      value={observacao} 
                                      onChange={e => setObservacao(e.target.value)} 
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={async () => {
                                      if (pedidoSelecionado && substatusSelecionado) {
                                        if (substatusSelecionado === "Entregue") {
                                          await confirmarEntrega(pedidoSelecionado, observacao);
                                        } else if (substatusSelecionado === "Retorno") {
                                          await confirmarRetorno(pedidoSelecionado, observacao);
                                        }
                                        setObservacao("");
                                      }
                                    }}>
                                      Confirmar
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                {tipoFiltro === 'hoje' && "Não há pedidos para entrega hoje."}
                {tipoFiltro === 'proximas' && "Não há pedidos agendados para os próximos dias."}
                {tipoFiltro === 'atrasadas' && "Não há pedidos atrasados de ontem."}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="roteirizacao">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 max-w-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Ordenação Manual</h3>
                    <Button variant="outline" size="sm" onClick={() => toast.success("A ordem de entrega foi salva com sucesso.")}>
                      Salvar Ordem
                    </Button>
                  </div>
                  
                  {pedidosSeparados.length > 0 ? (
                    <div className="border rounded-md">
                      {pedidosSeparados.map((pedido, index) => (
                        <div key={pedido.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-primary text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{pedido.cliente_nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {pedido.cliente_endereco || "Endereço não disponível"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-md">
                      <p className="text-muted-foreground">
                        Não há pedidos separados para roteirização
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2 items-start justify-between">
                    <div>
                      <h3 className="font-medium mb-2">Roteirização Automática</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gere uma rota otimizada automaticamente
                      </p>
                    </div>
                    <Button disabled={true} className="flex items-center gap-1">
                      <MapPinned className="h-4 w-4" />
                      Gerar rota automaticamente (Google)
                    </Button>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-md border mt-2">
                    <p className="text-sm text-muted-foreground italic">
                      Em desenvolvimento – integração com Google Route API em breve
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
