
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

export const useSupabaseReceitas = () => {
  const [receitas, setReceitas] = useState<ReceitaCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarReceitas = async () => {
    try {
      setLoading(true);
      
      // Buscar receitas básicas
      const { data: receitasData, error } = await supabase
        .from('receitas_base')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar receitas:', error);
        return;
      }

      // Para cada receita, buscar seus itens
      const receitasCompletas: ReceitaCompleta[] = [];
      
      for (const receita of receitasData || []) {
        const { data: itensData } = await supabase
          .from('itens_receita')
          .select(`
            id,
            insumo_id,
            quantidade,
            insumos(nome, custo_medio)
          `)
          .eq('receita_id', receita.id);

        const itens = itensData?.map(item => ({
          id: item.id,
          insumo_id: item.insumo_id,
          nome_insumo: (item.insumos as any)?.nome || '',
          quantidade: Number(item.quantidade),
          custo_item: Number((item.insumos as any)?.custo_medio || 0) * Number(item.quantidade)
        })) || [];

        const pesoTotal = itens.reduce((sum, item) => sum + item.quantidade, 0);
        const custoTotal = itens.reduce((sum, item) => sum + item.custo_item, 0);
        const custoUnitario = receita.rendimento > 0 ? custoTotal / receita.rendimento : 0;

        receitasCompletas.push({
          ...receita,
          peso_total: pesoTotal,
          custo_total: custoTotal,
          custo_unitario: custoUnitario,
          itens
        });
      }

      setReceitas(receitasCompletas);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
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

  useEffect(() => {
    carregarReceitas();
  }, []);

  return {
    receitas,
    loading,
    carregarReceitas,
    duplicarReceita,
    removerReceita,
    adicionarItemReceita,
    removerItemReceita
  };
};
