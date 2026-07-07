import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClienteIndustrial {
  id: string;
  nome: string;
  cnpj: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  endereco: string | null;
  preco_industrializacao_unitario: number;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

function handleErr(prefix: string, error: any) {
  console.error(prefix, error);
  toast({ title: prefix, description: error?.message || 'Erro desconhecido', variant: 'destructive' });
}

/* ============ Clientes Industriais ============ */
export function useClientesIndustriais() {
  const [clientes, setClientes] = useState<ClienteIndustrial[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes_industriais')
      .select('*')
      .order('nome');
    if (error) handleErr('Erro ao carregar clientes industriais', error);
    else setClientes((data as ClienteIndustrial[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (payload: Partial<ClienteIndustrial>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from('clientes_industriais')
      .insert([{ ...payload, nome: payload.nome!, owner_id: userData.user.id } as any])
      .select().single();
    if (error) { handleErr('Erro ao criar cliente industrial', error); return null; }
    toast({ title: 'Cliente industrial criado' });
    await carregar();
    return data as ClienteIndustrial;
  };

  const atualizar = async (id: string, payload: Partial<ClienteIndustrial>) => {
    const { error } = await supabase.from('clientes_industriais').update(payload).eq('id', id);
    if (error) { handleErr('Erro ao atualizar', error); return false; }
    toast({ title: 'Atualizado' });
    await carregar();
    return true;
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from('clientes_industriais').delete().eq('id', id);
    if (error) { handleErr('Erro ao remover', error); return false; }
    toast({ title: 'Removido' });
    await carregar();
    return true;
  };

  return { clientes, loading, carregar, criar, atualizar, remover };
}
}