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

  // Testar conexão com a API do GestaoClick
  const testConnection = useCallback(async (accessToken: string, secretToken: string) => {
    setTesting(true);
    setConnectionStatus('unknown');
    
    try {
      // Chamada à API GestaoClick para listar situações (teste de conexão)
      const response = await fetch('https://api.gestaoclick.com/situacoes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'secret-access-token': secretToken
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Salvar situações encontradas
      if (data?.situacoes && Array.isArray(data.situacoes)) {
        setSituacoes(data.situacoes.map((s: { situacao_id: string; situacao: string }) => ({
          id: s.situacao_id,
          nome: s.situacao
        })));
      }
      
      setConnectionStatus('connected');
      toast.success('Conexão com GestaoClick estabelecida!');
      
      // Buscar formas de pagamento também
      await fetchFormasPagamento(accessToken, secretToken);
      
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

  // Buscar formas de pagamento
  const fetchFormasPagamento = useCallback(async (accessToken: string, secretToken: string) => {
    try {
      const response = await fetch('https://api.gestaoclick.com/formas_pagamento', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'secret-access-token': secretToken
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.formas_pagamento && Array.isArray(data.formas_pagamento)) {
        setFormasPagamento(data.formas_pagamento.map((f: { forma_pagamento_id: string; forma_pagamento: string }) => ({
          id: f.forma_pagamento_id,
          nome: f.forma_pagamento
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
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
    loadConfig
  };
}
