
import { useState, useEffect } from "react";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";

import ProductionParams from "@/components/pcp/ProductionParams";
import ProductionSummary from "@/components/pcp/ProductionSummary";
import OrdersList from "@/components/pcp/OrdersList";
import FlavorPlanningTable from "@/components/pcp/FlavorPlanningTable";

interface PCPPlanejamentoTabProps {
  capacidadeForma: number;
  atualizarCapacidadeForma: (capacidade: number) => void;
  mostrarPedidosPrevistos: boolean;
  setMostrarPedidosPrevistos: (mostrar: boolean) => void;
  inicioSemana: Date;
  fimSemana: Date;
}

export default function PCPPlanejamentoTab({
  capacidadeForma,
  atualizarCapacidadeForma,
  mostrarPedidosPrevistos,
  setMostrarPedidosPrevistos,
  inicioSemana,
  fimSemana
}: PCPPlanejamentoTabProps) {
  const { sabores } = useSaborStore();
  const { pedidos } = usePedidoStore();
  const { 
    getPlanejamento, 
    getTotalFormasNecessarias, 
    getTotalUnidadesAgendadas,
    getTotalLotesNecessarios
  } = usePlanejamentoProducaoStore();

  const [estoqueAtual, setEstoqueAtual] = useState<Record<number, number>>({});

  // Load initial flavor stock
  useEffect(() => {
    const estoqueInicial: Record<number, number> = {};
    sabores.forEach(sabor => {
      estoqueInicial[sabor.id] = sabor.saldoAtual;
    });
    setEstoqueAtual(estoqueInicial);
  }, [sabores]);

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

  // Atualiza o estoque atual de um sabor
  const atualizarEstoqueAtual = (idSabor: number, quantidade: number) => {
    setEstoqueAtual(prev => ({
      ...prev,
      [idSabor]: quantidade
    }));
  };

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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProductionParams
          capacidadeForma={capacidadeForma}
          atualizarCapacidadeForma={atualizarCapacidadeForma}
          mostrarPedidosPrevistos={mostrarPedidosPrevistos}
          setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
          formasPorLote={0} 
          atualizarFormasPorLote={() => {}} 
        />

        <ProductionSummary
          getTotalUnidadesAgendadas={getTotalUnidadesAgendadas}
          getTotalFormasNecessarias={getTotalFormasNecessarias}
          getTotalLotesNecessarios={getTotalLotesNecessarios}
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
    </>
  );
}
