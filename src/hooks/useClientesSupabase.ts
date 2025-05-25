
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClienteSupabase } from '@/types/supabase-client';

export interface Cliente extends ClienteSupabase {}

export const useClientesSupabase = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single();

      if (error) throw error;
      setClientes(prev => [...prev, data]);
      toast.success('Cliente adicionado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao adicionar cliente: ' + error.message);
      throw error;
    }
  };

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setClientes(prev => prev.map(c => c.id === id ? data : c));
      toast.success('Cliente atualizado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao atualizar cliente: ' + error.message);
      throw error;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      setClientes(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente removido com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao remover cliente: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return {
    clientes,
    loading,
    addCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes
  };
};
