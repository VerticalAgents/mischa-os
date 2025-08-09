
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ItemInsuficiente {
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
}

interface ItemEntrega {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export const useExpedicaoStockValidation = () => {
  
  const validarEstoqueParaEntrega = async (itens: ItemEntrega[]): Promise<boolean> => {
    try {
      console.log('🔍 Validando estoque para entrega:', itens);
      
      if (!itens || itens.length === 0) {
        console.log('⚠️ Nenhum item para validar');
        return true; // Permitir entrega sem itens específicos
      }

      const itensInsuficientes: ItemInsuficiente[] = [];
      
      // Verificar estoque para cada item
      for (const item of itens) {
        if (!item.produto_id || item.quantidade <= 0) {
          console.log(`⚠️ Item inválido ignorado: ${item.produto_nome}`);
          continue;
        }

        // Buscar estoque atual do produto
        const { data: produto, error: produtoError } = await supabase
          .from('produtos_finais')
          .select('id, nome, estoque_atual')
          .eq('id', item.produto_id)
          .eq('ativo', true)
          .single();

        if (produtoError) {
          console.error(`❌ Erro ao buscar produto ${item.produto_nome}:`, produtoError);
          continue;
        }

        if (!produto) {
          console.log(`⚠️ Produto não encontrado: ${item.produto_nome}`);
          continue;
        }

        const estoqueAtual = produto.estoque_atual || 0;
        const quantidadeNecessaria = item.quantidade;
        
        console.log(`📦 ${produto.nome}: necessário ${quantidadeNecessaria}, disponível ${estoqueAtual}`);

        if (estoqueAtual < quantidadeNecessaria) {
          itensInsuficientes.push({
            nome: produto.nome,
            necessario: quantidadeNecessaria,
            disponivel: estoqueAtual,
            faltante: quantidadeNecessaria - estoqueAtual
          });
        }
      }

      // Se houver itens com estoque insuficiente, bloquear operação
      if (itensInsuficientes.length > 0) {
        const detalhes = itensInsuficientes
          .map(item => `• ${item.nome}: necessário ${item.necessario}, disponível ${item.disponivel} (falta ${item.faltante})`)
          .join('\n');

        console.log('❌ Estoque insuficiente:', itensInsuficientes);
        toast.error(`Estoque insuficiente para os seguintes produtos:\n${detalhes}`, {
          duration: 8000
        });
        return false;
      }

      console.log('✅ Estoque suficiente para todos os itens');
      return true;

    } catch (error) {
      console.error('❌ Erro na validação de estoque:', error);
      toast.error('Erro ao validar estoque');
      return false;
    }
  };

  const processarBaixaEstoque = async (entregaId: string, itens: ItemEntrega[]): Promise<boolean> => {
    try {
      console.log('📦 Processando baixa de estoque para entrega:', entregaId);
      
      if (!itens || itens.length === 0) {
        console.log('⚠️ Nenhum item para baixa');
        return true;
      }

      // Verificar se já existe movimentação para esta entrega (idempotência)
      const { data: movimentacoesExistentes, error: checkError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('id')
        .eq('referencia_tipo', 'entrega')
        .eq('referencia_id', entregaId)
        .limit(1);

      if (checkError) {
        console.error('❌ Erro ao verificar movimentações existentes:', checkError);
        throw checkError;
      }

      if (movimentacoesExistentes && movimentacoesExistentes.length > 0) {
        console.log('✅ Baixa já processada anteriormente para esta entrega');
        return true;
      }

      // Processar baixa para cada item
      for (const item of itens) {
        if (!item.produto_id || item.quantidade <= 0) {
          console.log(`⚠️ Item ignorado na baixa: ${item.produto_nome}`);
          continue;
        }

        console.log(`📉 Criando baixa: ${item.produto_nome} - ${item.quantidade} unidades`);

        const { error: movimentacaoError } = await supabase
          .from('movimentacoes_estoque_produtos')
          .insert({
            produto_id: item.produto_id,
            tipo: 'saida',
            quantidade: item.quantidade,
            data_movimentacao: new Date().toISOString(),
            referencia_tipo: 'entrega',
            referencia_id: entregaId,
            observacao: `Baixa automática - entrega confirmada`
          });

        if (movimentacaoError) {
          console.error(`❌ Erro ao criar baixa para ${item.produto_nome}:`, movimentacaoError);
          throw movimentacaoError;
        }
      }

      console.log('✅ Baixa de estoque processada com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao processar baixa de estoque:', error);
      toast.error('Erro ao processar baixa de estoque');
      return false;
    }
  };

  return {
    validarEstoqueParaEntrega,
    processarBaixaEstoque
  };
};
