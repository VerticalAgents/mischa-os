
import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components
import PCPHeader from "@/components/pcp/PCPHeader";
import ProductionParams from "@/components/pcp/ProductionParams";
import ProductionSummary from "@/components/pcp/ProductionSummary";
import OrdersList from "@/components/pcp/OrdersList";
import FlavorPlanningTable from "@/components/pcp/FlavorPlanningTable";
import DailyNeedsTab from "@/components/pcp/DailyNeedsTab";
import RetrospectiveTab from "@/components/pcp/RetrospectiveTab";
import PlanejamentoProducao from "@/components/pcp/PlanejamentoProducao";
import RegistroManualProducao from "@/components/pcp/RegistroManualProducao";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";

export default function PCP() {
  const { sabores } = useSaborStore();
  const { getPedidosFiltrados, pedidos } = usePedidoStore();
  const { 
    setPeriodo, 
    calcularPlanejamento, 
    getPlanejamento, 
    getTotalFormasNecessarias, 
    getTotalUnidadesAgendadas,
    setCapacidadeForma,
    capacidadeForma,
    setIncluirPedidosPrevistos,
    incluirPedidosPrevistos,
  } = usePlanejamentoProducaoStore();

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarPedidosPrevistos, setMostrarPedidosPrevistos] = useState(incluirPedidosPrevistos);
  const [estoqueAtual, setEstoqueAtual] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState("planejamento");
  
  // Define o início e fim da semana para o planejamento
  const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Domingo

  // Effect to sync checkbox with store
  useEffect(() => {
    setIncluirPedidosPrevistos(mostrarPedidosPrevistos);
  }, [mostrarPedidosPrevistos, setIncluirPedidosPrevistos]);

  // Load initial flavor stock
  useEffect(() => {
    const estoqueInicial: Record<number, number> = {};
    sabores.forEach(sabor => {
      estoqueInicial[sabor.id] = sabor.saldoAtual;
    });
    setEstoqueAtual(estoqueInicial);
  }, [sabores]);

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

  // Atualiza o estoque atual de um sabor
  const atualizarEstoqueAtual = (idSabor: number, quantidade: number) => {
    setEstoqueAtual(prev => ({
      ...prev,
      [idSabor]: quantidade
    }));
  };

  // Exportar planejamento (mockup)
  const exportarPlanejamento = () => {
    alert("Funcionalidade de exportação será implementada em breve");
  };

  // Buscar pedidos no período selecionado
  const pedidosNoPeriodo = pedidos.filter(pedido => {
    const dataPedido = new Date(pedido.dataPrevistaEntrega);
    return (
      (pedido.statusPedido === "Agendado" || 
       pedido.statusPedido === "Em Separação" || 
       pedido.statusPedido === "Despachado") &&
      !pedido.dataEfetivaEntrega &&
      dataPedido >= inicioSemana &&
      dataPedido <= fimSemana
    );
  });

  // Preparar dados para o planejamento com sobras/déficits
  const planejamentoComSobras = getPlanejamento().map(item => {
    const estoque = estoqueAtual[item.idSabor] || 0;
    const diferenca = estoque - item.totalUnidadesAgendadas;
    
    return {
      ...item,
      estoqueAtual: estoque,
      saldo: diferenca,
      status: diferenca >= 0 ? 'Sobra' : 'Déficit'
    };
  });

  // Agrupar sabores ativos e inativos
  const saboresAtivos = planejamentoComSobras.filter(item => item.totalUnidadesAgendadas > 0);
  const saboresInativos = sabores.filter(sabor => 
    !planejamentoComSobras.some(item => item.idSabor === sabor.id) && 
    sabor.saldoAtual === 0
  ).map(sabor => ({
    idSabor: sabor.id,
    nomeSabor: sabor.nome,
    totalUnidadesAgendadas: 0,
    formasNecessarias: 0,
    estoqueAtual: estoqueAtual[sabor.id] || 0,
    saldo: estoqueAtual[sabor.id] || 0,
    status: 'Inativo'
  }));

  // Mock data for retrospective (last 30 days)
  const retrospectiva = [
    { idSabor: 1, nomeSabor: 'Tradicional', totalUnidades: 2800, formasNecessarias: 93, percentualTotal: 38.5, crescimento: 5.2 },
    { idSabor: 2, nomeSabor: 'Choco Duo', totalUnidades: 1950, formasNecessarias: 65, percentualTotal: 26.8, crescimento: 3.1 },
    { idSabor: 5, nomeSabor: 'Avelã', totalUnidades: 1250, formasNecessarias: 42, percentualTotal: 17.2, crescimento: -2.5 },
    { idSabor: 3, nomeSabor: 'Mesclado', totalUnidades: 850, formasNecessarias: 28, percentualTotal: 11.7, crescimento: 8.7 },
    { idSabor: 4, nomeSabor: 'Surpresa', totalUnidades: 420, formasNecessarias: 14, percentualTotal: 5.8, crescimento: 1.2 }
  ];

  // Mock data for daily needs
  const necessidadeDiaria = [
    { 
      data: new Date(), 
      diaSemana: 'Seg', 
      totalUnidades: 520, 
      formasNecessarias: 18,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 220 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 150 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 70 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 80 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 1)), 
      diaSemana: 'Ter', 
      totalUnidades: 480, 
      formasNecessarias: 16,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 200 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 50 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 100 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 2)), 
      diaSemana: 'Qua', 
      totalUnidades: 490, 
      formasNecessarias: 17,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 210 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 60 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 90 }
      ]
    }
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProductionParams
              capacidadeForma={capacidadeForma}
              atualizarCapacidadeForma={atualizarCapacidadeForma}
              mostrarPedidosPrevistos={mostrarPedidosPrevistos}
              setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
            />

            <ProductionSummary
              getTotalUnidadesAgendadas={getTotalUnidadesAgendadas}
              getTotalFormasNecessarias={getTotalFormasNecessarias}
            />

            <OrdersList 
              pedidosNoPeriodo={pedidosNoPeriodo}
            />
          </div>

          <FlavorPlanningTable
            saboresAtivos={saboresAtivos}
            saboresInativos={saboresInativos}
            estoqueAtual={estoqueAtual}
            atualizarEstoqueAtual={atualizarEstoqueAtual}
            getTotalUnidadesAgendadas={getTotalUnidadesAgendadas}
            getTotalFormasNecessarias={getTotalFormasNecessarias}
          />
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6">
          <DailyNeedsTab
            necessidadeDiaria={necessidadeDiaria}
            sabores={sabores}
            mostrarPedidosPrevistos={mostrarPedidosPrevistos}
            setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
          />
        </TabsContent>
        
        <TabsContent value="retrospectiva" className="space-y-6">
          <RetrospectiveTab 
            retrospectiva={retrospectiva} 
          />
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
