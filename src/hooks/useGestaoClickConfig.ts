import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface GestaoClickConfig {
  access_token: string;
  secret_token: string;
  situacao_id?: string;
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

export function useGestaoClickConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<GestaoClickConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [situacoes, setSituacoes] = useState<GestaoClickSituacao[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<GestaoClickFormaPagamento[]>([]);

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
      // First try to update existing record
      const { data: existing } = await supabase
        .from('integracoes_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('integracao', 'gestaoclick')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('integracoes_config')
          .update({
            config: newConfig as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
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

      // Salvar situações encontradas
      if (data?.situacoes && Array.isArray(data.situacoes)) {
        setSituacoes(data.situacoes);
      }

      // Salvar formas de pagamento
      if (data?.formas_pagamento && Array.isArray(data.formas_pagamento)) {
        setFormasPagamento(data.formas_pagamento);
      }
      
      setConnectionStatus('connected');
      toast.success('Conexão com GestaoClick estabelecida!');
      
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

  return {
    config,
    loading,
    saving,
    testing,
    connectionStatus,
    situacoes,
    formasPagamento,
    saveConfig,
    testConnection,
    loadConfig,
    fetchClientesGestaoClick
  };
}
