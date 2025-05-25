
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cliente {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  endereco_entrega?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  quantidade_padrao?: number;
  periodicidade_padrao?: number;
  status_cliente?: string;
  meta_giro_semanal?: number;
  ultima_data_reposicao_efetiva?: string;
  proxima_data_reposicao?: string;
  status_agendamento?: string;
  ativo?: boolean;
  giro_medio_semanal?: number;
  janelas_entrega?: any;
  representante_id?: number;
  rota_entrega_id?: number;
  categoria_estabelecimento_id?: number;
  instrucoes_entrega?: string;
  contabilizar_giro_medio?: boolean;
  tipo_logistica?: string;
  emite_nota_fiscal?: boolean;
  tipo_cobranca?: string;
  forma_pagamento?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

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
