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

export interface InsumoPL {
  id: string;
  cliente_industrial_id: string;
  nome: string;
  categoria: string;
  volume_bruto: number;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_ideal: number | null;
  ultima_entrada: string | null;
  observacoes: string | null;
  ativo: boolean;
}

export interface ProdutoPL {
  id: string;
  cliente_industrial_id: string;
  nome: string;
  descricao: string | null;
  peso_unitario: number | null;
  unidades_producao: number;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
}

export interface ReceitaPLItem {
  id: string;
  produto_pl_id: string;
  insumo_pl_id: string;
  quantidade: number;
  unidade_medida: string;
  observacoes: string | null;
  insumo?: InsumoPL;
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

/* ============ Insumos PL ============ */
export function useInsumosPL(clienteIndustrialId: string | null) {
  const [insumos, setInsumos] = useState<InsumoPL[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!clienteIndustrialId) { setInsumos([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('insumos_pl')
      .select('*')
      .eq('cliente_industrial_id', clienteIndustrialId)
      .order('nome');
    if (error) handleErr('Erro ao carregar insumos PL', error);
    else setInsumos((data as InsumoPL[]) ?? []);
    setLoading(false);
  }, [clienteIndustrialId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (payload: Partial<InsumoPL>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !clienteIndustrialId) return null;
    const { data, error } = await supabase
      .from('insumos_pl')
      .insert([{ ...payload, nome: payload.nome!, cliente_industrial_id: clienteIndustrialId, owner_id: userData.user.id } as any])
      .select().single();
    if (error) { handleErr('Erro ao criar insumo', error); return null; }
    toast({ title: 'Insumo criado' });
    await carregar();
    return data as InsumoPL;
  };

  const atualizar = async (id: string, payload: Partial<InsumoPL>) => {
    const { error } = await supabase.from('insumos_pl').update(payload).eq('id', id);
    if (error) { handleErr('Erro ao atualizar insumo', error); return false; }
    await carregar();
    return true;
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from('insumos_pl').delete().eq('id', id);
    if (error) { handleErr('Erro ao remover insumo', error); return false; }
    await carregar();
    return true;
  };

  const registrarMovimentacao = async (
    insumo_pl_id: string,
    tipo: 'entrada' | 'saida' | 'ajuste',
    quantidade: number,
    observacao?: string,
  ) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;
    const { error } = await supabase.from('movimentacoes_estoque_insumos_pl').insert([{
      insumo_pl_id, tipo, quantidade, observacao: observacao || null,
      owner_id: userData.user.id,
    } as any]);
    if (error) { handleErr('Erro ao registrar movimentação', error); return false; }
    toast({ title: 'Movimentação registrada' });
    await carregar();
    return true;
  };

  return { insumos, loading, carregar, criar, atualizar, remover, registrarMovimentacao };
}

/* ============ Produtos PL ============ */
export function useProdutosPL(clienteIndustrialId: string | null) {
  const [produtos, setProdutos] = useState<ProdutoPL[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!clienteIndustrialId) { setProdutos([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos_pl')
      .select('*')
      .eq('cliente_industrial_id', clienteIndustrialId)
      .order('nome');
    if (error) handleErr('Erro ao carregar produtos PL', error);
    else setProdutos((data as ProdutoPL[]) ?? []);
    setLoading(false);
  }, [clienteIndustrialId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criar = async (payload: Partial<ProdutoPL>) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !clienteIndustrialId) return null;
    const { data, error } = await supabase
      .from('produtos_pl')
      .insert([{ ...payload, nome: payload.nome!, cliente_industrial_id: clienteIndustrialId, owner_id: userData.user.id } as any])
      .select().single();
    if (error) { handleErr('Erro ao criar produto', error); return null; }
    toast({ title: 'Produto criado' });
    await carregar();
    return data as ProdutoPL;
  };

  const atualizar = async (id: string, payload: Partial<ProdutoPL>) => {
    const { error } = await supabase.from('produtos_pl').update(payload).eq('id', id);
    if (error) { handleErr('Erro ao atualizar produto', error); return false; }
    await carregar();
    return true;
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from('produtos_pl').delete().eq('id', id);
    if (error) { handleErr('Erro ao remover produto', error); return false; }
    await carregar();
    return true;
  };

  return { produtos, loading, carregar, criar, atualizar, remover };
}

/* ============ Receitas PL ============ */
export function useReceitaPL(produto_pl_id: string | null) {
  const [itens, setItens] = useState<ReceitaPLItem[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!produto_pl_id) { setItens([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('receitas_pl')
      .select('*, insumo:insumos_pl(*)')
      .eq('produto_pl_id', produto_pl_id);
    if (error) handleErr('Erro ao carregar receita', error);
    else setItens((data as ReceitaPLItem[]) ?? []);
    setLoading(false);
  }, [produto_pl_id]);

  useEffect(() => { carregar(); }, [carregar]);

  const adicionarItem = async (insumo_pl_id: string, quantidade: number, unidade_medida: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || !produto_pl_id) return false;
    const { error } = await supabase.from('receitas_pl').insert([{
      produto_pl_id, insumo_pl_id, quantidade, unidade_medida,
      owner_id: userData.user.id,
    } as any]);
    if (error) { handleErr('Erro ao adicionar insumo à receita', error); return false; }
    await carregar();
    return true;
  };

  const removerItem = async (id: string) => {
    const { error } = await supabase.from('receitas_pl').delete().eq('id', id);
    if (error) { handleErr('Erro ao remover item', error); return false; }
    await carregar();
    return true;
  };

  return { itens, loading, carregar, adicionarItem, removerItem };
}