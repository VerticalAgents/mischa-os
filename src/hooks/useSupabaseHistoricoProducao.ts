
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface HistoricoProducaoSupabase {
  id: string;
  data_producao: string;
  produto_id?: string;
  produto_nome: string;
  formas_producidas: number;
  unidades_calculadas: number;
  turno?: string;
  observacoes?: string;
  origem?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseHistoricoProducao = () => {
  const [historico, setHistorico] = useState<HistoricoProducaoSupabase[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_producao')
        .select('*')
        .order('data_producao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        toast({
          title: "Erro ao carregar histórico",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarRegistro = async (registro: Omit<HistoricoProducaoSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .insert({
          data_producao: registro.data_producao,
          produto_id: registro.produto_id,
          produto_nome: registro.produto_nome,
          formas_producidas: registro.formas_producidas,
          unidades_calculadas: registro.unidades_calculadas,
          turno: registro.turno,
          observacoes: registro.observacoes,
          origem: registro.origem || 'Manual'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar registro:', error);
        toast({
          title: "Erro ao salvar registro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Registro salvo",
        description: "Histórico de produção registrado com sucesso"
      });

      await carregarHistorico();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
      toast({
        title: "Erro ao salvar registro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const editarRegistro = async (id: string, dadosAtualizados: Partial<HistoricoProducaoSupabase>) => {
    try {
      const { error } = await supabase
        .from('historico_producao')
        .update(dadosAtualizados)
        .eq('id', id);

      if (error) {
        console.error('Erro ao editar registro:', error);
        toast({
          title: "Erro ao editar registro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Registro atualizado",
        description: "Registro atualizado com sucesso"
      });

      await carregarHistorico();
      return true;
    } catch (error) {
      console.error('Erro ao editar registro:', error);
      toast({
        title: "Erro ao editar registro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historico_producao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover registro:', error);
        toast({
          title: "Erro ao remover registro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Registro removido",
        description: "Registro removido com sucesso"
      });

      await carregarHistorico();
      return true;
    } catch (error) {
      console.error('Erro ao remover registro:', error);
      toast({
        title: "Erro ao remover registro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  return {
    historico,
    loading,
    carregarHistorico,
    adicionarRegistro,
    editarRegistro,
    removerRegistro
  };
};
