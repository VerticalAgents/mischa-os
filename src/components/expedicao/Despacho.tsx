
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import SubstatusBadge from "@/components/common/SubstatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowRight, Map, Check, Undo, MapPinned } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubstatusPedidoAgendado, Pedido } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [pedidosSelecionados, setPedidosSelecionados] = useState<Record<number, boolean>>({});
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [pedidosRoteirizacao, setPedidosRoteirizacao] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  // Filtrar apenas pedidos com substatus "Separado" para despacho
  const pedidosSeparados = pedidos.filter(p => 
    p.statusPedido === "Agendado" && p.substatusPedido === "Separado"
  ).sort((a, b) => new Date(a.dataPrevistaEntrega).getTime() - new Date(b.dataPrevistaEntrega).getTime());

  // Inicializar pedidosRoteirizacao se estiver vazio
  const inicializarPedidosRoteirizacao = useCallback(() => {
    if (pedidosRoteirizacao.length === 0 && pedidosSeparados.length > 0) {
      setPedidosRoteirizacao([...pedidosSeparados]);
    }
  }, [pedidosSeparados, pedidosRoteirizacao.length]);

  // Verificar se algum pedido está selecionado
  const temPedidosSelecionados = Object.values(pedidosSelecionados).some(selected => selected);

  // Função para selecionar/desselecionar todos os pedidos
  const toggleSelecionarTodos = () => {
    if (temPedidosSelecionados) {
      setPedidosSelecionados({});
    } else {
      const todos = {};
      pedidosSeparados.forEach(p => {
        todos[p.id] = true;
      });
      setPedidosSelecionados(todos);
    }
  };

  // Função para copiar informações para o WhatsApp
  const copiarInfoEntrega = pedido => {
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

  // Função para retornar à separação
  const retornarParaSeparacao = (idPedido: number) => {
    atualizarSubstatusPedido(idPedido, "Agendado", "Retornado para separação manualmente");
    toast({
      title: "Pedido retornado para separação",
      description: "O pedido voltou para a etapa de separação."
    });
  };

  // Função para despacho em massa
  const confirmarDespachoEmMassa = async () => {
    const pedidosSelecionadosIds = Object.entries(pedidosSelecionados)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));
    
    if (pedidosSelecionadosIds.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione ao menos um pedido para confirmar o despacho",
        variant: "destructive"
      });
      return;
    }

    // Verificar se todos os pedidos estão com substatus "Separado"
    const pedidosInvalidos = pedidosSelecionadosIds.filter(id => {
      const pedido = pedidos.find(p => p.id === id);
      return pedido && pedido.substatusPedido !== "Separado";
    });

    if (pedidosInvalidos.length > 0) {
      toast({
        title: "Pedidos com status inválido",
        description: `${pedidosInvalidos.length} pedidos não podem ser despachados pois não estão separados.`,
        variant: "destructive"
      });
      return;
    }

    // Ativar loading
    setIsLoading({...isLoading, despachoMassa: true});

    try {
      // Confirmar o despacho de todos os pedidos selecionados
      for (const id of pedidosSelecionadosIds) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simular processamento
        atualizarSubstatusPedido(id, "Despachado", "Despacho confirmado em massa");
      }
      
      toast({
        title: "Despacho em massa confirmado",
        description: `${pedidosSelecionadosIds.length} pedidos foram marcados como despachados.`
      });

      // Limpar seleção após a operação
      setPedidosSelecionados({});
    } catch (error) {
      console.error("Erro ao confirmar despacho em massa:", error);
      toast({
        title: "Erro ao despachar",
        description: "Ocorreu um erro ao processar os pedidos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading({...isLoading, despachoMassa: false});
    }
  };

  // Função para confirmar entrega em massa
  const confirmarEntregaEmMassa = async () => {
    const pedidosSelecionadosIds = Object.entries(pedidosSelecionados)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));
    
    if (pedidosSelecionadosIds.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione ao menos um pedido para confirmar a entrega",
        variant: "destructive"
      });
      return;
    }

    // Verificar se os pedidos estão com substatus "Despachado"
    const pedidosValidosIds = pedidosSelecionadosIds.filter(id => {
      const pedido = pedidos.find(p => p.id === id);
      return pedido && pedido.substatusPedido === "Despachado";
    });

    if (pedidosValidosIds.length === 0) {
      toast({
        title: "Nenhum pedido válido selecionado",
        description: "Os pedidos selecionados não possuem status 'Despachado' e não podem ser entregues.",
        variant: "destructive"
      });
      return;
    }

    if (pedidosValidosIds.length < pedidosSelecionadosIds.length) {
      toast({
        title: "Alguns pedidos não podem ser entregues",
        description: `${pedidosSelecionadosIds.length - pedidosValidosIds.length} pedidos não estão despachados e serão ignorados.`,
      });
    }

    // Ativar loading
    setIsLoading({...isLoading, entregaMassa: true});

    try {
      // Confirmar a entrega dos pedidos válidos
      for (const id of pedidosValidosIds) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simular processamento
        atualizarSubstatusPedido(id, "Entregue", "Entrega confirmada em massa");
      }
      
      toast({
        title: "Entrega em massa confirmada",
        description: `${pedidosValidosIds.length} pedidos foram marcados como entregues.`
      });

      // Limpar seleção após a operação
      setPedidosSelecionados({});
    } catch (error) {
      console.error("Erro ao confirmar entrega em massa:", error);
      toast({
        title: "Erro ao entregar",
        description: "Ocorreu um erro ao processar os pedidos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading({...isLoading, entregaMassa: false});
    }
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
      const pedidosComEndereco = pedidosSeparados.filter(p => p.cliente?.enderecoEntrega).map((p, index) => ({
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
${i + 2}. **Parada ${i + 1}**: ${p.cliente} - ${p.endereco}`).join('')}

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
      return <Button variant="secondary" size="sm" className="pointer-events-none opacity-50">
          <Check className="h-3 w-3 mr-1" /> {label}
        </Button>;
    }
    if (isPastStatus) {
      return <Button variant="outline" size="sm" className="opacity-50" onClick={() => {
        setPedidoSelecionado(pedidoId);
        setSubstatusSelecionado(novoStatus);
      }}>
          {label}
        </Button>;
    }
    if (isEntregaRetorno) {
      return <DialogTrigger asChild>
          <Button variant={isNextStatus ? "default" : "outline"} size="sm" onClick={() => {
          setPedidoSelecionado(pedidoId);
          setSubstatusSelecionado(novoStatus);
        }}>
            {label}
          </Button>
        </DialogTrigger>;
    }
    return <Button variant={isNextStatus ? "default" : "outline"} size="sm" onClick={() => {
      atualizarSubstatusPedido(pedidoId, novoStatus);
      toast({
        title: "Status atualizado",
        description: `Pedido atualizado para "${novoStatus}"`
      });
    }}>
        {label}
      </Button>;
  };

  // Função para desfazer a última alteração de substatus
  const desfazerAlteracao = pedido => {
    // Verificar se é possível desfazer (se não é Entregue ou Retorno)
    if (pedido.substatusPedido === "Entregue" || pedido.substatusPedido === "Retorno") {
      toast({
        title: "Não é possível desfazer",
        description: "Pedidos entregues ou com retorno não podem ter a ação desfeita.",
        variant: "destructive"
      });
      return;
    }

    // Obter o histórico para determinar o status anterior
    const historicoAlteracoes = pedido.historicoAlteracoesStatus || [];

    // Se não houver histórico, não tem como desfazer
    if (historicoAlteracoes.length <= 1) {
      toast({
        title: "Sem histórico para desfazer",
        description: "Não há alterações anteriores registradas para este pedido.",
        variant: "destructive"
      });
      return;
    }

    // Pegar o penúltimo status (anterior ao atual)
    const alteracaoAnterior = historicoAlteracoes[historicoAlteracoes.length - 2];
    const substatusAnterior = alteracaoAnterior.substatusNovo || "Agendado";

    // Fazer a alteração para o status anterior
    atualizarSubstatusPedido(pedido.id, substatusAnterior as SubstatusPedidoAgendado, "Alteração desfeita manualmente");
    toast({
      title: "Alteração desfeita",
      description: `O pedido foi revertido para o status anterior: ${substatusAnterior}`
    });
  };

  // Funções para drag and drop de roteirização
  const iniciarArraste = (id: number) => {
    setArrastando(id);
  };
  const finalizarArraste = (index: number) => {
    if (arrastando !== null) {
      const novaOrdem = [...pedidosRoteirizacao];
      const pedidoIndex = novaOrdem.findIndex(p => p.id === arrastando);
      if (pedidoIndex !== -1) {
        const [pedidoRemovido] = novaOrdem.splice(pedidoIndex, 1);
        novaOrdem.splice(index, 0, pedidoRemovido);
        setPedidosRoteirizacao(novaOrdem);
      }
      setArrastando(null);
    }
  };

  // Mover pedido para cima na ordem
  const moverParaCima = (index: number) => {
    if (index <= 0) return;
    const novaOrdem = [...pedidosRoteirizacao];
    const temp = novaOrdem[index - 1];
    novaOrdem[index - 1] = novaOrdem[index];
    novaOrdem[index] = temp;
    setPedidosRoteirizacao(novaOrdem);
  };

  // Mover pedido para baixo na ordem
  const moverParaBaixo = (index: number) => {
    if (index >= pedidosRoteirizacao.length - 1) return;
    const novaOrdem = [...pedidosRoteirizacao];
    const temp = novaOrdem[index + 1];
    novaOrdem[index + 1] = novaOrdem[index];
    novaOrdem[index] = temp;
    setPedidosRoteirizacao(novaOrdem);
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
  return <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Despacho de Pedidos</h2>
        
        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pedidos">Despacho</TabsTrigger>
            <TabsTrigger value="roteirizacao" onClick={inicializarPedidosRoteirizacao}>Roteirização</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pedidos">
            {pedidosSeparados.length > 0 ? <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="selectAll" checked={temPedidosSelecionados && Object.keys(pedidosSelecionados).length === pedidosSeparados.length} onCheckedChange={toggleSelecionarTodos} />
                    <label htmlFor="selectAll" className="text-sm">
                      {temPedidosSelecionados ? "Desmarcar todos" : "Selecionar todos"}
                    </label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={confirmarDespachoEmMassa} 
                      disabled={!temPedidosSelecionados || isLoading.despachoMassa}
                      size="sm" 
                      className="flex items-center gap-1"
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
                      disabled={!temPedidosSelecionados || isLoading.entregaMassa}
                      size="sm" 
                      className="flex items-center gap-1"
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
              
                <div className="space-y-6">
                  {pedidosSeparados.map(pedido => <Card key={pedido.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox id={`select-${pedido.id}`} checked={!!pedidosSelecionados[pedido.id]} onCheckedChange={checked => {
                      setPedidosSelecionados(prev => ({
                        ...prev,
                        [pedido.id]: !!checked
                      }));
                    }} />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{pedido.cliente?.nome || "Pedido Único"}</h3>
                              <StatusBadge status={pedido.statusPedido} />
                              {pedido.substatusPedido && <SubstatusBadge substatus={pedido.substatusPedido} />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {pedido.cliente?.enderecoEntrega || "Endereço não disponível"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Entrega prevista: {formatDate(new Date(pedido.dataPrevistaEntrega))} • 
                              {pedido.totalPedidoUnidades} unidades
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" onClick={() => copiarInfoEntrega(pedido)} className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Info
                          </Button>
                          
                          {/* Botão para retornar à separação */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retornarParaSeparacao(pedido.id)}
                            className="flex items-center gap-1"
                          >
                            <Undo className="h-4 w-4" /> Retornar à Separação
                          </Button>
                          
                          {/* Botão desfazer - apenas para Separado e Despachado */}
                          {(pedido.substatusPedido === "Despachado") && <Button variant="outline" size="sm" onClick={() => desfazerAlteracao(pedido)} className="flex items-center gap-1">
                              <Undo className="h-4 w-4" /> Desfazer
                            </Button>}
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
                          <Progress value={getProgressValue(pedido.substatusPedido)} className={`h-2 ${getSubstatusColor(pedido.substatusPedido)}`} />
                          <div className="flex justify-between gap-2 mt-2 flex-wrap">
                            <Dialog>
                              {/* Removido o botão de Separado, pois estamos filtrando apenas pedidos já separados */}
                              {renderBotaoSubstatus(pedido.substatusPedido, "Despachado", pedido.id, "Despachado")}
                              {renderBotaoSubstatus(pedido.substatusPedido, "Entregue", pedido.id, "Entregue")}
                              {renderBotaoSubstatus(pedido.substatusPedido, "Retorno", pedido.id, "Retorno")}
                              
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {substatusSelecionado === "Entregue" ? "Confirmar Entrega" : "Registrar Retorno"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {substatusSelecionado === "Entregue" ? "Confirme a entrega do pedido ao cliente. O status será alterado para 'Reagendar'." : "Registre o retorno do pedido à fábrica. O sistema irá sugerir o próximo dia útil para reagendamento."}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid gap-4">
                                    <Label htmlFor="observacao">Observações (opcional)</Label>
                                    <Textarea id="observacao" placeholder="Informe detalhes adicionais..." value={observacao} onChange={e => setObservacao(e.target.value)} />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button onClick={() => {
                                if (pedidoSelecionado && substatusSelecionado) {
                                  atualizarSubstatusPedido(pedidoSelecionado, substatusSelecionado as SubstatusPedidoAgendado, observacao);
                                  setObservacao("");
                                  toast({
                                    title: substatusSelecionado === "Entregue" ? "Entrega confirmada" : "Retorno registrado",
                                    description: substatusSelecionado === "Entregue" ? "O cliente será automaticamente colocado em status de reagendamento" : "Reagendamento sugerido para o próximo dia útil"
                                  });
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
                    </Card>)}
                </div>
              </div> : <div className="text-center py-6 text-muted-foreground">
                Não há pedidos separados para despacho.
              </div>}
          </TabsContent>
          
          <TabsContent value="roteirizacao">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 max-w-xl">
                {/* Interface de roteirização manual */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Ordenação Manual</h3>
                    <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Rota salva",
                    description: "A ordem de entrega foi salva com sucesso."
                  })}>
                      Salvar Ordem
                    </Button>
                  </div>
                  
                  {pedidosRoteirizacao.length > 0 ? <div className="border rounded-md">
                      {pedidosRoteirizacao.map((pedido, index) => <div key={pedido.id} className={`flex items-center justify-between p-3 border-b last:border-b-0
                            ${arrastando === pedido.id ? "bg-muted" : ""}
                          `} draggable onDragStart={() => iniciarArraste(pedido.id)} onDragOver={e => e.preventDefault()} onDrop={() => finalizarArraste(index)}>
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center text-primary text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{pedido.cliente?.nome || "Pedido Único"}</div>
                              <div className="text-sm text-muted-foreground">
                                {pedido.cliente?.enderecoEntrega || "Endereço não disponível"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => moverParaCima(index)} disabled={index === 0}>
                              <ArrowRight className="h-4 w-4 rotate-270" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => moverParaBaixo(index)} disabled={index === pedidosRoteirizacao.length - 1}>
                              <ArrowRight className="h-4 w-4 rotate-90" />
                            </Button>
                          </div>
                        </div>)}
                    </div> : <div className="text-center py-6 border rounded-md">
                      <p className="text-muted-foreground">
                        Não há pedidos separados para roteirização
                      </p>
                    </div>}
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
                
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                    Chave da API Perplexity
                  </label>
                  <Input id="api-key" type="password" value={perplexityApiKey} onChange={e => setPerplexityApiKey(e.target.value)} placeholder="pk-..." />
                  <p className="text-xs text-muted-foreground mt-1">
                    Necessária para a geração de rotas com IA
                  </p>
                </div>
                
                <Button onClick={gerarRota} disabled={isGeneratingRoute || pedidosSeparados.length === 0} className="flex items-center gap-1 max-w-xs">
                  <Map className="h-4 w-4" />
                  {isGeneratingRoute ? "Gerando rota..." : "Gerar Rota com IA"}
                </Button>
              </div>
              
              {rotaGerada && <div className="mt-6 border rounded-md p-4 bg-muted/30">
                  <h3 className="font-medium mb-2 flex items-center gap-1">
                    <Map className="h-4 w-4" /> Rota Gerada
                  </h3>
                  <Textarea value={rotaGerada} readOnly className="min-h-[200px] font-mono text-sm" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                navigator.clipboard.writeText(rotaGerada);
                toast({
                  title: "Rota copiada",
                  description: "Rota copiada para a área de transferência"
                });
              }}>
                    Copiar Rota
                  </Button>
                </div>}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>;
};
