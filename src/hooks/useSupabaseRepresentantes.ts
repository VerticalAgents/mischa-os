
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
  gestaoclick_funcionario_id?: string;
}

interface UseSupabaseRepresentantesReturn {
  representantes: Representante[];
  loading: boolean;
  error: string | null;
  carregarRepresentantes: () => Promise<void>;
  adicionarRepresentante: (data: Omit<Representante, 'id' | 'ativo' | 'gestaoclick_funcionario_id'>) => Promise<boolean>;
  atualizarRepresentante: (id: number, data: Partial<Omit<Representante, 'id'>>) => Promise<boolean>;
  removerRepresentante: (id: number) => Promise<boolean>;
}

export function useSupabaseRepresentantes(): UseSupabaseRepresentantesReturn {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarRepresentantes = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        setRepresentantes([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('representantes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (supabaseError) {
        console.error('Erro ao carregar representantes:', supabaseError);
        setError('Erro ao carregar representantes');
        return;
      }

      setRepresentantes(data || []);
    } catch (err) {
      console.error('Erro ao carregar representantes:', err);
      setError('Erro inesperado ao carregar representantes');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const adicionarRepresentante = useCallback(async (data: Omit<Representante, 'id' | 'ativo'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('representantes')
        .insert([{
          ...data,
          ativo: true,
          user_id: user.id
        }]);

      if (supabaseError) {
        console.error('Erro ao adicionar representante:', supabaseError);
        toast.error('Erro ao adicionar representante');
        return false;
      }

      toast.success('Representante adicionado com sucesso!');
      await carregarRepresentantes();
      return true;
    } catch (err) {
      console.error('Erro ao adicionar representante:', err);
      toast.error('Erro inesperado ao adicionar representante');
      return false;
    }
  }, [carregarRepresentantes]);

  const atualizarRepresentante = useCallback(async (id: number, data: Partial<Omit<Representante, 'id'>>) => {
    try {
      const { error: supabaseError } = await supabase
        .from('representantes')
        .update(data)
        .eq('id', id);

      if (supabaseError) {
        console.error('Erro ao atualizar representante:', supabaseError);
        toast.error('Erro ao atualizar representante');
        return false;
      }

      toast.success('Representante atualizado com sucesso!');
      await carregarRepresentantes();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar representante:', err);
      toast.error('Erro inesperado ao atualizar representante');
      return false;
    }
  }, [carregarRepresentantes]);

  const removerRepresentante = useCallback(async (id: number) => {
    try {
      const { error: supabaseError } = await supabase
        .from('representantes')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        console.error('Erro ao remover representante:', supabaseError);
        toast.error('Erro ao remover representante');
        return false;
      }

      toast.success('Representante removido com sucesso!');
      await carregarRepresentantes();
      return true;
    } catch (err) {
      console.error('Erro ao remover representante:', err);
      toast.error('Erro inesperado ao remover representante');
      return false;
    }
  }, [carregarRepresentantes]);

  useEffect(() => {
    carregarRepresentantes();
  }, []);

  return {
    representantes,
    loading,
    error,
    carregarRepresentantes,
    adicionarRepresentante,
    atualizarRepresentante,
    removerRepresentante
  };
}
