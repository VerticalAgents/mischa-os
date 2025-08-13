
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  PedidoEntrega, 
  ProdutoInsuficiente,
  calcularItensEntrega, 
  validarEstoqueDisponivel, 
  gerarIdExecucao 
} from './utils';

export const confirmarEntregaSimples = async (pedido: PedidoEntrega, observacao?: string): Promise<boolean> => {
  try {
    console.log('🚚 Iniciando confirmação de entrega idempotente:', pedido.id);
    console.log('📋 Dados do pedido:', JSON.stringify(pedido, null, 2));

    // 1) Calcular itens via servidor usando a nova função
    const itensEntrega = await calcularItensEntrega(pedido);
    if (itensEntrega.length === 0) {
      toast({
        title: "Erro na validação",
        description: "Não foi possível calcular os itens necessários para a entrega",
        variant: "destructive"
      });
      return false;
    }

    // 2) Validação de estoque (feedback imediato e detalhado)
    const produtosInsuficientes = await validarEstoqueDisponivel(itensEntrega);
    if (produtosInsuficientes.length > 0) {
      const detalhes = produtosInsuficientes
        .map(item => `• ${item.nome}: necessário ${item.necessario}, disponível ${item.disponivel} (falta ${item.faltante})`)
        .join('\n');

      toast({
        title: "Estoque insuficiente",
        description: `Os seguintes produtos não possuem estoque suficiente:\n${detalhes}`,
        variant: "destructive"
      });
      return false;
    }

    // 3) Gerar ID único para esta execução
    const idExecucao = gerarIdExecucao();
    console.log('🔑 ID de execução gerado:', idExecucao);

    // 4) Validar tipos antes de enviar para RPC
    const agendamentoIdValidado = String(pedido.id).trim();
    const execucaoIdValidado = String(idExecucao).trim();
    const observacaoValidada = observacao ? String(observacao).trim() : null;
    
    console.log('🔍 Parâmetros validados para RPC:');
    console.log('- p_agendamento_id:', agendamentoIdValidado, typeof agendamentoIdValidado);
    console.log('- p_execucao_id:', execucaoIdValidado, typeof execucaoIdValidado);
    console.log('- p_observacao:', observacaoValidada, typeof observacaoValidada);

    // 5) Execução idempotente no banco
    const { error: procError } = await supabase.rpc('process_entrega_idempotente', {
      p_agendamento_id: agendamentoIdValidado,
      p_execucao_id: execucaoIdValidado,
      p_observacao: observacaoValidada
    });

    if (procError) {
      console.error('❌ Erro detalhado na RPC:', procError);
      console.error('❌ Código do erro:', procError.code);
      console.error('❌ Mensagem completa:', procError.message);
      console.error('❌ Detalhes:', procError.details);
      console.error('❌ Hint:', procError.hint);
      
      // Melhorar mensagens de erro
      let errorMessage = procError.message || "Ocorreu um erro inesperado";
      if (procError.message.includes('já processada')) {
        errorMessage = `A entrega de ${pedido.cliente_nome} já foi processada anteriormente.`;
      } else if (procError.message.includes('Saldo insuficiente')) {
        errorMessage = `Estoque insuficiente detectado durante o processamento da entrega de ${pedido.cliente_nome}. ${procError.message}`;
      } else if (procError.message.includes('invalid input syntax for type boolean')) {
        errorMessage = `Erro de validação de dados na entrega de ${pedido.cliente_nome}. Contate o suporte técnico.`;
      }
      
      toast({
        title: "Erro ao confirmar entrega",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Entrega confirmada",
      description: `Entrega para ${pedido.cliente_nome} confirmada com baixa automática no estoque.`,
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao confirmar entrega:', error);
    toast({
      title: "Erro ao confirmar entrega",
      description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
      variant: "destructive"
    });
    return false;
  }
};
