import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export interface FrequenciaRealInfo {
  frequenciaReal: number | null;
  numeroEntregas: number;
  primeiraEntrega: Date | null;
  ultimaEntrega: Date | null;
}

export function useFrequenciaRealEntregas(clienteIds: string[]) {
  return useQuery({
    queryKey: ['frequencia-real-entregas', clienteIds.sort().join(',')],
    queryFn: async () => {
      if (clienteIds.length === 0) {
        return new Map<string, FrequenciaRealInfo>();
      }

      // Buscar entregas dos últimos 84 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 84);

      const { data, error } = await supabase
        .from('historico_entregas')
        .select('cliente_id, data')
        .in('cliente_id', clienteIds)
        .eq('tipo', 'entrega')
        .gte('data', dataLimite.toISOString())
        .order('data', { ascending: true });

      if (error) throw error;

      // Agrupar por cliente e calcular frequência
      const frequenciasMap = new Map<string, FrequenciaRealInfo>();
      const entregasPorCliente = new Map<string, Date[]>();

      data?.forEach(registro => {
        if (!entregasPorCliente.has(registro.cliente_id)) {
          entregasPorCliente.set(registro.cliente_id, []);
        }
        entregasPorCliente.get(registro.cliente_id)!.push(new Date(registro.data));
      });

      // Inicializar todos os clientes solicitados
      clienteIds.forEach(clienteId => {
        if (!entregasPorCliente.has(clienteId)) {
          frequenciasMap.set(clienteId, {
            frequenciaReal: null,
            numeroEntregas: 0,
            primeiraEntrega: null,
            ultimaEntrega: null,
          });
        }
      });

      entregasPorCliente.forEach((datas, clienteId) => {
        if (datas.length < 2) {
          frequenciasMap.set(clienteId, {
            frequenciaReal: null,
            numeroEntregas: datas.length,
            primeiraEntrega: datas[0] || null,
            ultimaEntrega: datas[datas.length - 1] || null,
          });
        } else {
          const primeira = datas[0];
          const ultima = datas[datas.length - 1];
          const diasTotal = differenceInDays(ultima, primeira);
          const frequencia = Math.round(diasTotal / (datas.length - 1));
          
          frequenciasMap.set(clienteId, {
            frequenciaReal: frequencia,
            numeroEntregas: datas.length,
            primeiraEntrega: primeira,
            ultimaEntrega: ultima,
          });
        }
      });

      return frequenciasMap;
    },
    staleTime: 5 * 60 * 1000,
    enabled: clienteIds.length > 0,
  });
}

export function getCorDivergencia(periodicidadeConfig: number, frequenciaReal: number | null): {
  cor: 'green' | 'yellow' | 'red' | 'gray';
  direcao: 'up' | 'down' | 'equal';
  classe: string;
} {
  if (frequenciaReal === null) {
    return { cor: 'gray', direcao: 'equal', classe: 'text-muted-foreground' };
  }
  
  const divergencia = Math.abs(frequenciaReal - periodicidadeConfig) / periodicidadeConfig;
  
  if (divergencia <= 0.2) {
    return { cor: 'green', direcao: 'equal', classe: 'text-green-600' };
  } else if (divergencia <= 0.4) {
    return { 
      cor: 'yellow', 
      direcao: frequenciaReal > periodicidadeConfig ? 'up' : 'down', 
      classe: 'text-yellow-600' 
    };
  } else {
    return { 
      cor: 'red', 
      direcao: frequenciaReal > periodicidadeConfig ? 'up' : 'down', 
      classe: 'text-red-600' 
    };
  }
}
