
import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useToast } from "@/hooks/use-toast";
import { Pedido } from "@/types";
import PedidosTable from "./PedidosTable";
import SeparacaoActionButtons from "./SeparacaoActionButtons";
import { createPrintListContent, createPrintEtiquetasContent, printContent } from "./utils/printUtils";

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
  const pedidosPadraoOrdenados = [...pedidosPadrao].sort((a, b) => (a.totalPedidoUnidades || 0) - (b.totalPedidoUnidades || 0));
  const pedidosAlteradosOrdenados = [...pedidosAlterados].sort((a, b) => (a.totalPedidoUnidades || 0) - (b.totalPedidoUnidades || 0));
  
  // Nova lista combinada para a subaba "Todos os Pedidos"
  const todosPedidos = [
    ...pedidosPadraoOrdenados,
    ...pedidosAlteradosOrdenados
  ];

  // Confirmar separação - Atualiza diretamente para "Separado"
  const confirmarSeparacaoPedido = (idPedido: number) => {
    atualizarSubstatusPedido(idPedido, "Separado", "Separação confirmada manualmente");
    toast({
      title: "Separação confirmada",
      description: "O pedido foi marcado como Separado.",
    });
  };
  
  // Desfazer separação
  const desfazerSeparacao = (idPedido: number) => {
    atualizarSubstatusPedido(idPedido, "Agendado", "Separação desfeita manualmente");
    toast({
      title: "Separação desfeita",
      description: "O pedido voltou para o status Agendado.",
    });
  };
  
  // Marcar todos como separados
  const marcarTodosSeparados = () => {
    let listaAtual: Array<Pedido> = [];
    
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

  // Imprimir lista de separação
  const imprimirListaSeparacao = () => {
    let listaAtual: Array<Pedido> = [];
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
    
    const content = createPrintListContent(listaAtual, tipoLista);
    
    if (content) {
      printContent(printFrameRef.current, content);
      toast({
        title: "Impressão iniciada",
        description: "A lista de separação foi enviada para impressão."
      });
    }
  };
  
  // Imprimir etiquetas
  const imprimirEtiquetas = () => {
    let listaAtual: Array<Pedido> = [];
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
    
    const content = createPrintEtiquetasContent(listaAtual);
    
    if (content) {
      printContent(printFrameRef.current, content);
      toast({
        title: "Impressão de etiquetas iniciada",
        description: "As etiquetas foram enviadas para impressão."
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Separação de Pedidos</h2>
          <SeparacaoActionButtons 
            onMarcarTodos={marcarTodosSeparados}
            onImprimirLista={imprimirListaSeparacao}
            onImprimirEtiquetas={imprimirEtiquetas}
          />
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
            <PedidosTable 
              pedidos={pedidosPadraoOrdenados} 
              onConfirmSeparacao={confirmarSeparacaoPedido}
              onDesfazerSeparacao={desfazerSeparacao}
            />
          </TabsContent>
          
          <TabsContent value="alterados">
            <PedidosTable 
              pedidos={pedidosAlteradosOrdenados} 
              onConfirmSeparacao={confirmarSeparacaoPedido}
              onDesfazerSeparacao={desfazerSeparacao}
            />
          </TabsContent>
          
          <TabsContent value="todos">
            <PedidosTable 
              pedidos={todosPedidos} 
              onConfirmSeparacao={confirmarSeparacaoPedido}
              onDesfazerSeparacao={desfazerSeparacao}
              showTipoPedido={true}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* IFrame invisível para impressão */}
      <iframe ref={printFrameRef} style={{ display: 'none' }} />
    </div>
  );
};
