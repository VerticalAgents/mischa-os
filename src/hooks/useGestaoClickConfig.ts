import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface GestaoClickConfig {
  access_token: string;
  secret_token: string;
  situacao_id?: string;
  situacao_edicao_id?: string;
  situacao_cancelado_id?: string;
  vendedor_id?: string;
  loja_id?: string;
  empresa_id?: string;
  fornecedor_id?: string; // ID do fornecedor para NF-e (emissor da nota)
  forma_pagamento_ids?: {
    BOLETO?: string;
    PIX?: string;
    DINHEIRO?: string;
  };
}

export interface GestaoClickSituacao {
  id: string;
  nome: string;
}

export interface GestaoClickFormaPagamento {
  id: string;
  nome: string;
}

export interface GestaoClickCliente {
  id: string;
  nome: string;
  cnpj_cpf?: string;
}

export interface GestaoClickFuncionario {
  id: string;
  nome: string;
}

export interface GestaoClickProduto {
  id: string;
  nome: string;
  codigo?: string;
  preco?: string;
}

export interface GestaoClickLoja {
  id: string;
  nome: string;
  cnpj?: string;
  ativo?: string;
}

export interface GestaoClickFornecedor {
  id: string;
  nome: string;
  cnpj_cpf?: string;
}

export function useGestaoClickConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<GestaoClickConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [situacoes, setSituacoes] = useState<GestaoClickSituacao[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<GestaoClickFormaPagamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<GestaoClickFuncionario[]>([]);

  // Carregar configuração salva
  const loadConfig = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integracoes_config')
        .select('config')
        .eq('user_id', user.id)
        .eq('integracao', 'gestaoclick')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.config) {
        const configData = data.config as unknown as GestaoClickConfig;
        setConfig(configData);
        if (configData.access_token && configData.secret_token) {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração GestaoClick:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Salvar configuração
  const saveConfig = useCallback(async (newConfig: GestaoClickConfig) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('integracoes_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('integracao', 'gestaoclick')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('integracoes_config')
          .update({
            config: newConfig as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integracoes_config')
          .insert({
            user_id: user.id,
            integracao: 'gestaoclick',
            config: newConfig as unknown as Json
          });
        
        if (error) throw error;
      }
      
      setConfig(newConfig);
      toast.success('Configuração salva com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  // Testar conexão com a API do GestaoClick via Edge Function
  const testConnection = useCallback(async (accessToken: string, secretToken: string) => {
    setTesting(true);
    setConnectionStatus('unknown');
    
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'test_connection',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao conectar');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.situacoes && Array.isArray(data.situacoes)) {
        setSituacoes(data.situacoes);
      }

      if (data?.formas_pagamento && Array.isArray(data.formas_pagamento)) {
        setFormasPagamento(data.formas_pagamento);
      }
      
      setConnectionStatus('connected');
      toast.success('Conexão com GestaoClick estabelecida!');
      
      // Buscar funcionários automaticamente após conexão bem-sucedida
      fetchFuncionariosGestaoClick(accessToken, secretToken);
      
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('error');
      toast.error('Falha na conexão com GestaoClick. Verifique as credenciais.');
      return false;
    } finally {
      setTesting(false);
    }
  }, []);

  // Buscar funcionários do GestaoClick
  const fetchFuncionariosGestaoClick = useCallback(async (accessToken: string, secretToken: string): Promise<GestaoClickFuncionario[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'listar_funcionarios_gc',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar funcionários');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const funcs = data?.funcionarios || [];
      setFuncionarios(funcs);
      return funcs;
    } catch (error) {
      console.error('Erro ao buscar funcionários GestaoClick:', error);
      return [];
    }
  }, []);

  // Buscar clientes do GestaoClick
  const fetchClientesGestaoClick = useCallback(async (accessToken: string, secretToken: string): Promise<GestaoClickCliente[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'listar_clientes_gc',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar clientes');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.clientes || [];
    } catch (error) {
      console.error('Erro ao buscar clientes GestaoClick:', error);
      toast.error('Erro ao buscar clientes do GestaoClick');
      return [];
    }
  }, []);

  // Buscar produtos do GestaoClick
  const fetchProdutosGestaoClick = useCallback(async (accessToken: string, secretToken: string): Promise<GestaoClickProduto[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'listar_produtos_gc',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar produtos');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.produtos || [];
    } catch (error) {
      console.error('Erro ao buscar produtos GestaoClick:', error);
      toast.error('Erro ao buscar produtos do GestaoClick');
      return [];
    }
  }, []);

  // Buscar lojas do GestaoClick
  const fetchLojasGestaoClick = useCallback(async (accessToken: string, secretToken: string): Promise<GestaoClickLoja[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'listar_lojas_gc',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar lojas');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.lojas || [];
    } catch (error) {
      console.error('Erro ao buscar lojas GestaoClick:', error);
      toast.error('Erro ao buscar lojas do GestaoClick');
      return [];
    }
  }, []);

  // Buscar fornecedores do GestaoClick (para NF-e)
  const fetchFornecedoresGestaoClick = useCallback(async (accessToken: string, secretToken: string): Promise<GestaoClickFornecedor[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('gestaoclick-proxy', {
        body: {
          action: 'listar_fornecedores_gc',
          access_token: accessToken,
          secret_token: secretToken
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar fornecedores');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.fornecedores || [];
    } catch (error) {
      console.error('Erro ao buscar fornecedores GestaoClick:', error);
      toast.error('Erro ao buscar fornecedores do GestaoClick');
      return [];
    }
  }, []);

  return {
    config,
    loading,
    saving,
    testing,
    connectionStatus,
    situacoes,
    formasPagamento,
    funcionarios,
    saveConfig,
    testConnection,
    loadConfig,
    fetchClientesGestaoClick,
    fetchFuncionariosGestaoClick,
    fetchProdutosGestaoClick,
    fetchLojasGestaoClick,
    fetchFornecedoresGestaoClick
  };
}
