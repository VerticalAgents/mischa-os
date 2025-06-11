
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProporcaoPadrao {
  id: string;
  produto_id: string;
  produto_nome: string;
  percentual: number;
  ativo: boolean;
}

export const useSupabaseProporoesPadrao = () => {
  const [proporcoes, setProporcoes] = useState<ProporcaoPadrao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarProporcoes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('proporcoes_padrao')
        .select(`
          id,
          produto_id,
          percentual,
          ativo,
          produtos_finais!inner(nome, ativo)
        `)
        .eq('ativo', true)
        .eq('produtos_finais.ativo', true)
        .order('produtos_finais.nome');

      if (error) {
        console.error('Erro ao carregar proporções:', error);
        toast({
          title: "Erro ao carregar proporções",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const proporcoesFormatadas = data?.map(item => ({
        id: item.id,
        produto_id: item.produto_id,
        produto_nome: (item.produtos_finais as any)?.nome || '',
        percentual: Number(item.percentual),
        ativo: item.ativo
      })) || [];

      setProporcoes(proporcoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar proporções:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarProporcao = async (produtoId: string, novoPercentual: number) => {
    try {
      const { error } = await supabase
        .from('proporcoes_padrao')
        .upsert({
          produto_id: produtoId,
          percentual: novoPercentual,
          ativo: true
        });

      if (error) {
        console.error('Erro ao atualizar proporção:', error);
        toast({
          title: "Erro ao atualizar proporção",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar proporção:', error);
      return false;
    }
  };

  const salvarTodasProporcoes = async (novasProporcoes: { produto_id: string; percentual: number }[]) => {
    try {
      // Verificar se soma é 100%
      const total = novasProporcoes.reduce((sum, p) => sum + p.percentual, 0);
      if (Math.abs(total - 100) > 0.01) {
        toast({
          title: "Erro ao salvar",
          description: "A soma dos percentuais deve ser exatamente 100%",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('proporcoes_padrao')
        .upsert(
          novasProporcoes.map(p => ({
            produto_id: p.produto_id,
            percentual: p.percentual,
            ativo: true
          }))
        );

      if (error) {
        console.error('Erro ao salvar proporções:', error);
        toast({
          title: "Erro ao salvar proporções",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Proporções salvas",
        description: "Proporções padrão atualizadas com sucesso!"
      });

      await carregarProporcoes();
      return true;
    } catch (error) {
      console.error('Erro ao salvar proporções:', error);
      return false;
    }
  };

  const obterProporcoesParaPedido = async (quantidadeTotal: number) => {
    try {
      const { data, error } = await supabase
        .from('proporcoes_padrao')
        .select(`
          produto_id,
          percentual,
          produtos_finais!inner(nome)
        `)
        .eq('ativo', true)
        .eq('produtos_finais.ativo', true)
        .gt('percentual', 0);

      if (error) {
        console.error('Erro ao obter proporções para pedido:', error);
        return [];
      }

      // Verificar se as proporções somam 100%
      const totalProporcoes = data?.reduce((sum, p) => sum + Number(p.percentual), 0) || 0;
      if (Math.abs(totalProporcoes - 100) > 0.01) {
        console.warn('Proporções não somam 100%, não é possível calcular quantidades');
        return [];
      }

      // Calcular quantidades usando Math.floor
      const quantidades: { [produtoId: string]: number } = {};
      let totalCalculado = 0;

      // Primeiro passo: calcular com Math.floor
      data?.forEach(item => {
        const quantidade = Math.floor((Number(item.percentual) / 100) * quantidadeTotal);
        quantidades[item.produto_id] = quantidade;
        totalCalculado += quantidade;
      });

      // Segundo passo: distribuir o residual para o produto com maior proporção
      const residual = quantidadeTotal - totalCalculado;
      if (residual > 0 && data) {
        let maiorProporcao = 0;
        let produtoMaiorProporcao = '';
        
        data.forEach(item => {
          if (Number(item.percentual) > maiorProporcao) {
            maiorProporcao = Number(item.percentual);
            produtoMaiorProporcao = item.produto_id;
          }
        });

        if (produtoMaiorProporcao) {
          quantidades[produtoMaiorProporcao] += residual;
        }
      }

      // Converter para array de resultado
      return data
        ?.filter(item => quantidades[item.produto_id] > 0)
        .map(item => ({
          produto_id: item.produto_id,
          produto_nome: (item.produtos_finais as any)?.nome || '',
          quantidade: quantidades[item.produto_id]
        })) || [];
    } catch (error) {
      console.error('Erro ao obter proporções para pedido:', error);
      return [];
    }
  };

  useEffect(() => {
    carregarProporcoes();
  }, []);

  return {
    proporcoes,
    loading,
    carregarProporcoes,
    atualizarProporcao,
    salvarTodasProporcoes,
    obterProporcoesParaPedido
  };
};
