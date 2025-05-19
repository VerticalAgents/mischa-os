import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowRight, Map, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubstatusPedidoAgendado } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Despacho = () => {
  const { toast } = useToast();
  const pedidos = usePedidoStore(state => state.pedidos);
  const atualizarSubstatusPedido = usePedidoStore(state => state.atualizarSubstatusPedido);
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [rotaGerada, setRotaGerada] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pedidoSelecionado, setPedidoSelecionado] = useState<number | null>(null);
  const [substatusSelecionado, setSubstatusSelecionado] = useState<SubstatusPedidoAgendado | null>(null);

  // Filtrar pedidos com status "Agendado"
  const pedidosAgendados = pedidos.filter(p => 
    p.statusPedido === "Agendado"
  ).sort((a, b) => new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime());

  // Função para copiar informações para o WhatsApp
  const copiarInfoEntrega = (pedido) => {
    const cliente = pedido.cliente?.nome || "Pedido Único";
    const endereco = pedido.cliente?.enderecoEntrega || "Endereço não disponível";
    const telefone = pedido.cliente?.contatoTelefone || "Telefone não disponível";
    const data = formatDate(new Date(pedido.dataPrevistaEntrega));
    const totalUnidades = pedido.totalPedidoUnidades;
    
    const textoCopia = `
📦 *ENTREGA - ${cliente}*
📅 Data: ${data}
📍 Endereço: ${endereco}
📱 Telefone: ${telefone}
🧁 Total: ${totalUnidades} unidades
`;
    
    navigator.clipboard.writeText(textoCopia);
    toast({
      title: "Informações copiadas",
      description: "Dados da entrega copiados para a área de transferência"
    });
  };

  // Função para gerar a rota usando IA
  const gerarRota = async () => {
    if (!perplexityApiKey) {
      toast({
        title: "Chave API necessária",
        description: "Por favor, insira uma chave da API Perplexity para gerar rotas",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingRoute(true);
    
    try {
      // Preparar os dados dos pedidos
      const pedidosComEndereco = pedidosAgendados
        .filter(p => p.cliente?.enderecoEntrega)
        .map((p, index) => ({
          id: p.id,
          cliente: p.cliente?.nome,
          endereco: p.cliente?.enderecoEntrega,
          ordem: index + 1
        }));
      
      if (pedidosComEndereco.length === 0) {
        throw new Error("Não há pedidos com endereço para roteirização");
      }
      
      // Simular uma chamada à API de IA
      // Normalmente, você enviaria endereços para um serviço real de roteirização
      // Aqui estamos simulando uma resposta para fins de demonstração
      
      setTimeout(() => {
        // Simular uma resposta de roteirização
        const rotaSimulada = `## Rota otimizada para entrega

1. **Ponto de partida**: Fábrica - Rua Principal, 123
${pedidosComEndereco.map((p, i) => `
${i+2}. **Parada ${i+1}**: ${p.cliente} - ${p.endereco}`).join('')}

**Distância total estimada**: ${Math.floor(Math.random() * 30) + 10} km
**Tempo estimado**: ${Math.floor(Math.random() * 60) + 30} minutos

*Rota calculada para minimizar o tempo total de deslocamento*
`;
        
        setRotaGerada(rotaSimulada);
        toast({
          title: "Rota gerada",
          description: "A rota de entregas foi calculada com sucesso"
        });
        
        setIsGeneratingRoute(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao gerar rota:", error);
      toast({
        title: "Erro ao gerar rota",
        description: error.message || "Ocorreu um erro ao tentar gerar a rota de entregas",
        variant: "destructive"
      });
      setIsGeneratingRoute(false);
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
  const renderBotaoSubstatus = (statusAtual: SubstatusPedidoAgendado | undefined, novoStatus: SubstatusPedidoAgendado, pedidoId: number, label: string) => {
    const isCurrentStatus = statusAtual === novoStatus;
    const isPastStatus = getProgressValue(statusAtual) > getProgressValue(novoStatus);
    
    // Determinar se este é o próximo status lógico
    const isNextStatus = (() => {
      if (!statusAtual) return novoStatus === "Agendado";
      
      if (statusAtual === "Agendado") return novoStatus === "Separado";
      if (statusAtual === "Separado") return novoStatus === "Despachado";
      if (statusAtual === "Despachado") return novoStatus === "Entregue" || novoStatus === "Retorno";
      
      return false; // Para "Entregue" e "Retorno" não há próximo status
    })();
    
    // Para "Entregue" e "Retorno", sempre mostrar o diálogo de confirmação
    const isEntregaRetorno = novoStatus === "Entregue" || novoStatus === "Retorno";
    
    if (isCurrentStatus) {
      return (
        <Button variant="secondary" size="sm" className="pointer-events-none opacity-50">
          <Check className="h-3 w-3 mr-1" /> {label}
        </Button>
      );
    }
    
    if (isPastStatus) {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="opacity-50"
          onClick={() => {
            setPedidoSelecionado(pedidoId);
            setSubstatusSelecionado(novoStatus);
          }}
        >
          {label}
        </Button>
      );
    }
    
    if (isEntregaRetorno) {
      return (
        <DialogTrigger asChild>
          <Button 
            variant={isNextStatus ? "default" : "outline"} 
            size="sm" 
            onClick={() => {
              setPedidoSelecionado(pedidoId);
              setSubstatusSelecionado(novoStatus);
            }}
          >
            {label}
          </Button>
        </DialogTrigger>
      );
    }
    
    return (
      <Button 
        variant={isNextStatus ? "default" : "outline"} 
        size="sm"
        onClick={() => {
          atualizarSubstatusPedido(pedidoId, novoStatus);
          toast({
            title: "Status atualizado",
            description: `Pedido atualizado para "${novoStatus}"`
          });
        }}
      >
        {label}
      </Button>
    );
  };

  // Função para obter a classe de cor baseada no substatus
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

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Despacho de Pedidos</h2>
        
        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pedidos">Lista de Pedidos</TabsTrigger>
            <TabsTrigger value="roteirizacao">Roteirização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pedidos">
            {pedidosAgendados.length > 0 ? (
              <div className="space-y-6">
                {pedidosAgendados.map((pedido) => (
                  <Card key={pedido.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{pedido.cliente?.nome || "Pedido Único"}</h3>
                          <StatusBadge status={pedido.statusPedido} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pedido.cliente?.enderecoEntrega || "Endereço não disponível"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Entrega prevista: {formatDate(new Date(pedido.dataPrevistaEntrega))} • 
                          {pedido.totalPedidoUnidades} unidades
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 md:mt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copiarInfoEntrega(pedido)}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-4 w-4" /> Info
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Status operacional</span>
                          <span className="text-sm text-muted-foreground">
                            {pedido.substatusPedido || "Agendado"}
                          </span>
                        </div>
                        <Progress 
                          value={getProgressValue(pedido.substatusPedido)} 
                          className={`h-2 ${getSubstatusColor(pedido.substatusPedido)}`} 
                        />
                        <div className="flex justify-between gap-2 mt-2 flex-wrap">
                          <Dialog>
                            {renderBotaoSubstatus(pedido.substatusPedido, "Agendado", pedido.id, "Agendado")}
                            {renderBotaoSubstatus(pedido.substatusPedido, "Separado", pedido.id, "Separado")}
                            {renderBotaoSubstatus(pedido.substatusPedido, "Despachado", pedido.id, "Despachado")}
                            {renderBotaoSubstatus(pedido.substatusPedido, "Entregue", pedido.id, "Entregue")}
                            {renderBotaoSubstatus(pedido.substatusPedido, "Retorno", pedido.id, "Retorno")}
                            
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {substatusSelecionado === "Entregue" ? "Confirmar Entrega" : "Registrar Retorno"}
                                </DialogTitle>
                                <DialogDescription>
                                  {substatusSelecionado === "Entregue" 
                                    ? "Confirme a entrega do pedido ao cliente. O status será alterado para 'Reagendar'."
                                    : "Registre o retorno do pedido à fábrica. O sistema irá sugerir o próximo dia útil para reagendamento."
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid gap-4">
                                  <Label htmlFor="observacao">Observações (opcional)</Label>
                                  <Textarea
                                    id="observacao"
                                    placeholder="Informe detalhes adicionais..."
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button 
                                    onClick={() => {
                                      if (pedidoSelecionado && substatusSelecionado) {
                                        atualizarSubstatusPedido(
                                          pedidoSelecionado, 
                                          substatusSelecionado as SubstatusPedidoAgendado,
                                          observacao
                                        );
                                        setObservacao("");
                                        toast({
                                          title: substatusSelecionado === "Entregue" ? "Entrega confirmada" : "Retorno registrado",
                                          description: substatusSelecionado === "Entregue" 
                                            ? "O cliente será automaticamente colocado em status de reagendamento" 
                                            : "Reagendamento sugerido para o próximo dia útil"
                                        });
                                      }
                                    }}
                                  >
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
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos agendados para despacho.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="roteirizacao">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 max-w-xl">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                    Chave da API Perplexity
                  </label>
                  <Input 
                    id="api-key"
                    type="password"
                    value={perplexityApiKey}
                    onChange={(e) => setPerplexityApiKey(e.target.value)}
                    placeholder="pk-..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Necessária para a geração de rotas com IA
                  </p>
                </div>
                
                <Button 
                  onClick={gerarRota} 
                  disabled={isGeneratingRoute || pedidosAgendados.length === 0}
                  className="flex items-center gap-1 max-w-xs"
                >
                  <Map className="h-4 w-4" />
                  {isGeneratingRoute ? "Gerando rota..." : "Gerar Rota Otimizada"}
                </Button>
              </div>
              
              {rotaGerada && (
                <div className="mt-6 border rounded-md p-4 bg-muted/30">
                  <h3 className="font-medium mb-2 flex items-center gap-1">
                    <Map className="h-4 w-4" /> Rota Gerada
                  </h3>
                  <Textarea 
                    value={rotaGerada} 
                    readOnly 
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(rotaGerada);
                      toast({ title: "Rota copiada", description: "Rota copiada para a área de transferência" });
                    }}
                  >
                    Copiar Rota
                  </Button>
                </div>
              )}
              
              {pedidosAgendados.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Pedidos para Roteirização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pedidosAgendados.map((pedido, index) => (
                      <Card key={pedido.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-primary text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{pedido.cliente?.nome || "Pedido Único"}</div>
                            <div className="text-sm text-muted-foreground">
                              {pedido.cliente?.enderecoEntrega || "Endereço não disponível"}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
