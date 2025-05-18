
import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import PCPHeader from "@/components/pcp/PCPHeader";
import PCPPlanejamentoTab from "@/components/pcp/PCPPlanejamentoTab";
import PCPNecessidadeDiariaTab from "@/components/pcp/PCPNecessidadeDiariaTab";
import PCPRetrospectivaTab from "@/components/pcp/PCPRetrospectivaTab";
import PlanejamentoProducao from "@/components/pcp/PlanejamentoProducao";
import RegistroManualProducao from "@/components/pcp/RegistroManualProducao";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";

export default function PCP() {
  const { sabores } = useSaborStore();
  const { getPedidosFiltrados } = usePedidoStore();
  const { 
    setPeriodo, 
    calcularPlanejamento,
    setCapacidadeForma,
    capacidadeForma,
    setIncluirPedidosPrevistos,
    incluirPedidosPrevistos,
  } = usePlanejamentoProducaoStore();

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarPedidosPrevistos, setMostrarPedidosPrevistos] = useState(incluirPedidosPrevistos);
  const [activeTab, setActiveTab] = useState("planejamento");
  
  // Define o início e fim da semana para o planejamento
  const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Domingo

  // Effect to sync checkbox with store
  useEffect(() => {
    setIncluirPedidosPrevistos(mostrarPedidosPrevistos);
  }, [mostrarPedidosPrevistos, setIncluirPedidosPrevistos]);

  // Calcula o planejamento a partir dos pedidos no período
  const calcularPlanejamentoProducao = () => {
    setPeriodo(inicioSemana, fimSemana);
    const todosPedidos = getPedidosFiltrados()
      .filter(pedido => 
        (pedido.statusPedido === "Agendado" || 
        pedido.statusPedido === "Em Separação" || 
        pedido.statusPedido === "Despachado") &&
        !pedido.dataEfetivaEntrega
      );
    
    calcularPlanejamento(todosPedidos, sabores);
  };

  // Avançar uma semana no calendário
  const avancarSemana = () => {
    setDataSelecionada(prevDate => addDays(prevDate, 7));
  };

  // Voltar uma semana no calendário
  const voltarSemana = () => {
    setDataSelecionada(prevDate => subDays(prevDate, 7));
  };

  // Atualiza a capacidade da forma quando o número muda
  const atualizarCapacidadeForma = (capacidade: number) => {
    setCapacidadeForma(capacidade);
    calcularPlanejamentoProducao();
  };

  // Exportar planejamento (mockup)
  const exportarPlanejamento = () => {
    alert("Funcionalidade de exportação será implementada em breve");
  };

  return (
    <div className="container mx-auto py-6">
      <PCPHeader
        inicioSemana={inicioSemana}
        fimSemana={fimSemana}
        voltarSemana={voltarSemana}
        avancarSemana={avancarSemana}
        calcularPlanejamentoProducao={calcularPlanejamentoProducao}
        exportarPlanejamento={exportarPlanejamento}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade Diária</TabsTrigger>
          <TabsTrigger value="retrospectiva">Retrospectiva 30 Dias</TabsTrigger>
          <TabsTrigger value="planejar-producao">Planejar Produção</TabsTrigger>
          <TabsTrigger value="registro-manual">Registrar Produção</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
      
        <TabsContent value="planejamento" className="space-y-6">
          <PCPPlanejamentoTab
            capacidadeForma={capacidadeForma}
            atualizarCapacidadeForma={atualizarCapacidadeForma}
            mostrarPedidosPrevistos={mostrarPedidosPrevistos}
            setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
            inicioSemana={inicioSemana}
            fimSemana={fimSemana}
          />
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6">
          <PCPNecessidadeDiariaTab
            mostrarPedidosPrevistos={mostrarPedidosPrevistos}
            setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
          />
        </TabsContent>
        
        <TabsContent value="retrospectiva" className="space-y-6">
          <PCPRetrospectivaTab />
        </TabsContent>

        <TabsContent value="planejar-producao" className="space-y-6">
          <PlanejamentoProducao />
        </TabsContent>

        <TabsContent value="registro-manual" className="space-y-6">
          <RegistroManualProducao />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <HistoricoProducao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
