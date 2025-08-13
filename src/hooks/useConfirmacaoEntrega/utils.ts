
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ProdutoInsuficiente {
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
}

export interface PedidoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  quantidade_total: number;
  tipo_pedido: string;
  itens_personalizados?: any;
}

// Gerar ID único para cada execução
export const gerarIdExecucao = (): string => uuidv4();

// Calcular itens usando RPC no servidor (fonte única da verdade)
export const calcularItensEntrega = async (pedido: PedidoEntrega) => {
  console.log('🧮 [RPC] Calculando itens para entrega usando v2:', pedido.id);
  try {
    // Garantir que o ID seja uma string válida
    const agendamentoId = String(pedido.id).trim();
    console.log('🔍 ID do agendamento para cálculo:', agendamentoId, typeof agendamentoId);

    const { data, error } = await supabase.rpc('compute_entrega_itens_v2', {
      p_agendamento_id: agendamentoId
    });

    if (error) {
      console.error('❌ Erro ao calcular itens via RPC v2:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem completa:', error.message);
      console.error('❌ Detalhes:', error.details);
      
      // Melhorar mensagens de erro baseadas no tipo
      if (error.message.includes('proporção padrão configurada')) {
        throw new Error(`Configuração incompleta para ${pedido.cliente_nome}: Não há proporções padrão configuradas ou produtos ativos. Verifique as configurações em Configurações > Proporções.`);
      } else if (error.message.includes('Agendamento') && error.message.includes('não encontrado')) {
        throw new Error(`Agendamento de ${pedido.cliente_nome} não encontrado no sistema.`);
      } else if (error.message.includes('quantidade total deve ser maior')) {
        throw new Error(`Quantidade inválida para ${pedido.cliente_nome}: a quantidade total deve ser maior que zero.`);
      } else if (error.message.includes('Nenhum item válido encontrado')) {
        throw new Error(`Itens personalizados inválidos para ${pedido.cliente_nome}: verifique se os produtos estão ativos e as quantidades são válidas.`);
      } else {
        throw new Error(`Erro ao calcular itens para ${pedido.cliente_nome}: ${error.message}`);
      }
    }

    if (!data || data.length === 0) {
      throw new Error(`Não foi possível calcular itens para ${pedido.cliente_nome}. Verifique se há produtos ativos ou proporções configuradas.`);
    }

    const itens = data.map((item: any) => ({
      produto_id: item.produto_id as string,
      produto_nome: item.produto_nome as string,
      quantidade: Number(item.quantidade || 0)
    }));

    console.log('📦 Itens calculados (server v2):', itens);
    return itens;
  } catch (error) {
    console.error('❌ Erro fatal ao calcular itens:', error);
    throw error;
  }
};

export const obterSaldoProduto = async (produtoId: string): Promise<number> => {
  try {
    // Garantir que o ID seja uma string válida
    const produtoIdValidado = String(produtoId).trim();
    console.log('🔍 Consultando saldo do produto:', produtoIdValidado, typeof produtoIdValidado);

    const { data, error } = await supabase.rpc('saldo_produto', {
      p_id: produtoIdValidado
    });

    if (error) {
      console.error('❌ Erro ao obter saldo do produto:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem completa:', error.message);
      return 0;
    }

    const saldo = Number(data || 0);
    console.log('📊 Saldo obtido:', saldo);
    return saldo;
  } catch (error) {
    console.error('❌ Erro ao obter saldo do produto:', error);
    return 0;
  }
};

export const validarEstoqueDisponivel = async (itensEntrega: any[]): Promise<ProdutoInsuficiente[]> => {
  const produtosInsuficientes: ProdutoInsuficiente[] = [];
  
  for (const item of itensEntrega) {
    if (!item.produto_id || Number(item.quantidade) <= 0) continue;

    const saldoAtual = await obterSaldoProduto(item.produto_id);
    const quantidadeNecessaria = Number(item.quantidade);
    
    if (saldoAtual < quantidadeNecessaria) {
      produtosInsuficientes.push({
        nome: item.produto_nome,
        necessario: quantidadeNecessaria,
        disponivel: saldoAtual,
        faltante: quantidadeNecessaria - saldoAtual
      });
    }
  }

  return produtosInsuficientes;
};
