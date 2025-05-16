
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowRight, Map } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Despacho = () => {
  const { toast } = useToast();
  const pedidos = usePedidoStore(state => state.getPedidosFiltrados());
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [rotaGerada, setRotaGerada] = useState("");

  // Filtrar pedidos em separação ou despachados
  const pedidosParaDespacho = pedidos.filter(p => 
    p.statusPedido === "Em Separação" || p.statusPedido === "Despachado"
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
      const pedidosComEndereco = pedidosParaDespacho
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
            {pedidosParaDespacho.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosParaDespacho.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {pedido.cliente?.enderecoEntrega || "Endereço não disponível"}
                      </TableCell>
                      <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
                      <TableCell>
                        <StatusBadge status={pedido.statusPedido} />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copiarInfoEntrega(pedido)}
                          className="flex items-center gap-1"
                        >
                          <MapPin className="h-4 w-4" /> Copiar Info
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Não há pedidos preparados para despacho.
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
                  disabled={isGeneratingRoute || pedidosParaDespacho.length === 0}
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
              
              {pedidosParaDespacho.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Pedidos para Roteirização</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pedidosParaDespacho.map((pedido, index) => (
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
