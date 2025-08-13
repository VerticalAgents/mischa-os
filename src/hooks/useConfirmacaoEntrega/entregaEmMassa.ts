
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  PedidoEntrega, 
  ProdutoInsuficiente,
  calcularItensEntrega, 
  validarEstoqueDisponivel, 
  gerarIdExecucao 
} from './utils';

export const confirmarEntregaEmMassa = async (pedidos: PedidoEntrega[]): Promise<boolean> => {
  try {
    console.log('🚚 Iniciando confirmação de entregas em massa idempotente:', pedidos.length);

    // 1) Pré-validação: tentar calcular itens para todos os pedidos
    const pedidosComItens: Array<{ pedido: PedidoEntrega; itens: any[] }> = [];
    const pedidosComErro: string[] = [];

    for (const pedido of pedidos) {
      try {
        const itensEntrega = await calcularItensEntrega(pedido);
        pedidosComItens.push({ pedido, itens: itensEntrega });
      } catch (error) {
        console.error(`Erro ao calcular itens para ${pedido.cliente_nome}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        pedidosComErro.push(`${pedido.cliente_nome}: ${errorMsg}`);
      }
    }

    // Se há pedidos com erro, abortar operação
    if (pedidosComErro.length > 0) {
      const detalhesErro = pedidosComErro.join('\n');
      toast({
        title: "Erro na pré-validação",
        description: `Não foi possível calcular itens para alguns pedidos:\n${detalhesErro}`,
        variant: "destructive"
      });
      return false;
    }

    // 2) Agregar necessidades por produto
    const todosProdutosNecessarios: Record<string, { quantidade: number; nome: string }> = {};

    for (const { itens } of pedidosComItens) {
      for (const item of itens) {
        if (!item.produto_id || Number(item.quantidade) <= 0) continue;
        
        if (!todosProdutosNecessarios[item.produto_id]) {
          todosProdutosNecessarios[item.produto_id] = { 
            quantidade: 0, 
            nome: item.produto_nome 
          };
        }
        todosProdutosNecessarios[item.produto_id].quantidade += Number(item.quantidade);
      }
    }

    // 3) Validar saldos consolidados
    const produtosInsuficientes: ProdutoInsuficiente[] = [];
    
    for (const [produtoId, { quantidade: quantidadeTotal, nome }] of Object.entries(todosProdutosNecessarios)) {
      const { data, error } = await supabase.rpc('saldo_produto', { p_id: produtoId });
      const saldoAtual = error ? 0 : Number(data || 0);
      
      if (saldoAtual < quantidadeTotal) {
        produtosInsuficientes.push({
          nome,
          necessario: quantidadeTotal,
          disponivel: saldoAtual,
          faltante: quantidadeTotal - saldoAtual
        });
      }
    }

    if (produtosInsuficientes.length > 0) {
      const detalhes = produtosInsuficientes
        .map(item => `• ${item.nome}: necessário ${item.necessario}, disponível ${item.disponivel} (falta ${item.faltante})`)
        .join('\n');

      toast({
        title: "Estoque insuficiente para entrega em massa",
        description: `Os seguintes produtos não possuem estoque suficiente:\n${detalhes}`,
        variant: "destructive"
      });
      return false;
    }

    // 4) Processar cada entrega usando função idempotente (um ID único por pedido) 
    let sucesso = 0;
    const erros: string[] = [];
    
    for (const { pedido } of pedidosComItens) {
      try {
        const idExecucao = gerarIdExecucao(); // ID único para cada pedido
        console.log(`🔑 Processando ${pedido.cliente_nome} com ID:`, idExecucao);

        const { error: procError } = await supabase.rpc('process_entrega_idempotente', {
          p_agendamento_id: pedido.id,
          p_execucao_id: idExecucao,
          p_observacao: null
        });

        if (procError) {
          console.error(`Erro ao processar entrega do cliente ${pedido.cliente_nome}:`, procError);
          erros.push(`${pedido.cliente_nome}: ${procError.message}`);
          continue;
        }
        sucesso += 1;
      } catch (error) {
        console.error(`Erro fatal ao processar entrega do cliente ${pedido.cliente_nome}:`, error);
        erros.push(`${pedido.cliente_nome}: ${error instanceof Error ? error.message : 'Erro inesperado'}`);
      }
    }

    if (sucesso === 0) {
      toast({
        title: "Falha ao confirmar entregas",
        description: erros.length > 0 ? erros.join('\n') : "Nenhuma entrega foi processada com sucesso.",
        variant: "destructive"
      });
      return false;
    }

    if (erros.length > 0) {
      toast({
        title: "Entregas parcialmente confirmadas",
        description: `${sucesso} de ${pedidos.length} entregas confirmadas. Erros: ${erros.join(', ')}`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Entregas confirmadas",
        description: `${sucesso} de ${pedidos.length} entregas confirmadas com baixa automática no estoque.`,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na confirmação em massa:', error);
    toast({
      title: "Erro na confirmação em massa",
      description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
      variant: "destructive"
    });
    return false;
  }
};
