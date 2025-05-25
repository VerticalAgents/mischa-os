
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { Sabor } from '../types';
import { saboresMock } from '../data/mockData';
import { validarPercentuaisSabores } from '../utils/calculations';

interface SaborStore {
  sabores: Sabor[];
  saborAtual: Sabor | null;
  modoDirecaoPercentual: boolean; // true = ajuste automático, false = manual
  
  // Ações
  setSabores: (sabores: Sabor[]) => void;
  adicionarSabor: (sabor: Omit<Sabor, 'id'>) => void;
  atualizarSabor: (id: number, dadosSabor: Partial<Sabor>) => void;
  removerSabor: (id: number) => void;
  selecionarSabor: (id: number | null) => void;
  atualizarSaldoEstoque: (id: number, quantidade: number, isEntrada: boolean) => void;
  setModoDirecaoPercentual: (modo: boolean) => void;
  
  // Atualização de percentuais
  atualizarPercentual: (id: number, novoPercentual: number) => void;
  distribuirPercentualRestante: () => void;
  
  // Getters
  getSaboresAtivos: () => Sabor[];
  getSaborPorId: (id: number) => Sabor | undefined;
  getTotalPercentual: () => number;
  isPercentualValido: () => boolean;
}

export const useSaborStore = create<SaborStore>()(
  devtools(
    (set, get) => ({
      sabores: saboresMock,
      saborAtual: null,
      modoDirecaoPercentual: true,
      
      setSabores: (sabores) => set({ sabores }),
      
      adicionarSabor: (sabor) => {
        const novoId = Math.max(0, ...get().sabores.map(s => s.id)) + 1;
        
        set(state => ({
          sabores: [
            ...state.sabores,
            {
              ...sabor,
              id: novoId
            }
          ]
        }));
        
        // Se o novo sabor estiver ativo e tiver percentual, redistribuir os percentuais
        if (sabor.ativo && sabor.percentualPadraoDist > 0) {
          get().distribuirPercentualRestante();
        }
      },
      
      atualizarSabor: (id, dadosSabor) => {
        const saborAtual = get().sabores.find(s => s.id === id);
        
        if (!saborAtual) return;
        
        // Verificar se o status ativo ou o percentual mudou
        const mudouAtivo = 'ativo' in dadosSabor && dadosSabor.ativo !== saborAtual.ativo;
        const mudouPercentual = 'percentualPadraoDist' in dadosSabor && 
          dadosSabor.percentualPadraoDist !== saborAtual.percentualPadraoDist;
        
        set(state => ({
          sabores: state.sabores.map(sabor => 
            sabor.id === id ? { ...sabor, ...dadosSabor } : sabor
          )
        }));
        
        // Se mudou ativo ou percentual, redistribuir os percentuais
        if (mudouAtivo || mudouPercentual) {
          get().distribuirPercentualRestante();
        }
      },
      
      removerSabor: (id) => {
        set(state => ({
          sabores: state.sabores.filter(sabor => sabor.id !== id),
          saborAtual: state.saborAtual?.id === id ? null : state.saborAtual
        }));
        
        // Redistribuir percentuais após remover
        get().distribuirPercentualRestante();
      },
      
      selecionarSabor: (id) => {
        if (id === null) {
          set({ saborAtual: null });
          return;
        }
        
        const sabor = get().sabores.find(s => s.id === id);
        set({ saborAtual: sabor || null });
      },
      
      atualizarSaldoEstoque: (id, quantidade, isEntrada) => {
        set(state => ({
          sabores: state.sabores.map(sabor => {
            if (sabor.id === id) {
              const novoSaldo = isEntrada 
                ? sabor.saldoAtual + quantidade 
                : Math.max(0, sabor.saldoAtual - quantidade);
              
              return { ...sabor, saldoAtual: novoSaldo };
            }
            return sabor;
          })
        }));
        
        // Verificar se o novo saldo está abaixo do mínimo
        const sabor = get().sabores.find(s => s.id === id);
        if (sabor && sabor.saldoAtual < sabor.estoqueMinimo) {
          toast({
            title: "Alerta de estoque",
            description: `Estoque de ${sabor.nome} está abaixo do mínimo (${sabor.saldoAtual}/${sabor.estoqueMinimo})`,
            variant: "destructive"
          });
        }
      },
      
      setModoDirecaoPercentual: (modo) => set({ modoDirecaoPercentual: modo }),
      
      atualizarPercentual: (id, novoPercentual) => {
        // Atualizar o percentual de um sabor
        set(state => ({
          sabores: state.sabores.map(sabor => 
            sabor.id === id ? { ...sabor, percentualPadraoDist: novoPercentual } : sabor
          )
        }));
        
        // Se estiver em modo de ajuste automático, redistribuir os percentuais
        if (get().modoDirecaoPercentual) {
          get().distribuirPercentualRestante();
        }
      },
      
      distribuirPercentualRestante: () => {
        const { sabores } = get();
        const saboresAtivos = sabores.filter(s => s.ativo);
        
        if (saboresAtivos.length === 0) return;
        
        const totalAtual = saboresAtivos.reduce((sum, s) => sum + s.percentualPadraoDist, 0);
        
        // Se o total já é 100%, não precisamos ajustar
        if (Math.abs(totalAtual - 100) < 0.001) return;
        
        // Calcular quanto falta ou sobra para 100%
        const diferenca = 100 - totalAtual;
        
        // Distribuir proporcionalmente entre os sabores ativos
        const saboresAjustados = saboresAtivos.map(sabor => {
          // Calcular a proporção deste sabor no total
          const proporcao = sabor.percentualPadraoDist / totalAtual;
          
          // Ajustar o percentual proporcionalmente
          const ajuste = diferenca * proporcao;
          const novoPercentual = Math.max(0, sabor.percentualPadraoDist + ajuste);
          
          return {
            ...sabor,
            percentualPadraoDist: Math.round(novoPercentual * 100) / 100 // Arredondar para 2 casas decimais
          };
        });
        
        // Verificar se após o arredondamento ainda somam 100%
        const totalAposAjuste = saboresAjustados.reduce((sum, s) => sum + s.percentualPadraoDist, 0);
        if (Math.abs(totalAposAjuste - 100) > 0.1) {
          // Fazer um ajuste fino no maior percentual
          const saborComMaiorPercentual = [...saboresAjustados].sort((a, b) => 
            b.percentualPadraoDist - a.percentualPadraoDist
          )[0];
          
          const ajusteFino = 100 - totalAposAjuste;
          
          saboresAjustados.forEach(sabor => {
            if (sabor.id === saborComMaiorPercentual.id) {
              sabor.percentualPadraoDist = Math.round((sabor.percentualPadraoDist + ajusteFino) * 100) / 100;
            }
          });
        }
        
        // Atualizar os sabores no store
        set(state => ({
          sabores: state.sabores.map(sabor => {
            const saborAjustado = saboresAjustados.find(s => s.id === sabor.id);
            return saborAjustado ? { ...sabor, ...saborAjustado } : sabor;
          })
        }));
      },
      
      getSaboresAtivos: () => {
        return get().sabores.filter(sabor => sabor.ativo);
      },
      
      getSaborPorId: (id) => {
        return get().sabores.find(s => s.id === id);
      },
      
      getTotalPercentual: () => {
        const saboresAtivos = get().sabores.filter(s => s.ativo);
        return saboresAtivos.reduce((sum, s) => sum + s.percentualPadraoDist, 0);
      },
      
      isPercentualValido: () => {
        return validarPercentuaisSabores(get().sabores);
      }
    }),
    { name: 'sabor-store' }
  )
);
