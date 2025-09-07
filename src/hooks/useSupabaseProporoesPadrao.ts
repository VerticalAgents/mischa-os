
import { useState, useEffect, useCallback } from 'react';
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
      
      // Primeiro, buscar todos os produtos ativos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_finais')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (produtosError) {
        console.error('Erro ao carregar produtos:', produtosError);
        toast({
          title: "Erro ao carregar produtos",
          description: produtosError.message,
          variant: "destructive"
        });
        return;
      }

      if (!produtos || produtos.length === 0) {
        console.log('Nenhum produto ativo encontrado');
        setProporcoes([]);
        return;
      }

      // Buscar proporções existentes
      const { data: proporcoesExistentes, error: proporcoesError } = await supabase
        .from('proporcoes_padrao')
        .select('id, produto_id, percentual, ativo')
        .eq('ativo', true);

      if (proporcoesError) {
        console.error('Erro ao carregar proporções:', proporcoesError);
        toast({
          title: "Erro ao carregar proporções",
          description: proporcoesError.message,
          variant: "destructive"
        });
        return;
      }

      // Combinar produtos com suas proporções (ou 0 se não existir)
      const proporcoesFormatadas = produtos.map(produto => {
        const proporcaoExistente = proporcoesExistentes?.find(p => p.produto_id === produto.id);
        return {
          id: proporcaoExistente?.id || '',
          produto_id: produto.id,
          produto_nome: produto.nome,
          percentual: proporcaoExistente?.percentual ? Number(proporcaoExistente.percentual) : 0,
          ativo: proporcaoExistente?.ativo || true
        };
      });

      setProporcoes(proporcoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar proporções:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar as proporções",
        variant: "destructive"
      });
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

      // Processar cada proporção individualmente
      for (const proporcao of novasProporcoes) {
        const proporcaoExistente = proporcoes.find(p => p.produto_id === proporcao.produto_id);
        
        if (proporcaoExistente && proporcaoExistente.id) {
          // Atualizar registro existente
          const { error } = await supabase
            .from('proporcoes_padrao')
            .update({
              percentual: proporcao.percentual,
              ativo: true
            })
            .eq('id', proporcaoExistente.id);

          if (error) {
            console.error('Erro ao atualizar proporção existente:', error);
            throw error;
          }
        } else {
          // Criar novo registro
          const { error } = await supabase
            .from('proporcoes_padrao')
            .insert({
              produto_id: proporcao.produto_id,
              percentual: proporcao.percentual,
              ativo: true
            });

          if (error) {
            console.error('Erro ao criar nova proporção:', error);
            throw error;
          }
        }
      }

      toast({
        title: "Proporções salvas",
        description: "Proporções padrão atualizadas com sucesso!"
      });

      await carregarProporcoes();
      return true;
    } catch (error) {
      console.error('Erro ao salvar proporções:', error);
      toast({
        title: "Erro ao salvar proporções",
        description: "Ocorreu um erro ao salvar as proporções",
        variant: "destructive"
      });
      return false;
    }
  };

  const obterProporcoesParaPedido = useCallback(async (quantidadeTotal: number) => {
    try {
      console.log('🔍 Obtendo proporções para pedido com quantidade total:', quantidadeTotal);
      
      // Primeiro buscar proporções ativas
      const { data: proporcoes, error: propError } = await supabase
        .from('proporcoes_padrao')
        .select('produto_id, percentual')
        .eq('ativo', true)
        .gt('percentual', 0);

      if (propError) {
        console.error('Erro ao obter proporções:', propError);
        // Fallback silencioso para evitar loops
        return [];
      }

      if (!proporcoes || proporcoes.length === 0) {
        console.warn('⚠️ Nenhuma proporção ativa encontrada');
        return [];
      }

      // Buscar produtos separadamente para evitar problemas de join
      const produtoIds = proporcoes.map(p => p.produto_id);
      const { data: produtos, error: prodError } = await supabase
        .from('produtos_finais')
        .select('id, nome')
        .in('id', produtoIds)
        .eq('ativo', true);

      if (prodError) {
        console.error('Erro ao obter produtos:', prodError);
        return [];
      }

      // Combinar dados manualmente
      const data = proporcoes
        .map(prop => {
          const produto = produtos?.find(p => p.id === prop.produto_id);
          return produto ? {
            produto_id: prop.produto_id,
            percentual: prop.percentual,
            produtos_finais: { nome: produto.nome }
          } : null;
        })
        .filter(Boolean);

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
      // Retornar array vazio ao invés de throw para evitar quebrar o fluxo
      return [];
    }
  }, []);

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
