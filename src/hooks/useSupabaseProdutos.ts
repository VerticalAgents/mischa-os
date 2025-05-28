
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
  estoque_atual?: number;
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
  estoque_atual: number;
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoCompleto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos_finais' as any)
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

      for (const produto of (produtosData as any[]) || []) {
        const { data: componentesData, error: componentesError } = await supabase
          .from('componentes_produto' as any)
          .select('*')
          .eq('produto_id', (produto as any).id);

        if (componentesError) {
          console.error('Erro ao carregar componentes do produto:', componentesError);
          continue;
        }

        const componentesCompletos = [];
        let custo_total = 0;
        let peso_total = 0;

        for (const componente of (componentesData as any[]) || []) {
          let item: InsumoSupabase | ReceitaBaseSupabase | null = null;
          let custo_unitario = 0;
          let nome_item = '';

          if ((componente as any).tipo === 'insumo') {
            const { data: insumoData } = await supabase
              .from('insumos' as any)
              .select('*')
              .eq('id', (componente as any).item_id)
              .single();
            
            if (insumoData) {
              item = insumoData as any as InsumoSupabase;
              custo_unitario = (insumoData as any).volume_bruto > 0 ? (insumoData as any).custo_medio / (insumoData as any).volume_bruto : 0;
              nome_item = (insumoData as any).nome;
              peso_total += (componente as any).quantidade;
            }
          } else if ((componente as any).tipo === 'receita') {
            const { data: receitaData } = await supabase
              .from('receitas_base' as any)
              .select('*')
              .eq('id', (componente as any).item_id)
              .single();

            if (receitaData) {
              item = receitaData as any as ReceitaBaseSupabase;
              // Para receitas, precisamos calcular o custo unitário baseado nos insumos
              const { data: itensReceita } = await supabase
                .from('itens_receita' as any)
                .select(`
                  *,
                  insumos (*)
                `)
                .eq('receita_id', (receitaData as any).id);

              let custoTotalReceita = 0;
              if (itensReceita) {
                for (const itemReceita of (itensReceita as any[])) {
                  const insumo = (itemReceita as any).insumos as InsumoSupabase;
                  const custoUnitarioInsumo = insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
                  custoTotalReceita += (itemReceita as any).quantidade * custoUnitarioInsumo;
                }
              }
              custo_unitario = (receitaData as any).rendimento > 0 ? custoTotalReceita / (receitaData as any).rendimento : 0;
              nome_item = (receitaData as any).nome;
              peso_total += (componente as any).quantidade;
            }
          }

          const custo_item = (componente as any).quantidade * custo_unitario;
          custo_total += custo_item;

          if (item) {
            componentesCompletos.push({
              ...(componente as ComponenteProdutoSupabase),
              item,
              custo_item,
              nome_item
            });
          }
        }

        const custo_unitario_produto = (produto as any).unidades_producao > 0 ? custo_total / (produto as any).unidades_producao : 0;
        const margem_lucro = (produto as any).preco_venda && (produto as any).preco_venda > 0 
          ? (((produto as any).preco_venda - custo_unitario_produto) / (produto as any).preco_venda) * 100 
          : 0;

        produtosCompletos.push({
          ...(produto as ProdutoFinalSupabase),
          componentes: componentesCompletos,
          custo_total,
          custo_unitario: custo_unitario_produto,
          peso_total,
          margem_lucro,
          estoque_atual: (produto as any).estoque_atual || 0
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
        .from('produtos_finais' as any)
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
        .from('componentes_produto' as any)
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
        .from('componentes_produto' as any)
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
        .from('produtos_finais' as any)
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
        .from('produtos_finais' as any)
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
