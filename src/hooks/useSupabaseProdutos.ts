
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InsumoSupabase } from './useSupabaseInsumos';
import { ReceitaBaseSupabase } from './useSupabaseReceitas';

export interface ProdutoFinalSupabase {
  id: string;
  nome: string;
  descricao?: string;
  categoria_id?: number;
  subcategoria_id?: number;
  unidades_producao: number;
  peso_unitario?: number;
  preco_venda?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComponenteProdutoSupabase {
  id: string;
  produto_id: string;
  item_id: string;
  tipo: 'receita' | 'insumo';
  quantidade: number;
  created_at: string;
}

export interface ProdutoCompleto extends ProdutoFinalSupabase {
  componentes: (ComponenteProdutoSupabase & {
    item: InsumoSupabase | ReceitaBaseSupabase;
    custo_item: number;
    nome_item: string;
  })[];
  custo_total: number;
  custo_unitario: number;
  peso_total: number;
  margem_lucro: number;
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoCompleto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos_finais')
        .select('*')
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

      const produtosCompletos: ProdutoCompleto[] = [];

      for (const produto of produtosData || []) {
        const { data: componentesData, error: componentesError } = await supabase
          .from('componentes_produto')
          .select('*')
          .eq('produto_id', produto.id);

        if (componentesError) {
          console.error('Erro ao carregar componentes do produto:', componentesError);
          continue;
        }

        const componentesCompletos = [];
        let custo_total = 0;
        let peso_total = 0;

        for (const componente of componentesData || []) {
          let item: InsumoSupabase | ReceitaBaseSupabase | null = null;
          let custo_unitario = 0;
          let nome_item = '';

          if (componente.tipo === 'insumo') {
            const { data: insumoData } = await supabase
              .from('insumos')
              .select('*')
              .eq('id', componente.item_id)
              .single();
            
            if (insumoData) {
              item = insumoData;
              custo_unitario = insumoData.volume_bruto > 0 ? insumoData.custo_medio / insumoData.volume_bruto : 0;
              nome_item = insumoData.nome;
              peso_total += componente.quantidade;
            }
          } else if (componente.tipo === 'receita') {
            const { data: receitaData } = await supabase
              .from('receitas_base')
              .select('*')
              .eq('id', componente.item_id)
              .single();

            if (receitaData) {
              item = receitaData;
              // Para receitas, precisamos calcular o custo unitário baseado nos insumos
              const { data: itensReceita } = await supabase
                .from('itens_receita')
                .select(`
                  *,
                  insumos (*)
                `)
                .eq('receita_id', receitaData.id);

              let custoTotalReceita = 0;
              if (itensReceita) {
                for (const itemReceita of itensReceita) {
                  const insumo = itemReceita.insumos as InsumoSupabase;
                  const custoUnitarioInsumo = insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
                  custoTotalReceita += itemReceita.quantidade * custoUnitarioInsumo;
                }
              }
              custo_unitario = receitaData.rendimento > 0 ? custoTotalReceita / receitaData.rendimento : 0;
              nome_item = receitaData.nome;
              peso_total += componente.quantidade;
            }
          }

          const custo_item = componente.quantidade * custo_unitario;
          custo_total += custo_item;

          if (item) {
            componentesCompletos.push({
              ...componente,
              item,
              custo_item,
              nome_item
            });
          }
        }

        const custo_unitario_produto = produto.unidades_producao > 0 ? custo_total / produto.unidades_producao : 0;
        const margem_lucro = produto.preco_venda && produto.preco_venda > 0 
          ? ((produto.preco_venda - custo_unitario_produto) / produto.preco_venda) * 100 
          : 0;

        produtosCompletos.push({
          ...produto,
          componentes: componentesCompletos,
          custo_total,
          custo_unitario: custo_unitario_produto,
          peso_total,
          margem_lucro
        });
      }

      setProdutos(produtosCompletos);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = async (produto: Omit<ProdutoFinalSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('produtos_finais')
        .insert([produto])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar produto:', error);
        toast({
          title: "Erro ao adicionar produto",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Produto adicionado",
        description: "Produto criado com sucesso"
      });
      await carregarProdutos();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      return null;
    }
  };

  const adicionarComponenteProduto = async (produto_id: string, item_id: string, tipo: 'receita' | 'insumo', quantidade: number) => {
    try {
      const { error } = await supabase
        .from('componentes_produto')
        .insert([{ produto_id, item_id, tipo, quantidade }]);

      if (error) {
        console.error('Erro ao adicionar componente ao produto:', error);
        toast({
          title: "Erro ao adicionar componente",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      await carregarProdutos();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar componente ao produto:', error);
      return false;
    }
  };

  const removerComponenteProduto = async (componente_id: string) => {
    try {
      const { error } = await supabase
        .from('componentes_produto')
        .delete()
        .eq('id', componente_id);

      if (error) {
        console.error('Erro ao remover componente do produto:', error);
        toast({
          title: "Erro ao remover componente",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      await carregarProdutos();
      return true;
    } catch (error) {
      console.error('Erro ao remover componente do produto:', error);
      return false;
    }
  };

  const atualizarProduto = async (id: string, produto: Partial<ProdutoFinalSupabase>) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update(produto)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast({
          title: "Erro ao atualizar produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      await carregarProdutos();
      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return false;
    }
  };

  const removerProduto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover produto:', error);
        toast({
          title: "Erro ao remover produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setProdutos(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  return {
    produtos,
    loading,
    carregarProdutos,
    adicionarProduto,
    adicionarComponenteProduto,
    removerComponenteProduto,
    atualizarProduto,
    removerProduto
  };
};
