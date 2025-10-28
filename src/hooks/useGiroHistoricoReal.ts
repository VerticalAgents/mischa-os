import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GiroHistoricoInfo {
  giroSemanal: number;
  numeroSemanas: number;
  origem: 'historico_completo' | 'historico_parcial' | 'projetado' | 'personalizado';
}

/**
 * Hook para buscar e calcular giro semanal histórico real dos clientes
 * Usa média das últimas 12 semanas quando disponível, ou média desde primeira entrega
 */
export function useGiroHistoricoReal(clienteIds: string[]) {
  return useQuery({
    queryKey: ['giros-historicos-reais', clienteIds.sort().join(',')],
    queryFn: async () => {
      if (clienteIds.length === 0) {
        return new Map<string, GiroHistoricoInfo>();
      }

      console.log(`📊 [GiroHistórico] Calculando giro real para ${clienteIds.length} clientes...`);

      // Buscar histórico consolidado das últimas 12 semanas para todos os clientes
      const { data, error } = await supabase
        .from('historico_giro_semanal_consolidado')
        .select('cliente_id, giro_semanal, semana')
        .in('cliente_id', clienteIds)
        .order('semana', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico consolidado:', error);
        return new Map<string, GiroHistoricoInfo>();
      }

      // Agrupar por cliente e calcular médias
      const girosMap = new Map<string, GiroHistoricoInfo>();
      const registrosPorCliente = new Map<string, any[]>();

      // Agrupar registros por cliente
      data?.forEach(registro => {
        if (!registrosPorCliente.has(registro.cliente_id)) {
          registrosPorCliente.set(registro.cliente_id, []);
        }
        registrosPorCliente.get(registro.cliente_id)!.push(registro);
      });

      // Calcular média para cada cliente
      registrosPorCliente.forEach((registros, clienteId) => {
        // Ordenar registros deste cliente por semana DESC e pegar até as últimas 12 semanas
        const registrosOrdenados = registros.sort((a, b) => 
          new Date(b.semana).getTime() - new Date(a.semana).getTime()
        );
        const ultimas12 = registrosOrdenados.slice(0, 12);
        const totalGiro = ultimas12.reduce((sum, reg) => sum + (reg.giro_semanal || 0), 0);
        const numeroSemanas = ultimas12.length;
        const mediaGiro = numeroSemanas > 0 ? Math.round(totalGiro / numeroSemanas) : 0;

        const origem: GiroHistoricoInfo['origem'] = 
          numeroSemanas >= 12 ? 'historico_completo' : 
          numeroSemanas > 0 ? 'historico_parcial' : 
          'projetado';

        girosMap.set(clienteId, {
          giroSemanal: mediaGiro,
          numeroSemanas,
          origem
        });

        if (numeroSemanas > 0) {
          console.log(`  ✓ Cliente ${clienteId.substring(0, 8)}: ${numeroSemanas} semanas, média ${mediaGiro} un/sem (${origem})`);
        }
      });

      const comHistorico12 = Array.from(girosMap.values()).filter(g => g.origem === 'historico_completo').length;
      const comHistoricoParcial = Array.from(girosMap.values()).filter(g => g.origem === 'historico_parcial').length;

      console.log(`📊 [GiroHistórico] Resumo: ${comHistorico12} com 12 sem, ${comHistoricoParcial} parcial, ${clienteIds.length - comHistorico12 - comHistoricoParcial} projetados`);

      return girosMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: clienteIds.length > 0,
  });
}
