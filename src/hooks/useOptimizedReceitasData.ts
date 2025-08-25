
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReceitaCompleta {
  id: string;
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
  peso_total: number;
  custo_total: number;
  custo_unitario: number;
  itens: {
    id: string;
    insumo_id: string;
    nome_insumo: string;
    quantidade: number;
    custo_item: number;
  }[];
}

export interface ReceitaInput {
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
}

export const useOptimizedReceitasData = () => {
  const [receitas, setReceitas] = useState<ReceitaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const carregarReceitas = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Carregando dados otimizados das receitas...');
      
      // Carregar todas as receitas básicas
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas_base')
        .select('*')
        .order('nome');

      if (receitasError) {
        console.error('❌ Erro ao carregar receitas:', receitasError);
        throw receitasError;
      }

      if (!receitasData || receitasData.length === 0) {
        console.log('ℹ️ Nenhuma receita encontrada');
        setReceitas([]);
        return;
      }

      // Carregar TODOS os itens de receita de uma vez com dados dos insumos
      const { data: itensData, error: itensError } = await supabase
        .from('itens_receita')
        .select(`
          id,
          receita_id,
          insumo_id,
          quantidade,
          insumos (
            nome,
            custo_medio,
            volume_bruto
          )
        `);

      if (itensError) {
        console.error('❌ Erro ao carregar itens das receitas:', itensError);
        throw itensError;
      }

      console.log(`📦 Carregados ${receitasData.length} receitas e ${itensData?.length || 0} itens`);

      // Criar mapa de itens por receita para acesso O(1)
      const itensPorReceita = new Map<string, any[]>();
      
      if (itensData) {
        itensData.forEach(item => {
          const receitaId = item.receita_id;
          if (!itensPorReceita.has(receitaId)) {
            itensPorReceita.set(receitaId, []);
          }
          itensPorReceita.get(receitaId)!.push(item);
        });
      }

      // Processar receitas com todos os cálculos de uma vez
      const receitasCompletas: ReceitaCompleta[] = receitasData.map(receita => {
        const itensReceita = itensPorReceita.get(receita.id) || [];
        
        const itensProcessados = itensReceita.map(item => {
          const insumo = item.insumos as any;
          const custoUnitario = insumo && insumo.volume_bruto > 0 
            ? (insumo.custo_medio || 0) / insumo.volume_bruto 
            : 0;
          const custoItem = custoUnitario * Number(item.quantidade);

          return {
            id: item.id,
            insumo_id: item.insumo_id,
            nome_insumo: insumo?.nome || 'Insumo não encontrado',
            quantidade: Number(item.quantidade),
            custo_item: custoItem
          };
        });

        const pesoTotal = itensProcessados.reduce((sum, item) => sum + item.quantidade, 0);
        const custoTotal = itensProcessados.reduce((sum, item) => sum + item.custo_item, 0);
        const custoUnitario = receita.rendimento > 0 ? custoTotal / receita.rendimento : 0;

        return {
          ...receita,
          peso_total: pesoTotal,
          custo_total: custoTotal,
          custo_unitario: custoUnitario,
          itens: itensProcessados
        };
      });

      console.log('✅ Receitas processadas com sucesso');
      setReceitas(receitasCompletas);
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error);
      toast({
        title: "Erro ao carregar receitas",
        description: "Ocorreu um erro ao carregar as receitas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarItemReceita = async (receitaId: string, insumoId: string, quantidade: number) => {
    try {
      const { error } = await supabase
        .from('itens_receita')
        .insert({
          receita_id: receitaId,
          insumo_id: insumoId,
          quantidade: quantidade
        });

      if (error) {
        console.error('Erro ao adicionar item à receita:', error);
        toast({
          title: "Erro ao adicionar item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Item adicionado",
        description: "Item adicionado à receita com sucesso"
      });

      // Recarregar dados otimizados
      await carregarReceitas();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar item à receita:', error);
      toast({
        title: "Erro ao adicionar item",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerItemReceita = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('itens_receita')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao remover item da receita:', error);
        toast({
          title: "Erro ao remover item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Item removido",
        description: "Item removido da receita com sucesso"
      });

      // Recarregar dados otimizados
      await carregarReceitas();
      return true;
    } catch (error) {
      console.error('Erro ao remover item da receita:', error);
      toast({
        title: "Erro ao remover item",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const duplicarReceita = async (receitaOriginal: ReceitaCompleta) => {
    try {
      // Criar nova receita com nome (Cópia)
      const novaReceita = {
        nome: `${receitaOriginal.nome} (Cópia)`,
        descricao: receitaOriginal.descricao,
        rendimento: receitaOriginal.rendimento,
        unidade_rendimento: receitaOriginal.unidade_rendimento
      };

      const { data: receitaCriada, error: receitaError } = await supabase
        .from('receitas_base')
        .insert(novaReceita)
        .select()
        .single();

      if (receitaError) {
        console.error('Erro ao duplicar receita:', receitaError);
        toast({
          title: "Erro ao duplicar receita",
          description: receitaError.message,
          variant: "destructive"
        });
        return null;
      }

      // Duplicar todos os itens da receita original
      if (receitaOriginal.itens.length > 0) {
        const itensDuplicados = receitaOriginal.itens.map(item => ({
          receita_id: receitaCriada.id,
          insumo_id: item.insumo_id,
          quantidade: item.quantidade
        }));

        const { error: itensError } = await supabase
          .from('itens_receita')
          .insert(itensDuplicados);

        if (itensError) {
          console.error('Erro ao duplicar itens da receita:', itensError);
          // Não falhar a operação por causa dos itens
        }
      }

      toast({
        title: "Receita duplicada",
        description: `${novaReceita.nome} foi criada com sucesso`
      });

      // Recarregar dados otimizados
      await carregarReceitas();
      return receitaCriada;
    } catch (error) {
      console.error('Erro ao duplicar receita:', error);
      toast({
        title: "Erro ao duplicar receita",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  const removerReceita = async (receitaId: string) => {
    try {
      // Primeiro remover os itens da receita
      const { error: itensError } = await supabase
        .from('itens_receita')
        .delete()
        .eq('receita_id', receitaId);

      if (itensError) {
        console.error('Erro ao remover itens da receita:', itensError);
      }

      // Depois remover a receita
      const { error } = await supabase
        .from('receitas_base')
        .delete()
        .eq('id', receitaId);

      if (error) {
        console.error('Erro ao remover receita:', error);
        toast({
          title: "Erro ao remover receita",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Receita removida",
        description: "Receita removida com sucesso"
      });

      // Recarregar dados otimizados
      await carregarReceitas();
      return true;
    } catch (error) {
      console.error('Erro ao remover receita:', error);
      toast({
        title: "Erro ao remover receita",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  // Função para forçar recarregamento (para usar nos modals)
  const refresh = () => {
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    carregarReceitas();
  }, [lastUpdate]);

  return {
    receitas,
    loading,
    carregarReceitas,
    duplicarReceita,
    removerReceita,
    adicionarItemReceita,
    removerItemReceita,
    refresh
  };
};
