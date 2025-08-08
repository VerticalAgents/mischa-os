
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InsumoInsuficiente {
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
  unidade: string;
}

export const useConfirmacaoProducao = () => {
  const [loading, setLoading] = useState(false);

  const confirmarProducao = async (registroId: string) => {
    setLoading(true);
    try {
      console.log('Iniciando confirmação de produção para registro:', registroId);

      // 1. Buscar o registro de produção
      const { data: registro, error: registroError } = await supabase
        .from('historico_producao')
        .select(`
          id, produto_id, produto_nome, formas_producidas, 
          rendimento_usado, unidades_previstas, status
        `)
        .eq('id', registroId)
        .single();

      if (registroError || !registro) {
        throw new Error('Registro de produção não encontrado');
      }

      if (registro.status !== 'Registrado') {
        toast({
          title: "Operação não permitida",
          description: "Apenas registros com status 'Registrado' podem ser confirmados",
          variant: "destructive"
        });
        return false;
      }

      // 2. Verificar se já existe movimentação (idempotência)
      const { data: movimentacoesExistentes } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('id')
        .eq('referencia_tipo', 'producao')
        .eq('referencia_id', registroId)
        .limit(1);

      if (movimentacoesExistentes && movimentacoesExistentes.length > 0) {
        toast({
          title: "Produção já confirmada",
          description: "Este registro já foi confirmado anteriormente",
          variant: "destructive"
        });
        return false;
      }

      // 3. Buscar a receita base do produto
      const { data: receitaBase, error: receitaError } = await supabase
        .from('rendimentos_receita_produto')
        .select(`
          receita_id,
          receitas_base!inner (
            id, nome,
            itens_receita (
              insumo_id, quantidade,
              insumos (nome, unidade_medida)
            )
          )
        `)
        .eq('produto_id', registro.produto_id)
        .single();

      if (receitaError || !receitaBase) {
        toast({
          title: "Receita não encontrada",
          description: "Não foi possível encontrar a receita para este produto",
          variant: "destructive"
        });
        return false;
      }

      const itensReceita = receitaBase.receitas_base.itens_receita;

      // 4. Calcular consumo de insumos e validar saldos
      const insumosInsuficientes: InsumoInsuficiente[] = [];
      
      for (const item of itensReceita) {
        const consumoTotal = item.quantidade * registro.formas_producidas;
        
        // Obter saldo atual do insumo
        const { data: saldo, error: saldoError } = await supabase
          .rpc('saldo_insumo', { i_id: item.insumo_id });

        if (saldoError) {
          console.error('Erro ao obter saldo do insumo:', saldoError);
          continue;
        }

        const saldoAtual = Number(saldo || 0);
        
        if (saldoAtual < consumoTotal) {
          insumosInsuficientes.push({
            nome: item.insumos.nome,
            necessario: consumoTotal,
            disponivel: saldoAtual,
            faltante: consumoTotal - saldoAtual,
            unidade: item.insumos.unidade_medida
          });
        }
      }

      // 5. Se houver insumos insuficientes, bloquear operação
      if (insumosInsuficientes.length > 0) {
        const detalhes = insumosInsuficientes
          .map(item => `• ${item.nome}: necessário ${item.necessario} ${item.unidade}, disponível ${item.disponivel} ${item.unidade} (falta ${item.faltante} ${item.unidade})`)
          .join('\n');

        toast({
          title: "Saldo insuficiente de insumos",
          description: `Os seguintes insumos não possuem saldo suficiente:\n${detalhes}`,
          variant: "destructive"
        });
        return false;
      }

      // 6. Executar transação para criar movimentações
      const { error: transacaoError } = await supabase.rpc('executar_confirmacao_producao', {
        p_registro_id: registroId,
        p_produto_id: registro.produto_id,
        p_unidades_previstas: registro.unidades_previstas,
        p_itens_receita: JSON.stringify(itensReceita.map(item => ({
          insumo_id: item.insumo_id,
          quantidade_total: item.quantidade * registro.formas_producidas
        })))
      });

      if (transacaoError) {
        // Se a função RPC não existir, executar manualmente
        console.log('Executando confirmação manual...');
        
        // Criar entrada de produtos
        const { error: entradaProdutoError } = await supabase
          .from('movimentacoes_estoque_produtos')
          .insert({
            produto_id: registro.produto_id,
            tipo: 'entrada',
            quantidade: Math.floor(registro.unidades_previstas || 0),
            data_movimentacao: new Date().toISOString(),
            referencia_tipo: 'producao',
            referencia_id: registroId,
            observacao: `Produção confirmada - ${registro.formas_producidas} formas`
          });

        if (entradaProdutoError) {
          throw new Error(`Erro ao criar entrada de produto: ${entradaProdutoError.message}`);
        }

        // Criar saídas de insumos
        for (const item of itensReceita) {
          const consumoTotal = item.quantidade * registro.formas_producidas;
          
          const { error: saidaInsumoError } = await supabase
            .from('movimentacoes_estoque_insumos')
            .insert({
              insumo_id: item.insumo_id,
              tipo: 'saida',
              quantidade: consumoTotal,
              data_movimentacao: new Date().toISOString(),
              referencia_tipo: 'producao',
              referencia_id: registroId,
              observacao: `Consumo de receita - ${registro.formas_producidas} formas`
            });

          if (saidaInsumoError) {
            throw new Error(`Erro ao criar saída de insumo: ${saidaInsumoError.message}`);
          }
        }

        // Atualizar status do registro
        const { error: updateError } = await supabase
          .from('historico_producao')
          .update({
            status: 'Confirmado',
            confirmado_em: new Date().toISOString()
          })
          .eq('id', registroId);

        if (updateError) {
          throw new Error(`Erro ao atualizar status: ${updateError.message}`);
        }
      }

      toast({
        title: "Produção confirmada com sucesso",
        description: `${registro.formas_producidas} formas de ${registro.produto_nome} confirmadas. Estoque atualizado.`
      });

      return true;

    } catch (error) {
      console.error('Erro ao confirmar produção:', error);
      toast({
        title: "Erro ao confirmar produção",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmarProducao,
    loading
  };
};
