
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

    // 4) Execução idempotente no banco usando nova função - CORRIGIDO: garantir que todos os parâmetros sejam do tipo correto
    const { error: procError } = await supabase.rpc('process_entrega_idempotente', {
      p_agendamento_id: pedido.id, // string UUID
      p_execucao_id: idExecucao, // string UUID gerado
      p_observacao: observacao || null // string ou null
    });

    if (procError) {
      console.error('Erro no processamento da entrega idempotente:', procError);
      
      // Melhorar mensagens de erro
      let errorMessage = procError.message || "Ocorreu um erro inesperado";
      if (procError.message.includes('já processada')) {
        errorMessage = `A entrega de ${pedido.cliente_nome} já foi processada anteriormente.`;
      } else if (procError.message.includes('Saldo insuficiente')) {
        errorMessage = `Estoque insuficiente detectado durante o processamento da entrega de ${pedido.cliente_nome}. ${procError.message}`;
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
