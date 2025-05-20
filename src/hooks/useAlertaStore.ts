
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Alerta, Sabor } from '../types';
import { alertasMock } from '../data/mockData';

interface AlertaStore {
  alertas: Alerta[];
  
  // Ações
  setAlertas: (alertas: Alerta[]) => void;
  adicionarAlerta: (alerta: Omit<Alerta, 'id' | 'dataAlerta'>) => void;
  marcarComoLida: (id: number) => void;
  marcarTodasComoLidas: () => void;
  removerAlerta: (id: number) => void;
  gerarAlertaEstoqueMinimo: (sabor: Sabor) => void;
  gerarAlertaProximasEntregas: (data: Date, quantidadePedidos: number, idsPedidos: number[]) => void;
  gerarAlertaDeltaTolerancia: (
    idCliente: number, 
    nomeCliente: string, 
    deltaEfetivo: number, 
    periodicidadePadrao: number, 
    qpAntigo: number, 
    qpNovo: number
  ) => void;
  
  // Getters
  getAlertasNaoLidas: () => Alerta[];
  getAlertasPorTipo: (tipo: Alerta['tipo']) => Alerta[];
  getQuantidadeAlertasNaoLidas: () => number;
}

export const useAlertaStore = create<AlertaStore>()(
  devtools(
    (set, get) => ({
      alertas: alertasMock,
      
      setAlertas: (alertas) => set({ alertas }),
      
      adicionarAlerta: (alerta) => {
        const novoId = Math.max(0, ...get().alertas.map(a => a.id)) + 1;
        
        set(state => ({
          alertas: [
            {
              ...alerta,
              id: novoId,
              dataAlerta: new Date(),
              lido: false
            },
            ...state.alertas
          ]
        }));
      },
      
      marcarComoLida: (id) => {
        set(state => ({
          alertas: state.alertas.map(alerta => 
            alerta.id === id ? { ...alerta, lido: true } : alerta
          )
        }));
      },
      
      marcarTodasComoLidas: () => {
        set(state => ({
          alertas: state.alertas.map(alerta => ({ ...alerta, lido: true }))
        }));
      },
      
      removerAlerta: (id) => {
        set(state => ({
          alertas: state.alertas.filter(alerta => alerta.id !== id)
        }));
      },
      
      gerarAlertaEstoqueMinimo: (sabor) => {
        get().adicionarAlerta({
          tipo: "EstoqueAbaixoMinimo",
          titulo: "Estoque Abaixo do Mínimo",
          mensagem: `Estoque de ${sabor.nome} está abaixo do mínimo! Saldo atual: ${sabor.saldoAtual}, Mínimo: ${sabor.estoqueMinimo}`,
          lido: false,
          dados: {
            idSabor: sabor.id,
            nomeSabor: sabor.nome,
            saldoAtual: sabor.saldoAtual,
            estoqueMinimo: sabor.estoqueMinimo
          }
        });
      },
      
      gerarAlertaProximasEntregas: (data, quantidadePedidos, idsPedidos) => {
        const dataFormatada = data.toLocaleDateString('pt-BR');
        
        get().adicionarAlerta({
          tipo: "ProximasEntregas",
          titulo: "Entregas Pendentes",
          mensagem: `${quantidadePedidos} entregas agendadas para ${dataFormatada}`,
          lido: false,
          dados: {
            dataEntrega: data.toISOString().split('T')[0],
            quantidadePedidos,
            idsPedidos
          }
        });
      },
      
      gerarAlertaDeltaTolerancia: (idCliente, nomeCliente, deltaEfetivo, periodicidadePadrao, qpAntigo, qpNovo) => {
        get().adicionarAlerta({
          tipo: "DeltaForaTolerancia",
          titulo: "Recálculo de Qp",
          mensagem: `Recálculo de Qp para '${nomeCliente}' devido a Δ fora da tolerância`,
          lido: false,
          dados: {
            idCliente,
            nomeCliente,
            deltaEfetivo,
            periodicidadePadrao,
            qpAntigo,
            qpNovo
          }
        });
      },
      
      getAlertasNaoLidas: () => {
        return get().alertas.filter(alerta => !alerta.lido);
      },
      
      getAlertasPorTipo: (tipo) => {
        return get().alertas.filter(alerta => alerta.tipo === tipo);
      },
      
      getQuantidadeAlertasNaoLidas: () => {
        return get().alertas.filter(alerta => !alerta.lido).length;
      }
    }),
    { name: 'alerta-store' }
  )
);
