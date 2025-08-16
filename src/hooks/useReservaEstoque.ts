
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useReservaEstoque = () => {
  const [loading, setLoading] = useState(false);

  const reservarItensEntrega = async (agendamentoId: string) => {
    setLoading(true);
    try {
      console.log('🔒 Iniciando reserva de itens para agendamento:', agendamentoId);

      // 1. Obter itens do agendamento
      const { data: itens, error: itensError } = await supabase.rpc('compute_entrega_itens_v2', {
        p_agendamento_id: agendamentoId
      });

      if (itensError) {
        throw new Error(`Erro ao calcular itens: ${itensError.message}`);
      }

      if (!itens || itens.length === 0) {
        throw new Error('Nenhum item encontrado para reservar');
      }

      // 2. Verificar estoque real para cada item
      const produtoIds = itens.map((item: any) => item.produto_id);
      
      // Calcular saldos reais manualmente para validação
      for (const item of itens) {
        // Saldo contábil
        const { data: saldoContabil, error: saldoError } = await supabase.rpc('saldo_produto', {
          p_id: item.produto_id
        });

        if (saldoError) {
          throw new Error(`Erro ao verificar saldo de ${item.produto_nome}: ${saldoError.message}`);
        }

        // Reservas ativas existentes
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 90);

        const { data: reservasExistentes, error: reservasError } = await supabase
          .from('movimentacoes_estoque_produtos')
          .select('quantidade, tipo')
          .eq('produto_id', item.produto_id)
          .eq('referencia_tipo', 'reserva')
          .in('tipo', ['reserva', 'reserva_cancelada', 'reserva_consumida'])
          .gte('data_movimentacao', dataLimite.toISOString());

        if (reservasError) {
          throw new Error(`Erro ao verificar reservas de ${item.produto_nome}: ${reservasError.message}`);
        }

        // Calcular reservado ativo
        let reservadoAtivo = 0;
        (reservasExistentes || []).forEach(res => {
          if (res.tipo === 'reserva') {
            reservadoAtivo += Number(res.quantidade);
          } else if (res.tipo === 'reserva_cancelada' || res.tipo === 'reserva_consumida') {
            reservadoAtivo -= Number(res.quantidade);
          }
        });

        const saldoReal = Math.max(Number(saldoContabil || 0) - Math.max(reservadoAtivo, 0), 0);

        if (saldoReal < Number(item.quantidade)) {
          throw new Error(
            `Estoque real insuficiente para ${item.produto_nome}. ` +
            `Necessário: ${item.quantidade}, Disponível: ${saldoReal} ` +
            `(Contábil: ${saldoContabil}, Reservado: ${Math.max(reservadoAtivo, 0)})`
          );
        }
      }

      // 3. Gerar UUID único para esta reserva
      const reservationUUID = crypto.randomUUID();

      // 4. Inserir reservas
      const movimentacoes = itens.map((item: any) => ({
        produto_id: item.produto_id,
        quantidade: Number(item.quantidade),
        tipo: 'reserva',
        data_movimentacao: new Date().toISOString(),
        referencia_tipo: 'reserva',
        referencia_id: reservationUUID,
        observacao: `agendamento=${agendamentoId};origem=separacao`
      }));

      const { error: insertError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .insert(movimentacoes);

      if (insertError) {
        throw new Error(`Erro ao registrar reservas: ${insertError.message}`);
      }

      console.log(`✅ Reserva criada com UUID: ${reservationUUID}`);
      
      toast({
        title: "Itens reservados",
        description: `${itens.length} produto(s) reservado(s) para separação`,
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao reservar itens:', error);
      toast({
        title: "Erro ao reservar itens",
        description: error instanceof Error ? error.message : "Erro inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const desfazerReserva = async (agendamentoId: string) => {
    setLoading(true);
    try {
      console.log('🔓 Desfazendo reserva para agendamento:', agendamentoId);

      // 1. Buscar reservas ativas deste agendamento
      const { data: reservasAtivas, error: buscaError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('produto_id, quantidade, referencia_id')
        .eq('referencia_tipo', 'reserva')
        .eq('tipo', 'reserva')
        .ilike('observacao', `agendamento=${agendamentoId}%`);

      if (buscaError) {
        throw new Error(`Erro ao buscar reservas: ${buscaError.message}`);
      }

      if (!reservasAtivas || reservasAtivas.length === 0) {
        toast({
          title: "Nenhuma reserva encontrada",
          description: "Não há reservas ativas para desfazer",
          variant: "destructive"
        });
        return false;
      }

      // 2. Criar movimentações de cancelamento
      const cancelamentos = reservasAtivas.map(reserva => ({
        produto_id: reserva.produto_id,
        quantidade: Number(reserva.quantidade),
        tipo: 'reserva_cancelada',
        data_movimentacao: new Date().toISOString(),
        referencia_tipo: 'reserva',
        referencia_id: reserva.referencia_id,
        observacao: `agendamento=${agendamentoId};origem=desfazer`
      }));

      const { error: cancelError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .insert(cancelamentos);

      if (cancelError) {
        throw new Error(`Erro ao cancelar reservas: ${cancelError.message}`);
      }

      console.log(`✅ ${reservasAtivas.length} reserva(s) cancelada(s)`);
      
      toast({
        title: "Reserva cancelada",
        description: `${reservasAtivas.length} produto(s) liberado(s) do estoque`,
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao desfazer reserva:', error);
      toast({
        title: "Erro ao desfazer reserva",
        description: error instanceof Error ? error.message : "Erro inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const consumirReserva = async (agendamentoId: string) => {
    try {
      console.log('✅ Consumindo reserva para agendamento:', agendamentoId);

      // 1. Buscar reservas ativas deste agendamento
      const { data: reservasAtivas, error: buscaError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('produto_id, quantidade, referencia_id')
        .eq('referencia_tipo', 'reserva')
        .eq('tipo', 'reserva')
        .ilike('observacao', `agendamento=${agendamentoId}%`);

      if (buscaError) {
        console.error('Erro ao buscar reservas para consumo:', buscaError);
        return;
      }

      if (!reservasAtivas || reservasAtivas.length === 0) {
        console.log('Nenhuma reserva ativa encontrada para consumir');
        return;
      }

      // 2. Criar movimentações de consumo
      const consumos = reservasAtivas.map(reserva => ({
        produto_id: reserva.produto_id,
        quantidade: Number(reserva.quantidade),
        tipo: 'reserva_consumida',
        data_movimentacao: new Date().toISOString(),
        referencia_tipo: 'reserva',
        referencia_id: reserva.referencia_id,
        observacao: `agendamento=${agendamentoId};origem=entrega`
      }));

      const { error: consumoError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .insert(consumos);

      if (consumoError) {
        console.error('Erro ao consumir reservas:', consumoError);
        return;
      }

      console.log(`✅ ${reservasAtivas.length} reserva(s) consumida(s)`);
    } catch (error) {
      console.error('❌ Erro ao consumir reserva:', error);
    }
  };

  return {
    reservarItensEntrega,
    desfazerReserva,
    consumirReserva,
    loading
  };
};
