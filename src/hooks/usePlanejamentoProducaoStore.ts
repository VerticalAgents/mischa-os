
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PlanejamentoProducao, Pedido, Sabor, ItemPedido } from '../types';
import { calcularFormasNecessarias } from '../utils/calculations';

interface PlanejamentoProducaoStore {
  planejamento: PlanejamentoProducao[];
  periodoSelecionado: {
    dataInicio: Date;
    dataFim: Date;
  };
  capacidadeForma: number;
  
  // Ações
  setPeriodo: (dataInicio: Date, dataFim: Date) => void;
  setCapacidadeForma: (capacidade: number) => void;
  calcularPlanejamento: (pedidos: Pedido[], sabores: Sabor[]) => void;
  registrarProducao: (idSabor: number, quantidadeProduzida: number) => void;
  
  // Getters
  getPlanejamento: () => PlanejamentoProducao[];
  getTotalUnidadesAgendadas: () => number;
  getTotalFormasNecessarias: () => number;
}

export const usePlanejamentoProducaoStore = create<PlanejamentoProducaoStore>()(
  devtools(
    (set, get) => ({
      planejamento: [],
      periodoSelecionado: {
        dataInicio: new Date(),
        dataFim: new Date(new Date().setDate(new Date().getDate() + 7))
      },
      capacidadeForma: 40,
      
      setPeriodo: (dataInicio, dataFim) => {
        set({
          periodoSelecionado: {
            dataInicio,
            dataFim
          }
        });
      },
      
      setCapacidadeForma: (capacidade) => {
        set({ capacidadeForma: capacidade });
      },
      
      calcularPlanejamento: (pedidos, sabores) => {
        const { periodoSelecionado, capacidadeForma } = get();
        
        // Filtrar pedidos no período e com status "Agendado" ou "Em Separação"
        const pedidosFiltrados = pedidos.filter(pedido => {
          const dataPedido = new Date(pedido.dataPrevistaEntrega);
          return (
            (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Em Separação") &&
            dataPedido >= periodoSelecionado.dataInicio &&
            dataPedido <= periodoSelecionado.dataFim
          );
        });
        
        // Inicializar o mapa de totais por sabor
        const totaisPorSabor = new Map<number, number>();
        
        // Para cada sabor, inicializar com 0
        sabores.forEach(sabor => {
          if (sabor.ativo) {
            totaisPorSabor.set(sabor.id, 0);
          }
        });
        
        // Somar as quantidades de cada sabor nos pedidos filtrados
        pedidosFiltrados.forEach(pedido => {
          pedido.itensPedido.forEach(item => {
            const totalAtual = totaisPorSabor.get(item.idSabor) || 0;
            totaisPorSabor.set(item.idSabor, totalAtual + item.quantidadeSabor);
          });
        });
        
        // Criar o planejamento
        const novoPlanejamento: PlanejamentoProducao[] = [];
        
        sabores.forEach(sabor => {
          if (sabor.ativo) {
            const totalUnidades = totaisPorSabor.get(sabor.id) || 0;
            
            if (totalUnidades > 0) {
              novoPlanejamento.push({
                idSabor: sabor.id,
                nomeSabor: sabor.nome,
                totalUnidadesAgendadas: totalUnidades,
                formasNecessarias: calcularFormasNecessarias(totalUnidades, capacidadeForma)
              });
            }
          }
        });
        
        // Ordenar por total de unidades (decrescente)
        novoPlanejamento.sort((a, b) => b.totalUnidadesAgendadas - a.totalUnidadesAgendadas);
        
        set({ planejamento: novoPlanejamento });
      },
      
      registrarProducao: (idSabor, quantidadeProduzida) => {
        // Esta função é apenas para o estado local, seria chamada pela useSaborStore para atualizar o estoque real
      },
      
      getPlanejamento: () => get().planejamento,
      
      getTotalUnidadesAgendadas: () => {
        return get().planejamento.reduce((total, item) => total + item.totalUnidadesAgendadas, 0);
      },
      
      getTotalFormasNecessarias: () => {
        return get().planejamento.reduce((total, item) => total + item.formasNecessarias, 0);
      }
    }),
    { name: 'planejamento-producao-store' }
  )
);
