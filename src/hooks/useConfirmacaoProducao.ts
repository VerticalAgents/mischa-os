
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InsumoInsuficiente {
  insumo_id: string;
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
  unidade: string;
}

export interface ResultadoConfirmacao {
  ok: boolean;
  motivo?: 'insumos_insuficientes' | 'erro';
  insumos?: InsumoInsuficiente[];
}

export const useConfirmacaoProducao = () => {
  const [loading, setLoading] = useState(false);

  const confirmarProducao = async (
    registroId: string,
    opcoes?: { reporInsumosFaltantes?: boolean }
  ): Promise<ResultadoConfirmacao> => {
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
        return { ok: false, motivo: 'erro' };
      }

      // 2. Verificar se já existe movimentação (idempotência)
      const { data: movimentacoesExistentes } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('id')
        .eq('referencia_tipo', 'producao')
        .eq('referencia_id', registroId)
        .limit(1);

      if (movimentacoesExistentes && movimentacoesExistentes.length > 0) {
        // Movimentações já existem - verificar se é uma confirmação parcial
        if (registro.status === 'Registrado') {
          // Caso de falha parcial: movimentações criadas mas status não atualizado
          console.log('Detectada confirmação parcial - atualizando status...');
          const { error: updateError } = await supabase
            .from('historico_producao')
            .update({ status: 'Confirmado', confirmado_em: new Date().toISOString() })
            .eq('id', registroId);

          if (updateError) {
            throw new Error(`Erro ao atualizar status: ${updateError.message}`);
          }

          toast({
            title: "Produção confirmada com sucesso",
            description: `Registro de ${registro.produto_nome} atualizado para confirmado.`
          });
          return { ok: true };
        }

        toast({
          title: "Produção já confirmada",
          description: "Este registro já foi confirmado anteriormente",
          variant: "destructive"
        });
        return { ok: false, motivo: 'erro' };
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
        return { ok: false, motivo: 'erro' };
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

        // Tolerância para evitar falso negativo por arredondamento de ponto flutuante
        if (saldoAtual + 1e-6 < consumoTotal) {
          insumosInsuficientes.push({
            insumo_id: item.insumo_id,
            nome: item.insumos.nome,
            necessario: consumoTotal,
            disponivel: saldoAtual,
            faltante: Number((consumoTotal - saldoAtual).toFixed(4)),
            unidade: item.insumos.unidade_medida
          });
        }
      }

      // 5. Se houver insumos insuficientes: devolver para a UI ou repor automaticamente
      if (insumosInsuficientes.length > 0) {
        if (!opcoes?.reporInsumosFaltantes) {
          return { ok: false, motivo: 'insumos_insuficientes', insumos: insumosInsuficientes };
        }

        // Repor automaticamente o faltante como entrada de ajuste
        for (const item of insumosInsuficientes) {
          // Pequena folga para evitar bloqueio por arredondamento de ponto flutuante
          const quantidadeReposicao = Number((item.faltante + 0.01).toFixed(4));
          const { error: reposicaoError } = await supabase
            .from('movimentacoes_estoque_insumos')
            .insert({
              insumo_id: item.insumo_id,
              tipo: 'entrada',
              quantidade: quantidadeReposicao,
              data_movimentacao: new Date().toISOString(),
              referencia_tipo: 'ajuste_producao',
              referencia_id: registroId,
              observacao: `Reposição automática para confirmar produção (faltavam ${item.faltante} ${item.unidade})`
            });

          if (reposicaoError) {
            throw new Error(`Erro ao repor insumo ${item.nome}: ${reposicaoError.message}`);
          }
        }
      }

      // 6. Executar transação manual para criar movimentações
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

      toast({
        title: "Produção confirmada com sucesso",
        description: `${registro.formas_producidas} formas de ${registro.produto_nome} confirmadas. Estoque atualizado.`
      });

      return { ok: true };

    } catch (error) {
      console.error('Erro ao confirmar produção:', error);
      toast({
        title: "Erro ao confirmar produção",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return { ok: false, motivo: 'erro' };
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmarProducao,
    loading
  };
};
