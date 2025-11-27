
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ConfiguracaoModulo {
  id: string;
  modulo: string;
  configuracoes: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useConfiguracoesStore = () => {
  const [configuracoes, setConfiguracoes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Carregar todas as configurações DO USUÁRIO LOGADO
  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro ao carregar configurações",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const configsMap: Record<string, any> = {};
      data?.forEach((config: ConfiguracaoModulo) => {
        configsMap[config.modulo] = config.configuracoes;
      });

      setConfiguracoes(configsMap);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar configuração específica de um módulo DO USUÁRIO LOGADO
  const carregarConfiguracao = async (modulo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado');
        return null;
      }

      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('configuracoes')
        .eq('modulo', modulo)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error(`Erro ao carregar configuração do módulo ${modulo}:`, error);
        return null;
      }

      return data?.configuracoes || {};
    } catch (error) {
      console.error(`Erro ao carregar configuração do módulo ${modulo}:`, error);
      return null;
    }
  };

  // Salvar configuração de um módulo PARA O USUÁRIO LOGADO
  const salvarConfiguracao = async (modulo: string, novasConfiguracoes: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Usuário não autenticado');
        toast({
          title: "Erro ao salvar configurações",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return false;
      }

      // Primeiro, verificar se já existe uma configuração para este módulo E usuário
      const { data: existingData, error: selectError } = await supabase
        .from('configuracoes_sistema')
        .select('id')
        .eq('modulo', modulo)
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error(`Erro ao verificar configuração existente do módulo ${modulo}:`, selectError);
        toast({
          title: "Erro ao salvar configurações",
          description: selectError.message,
          variant: "destructive"
        });
        return false;
      }

      let result;
      if (existingData) {
        // Atualizar registro existente
        result = await supabase
          .from('configuracoes_sistema')
          .update({
            configuracoes: novasConfiguracoes,
            updated_at: new Date().toISOString()
          })
          .eq('modulo', modulo)
          .eq('user_id', user.id);
      } else {
        // Inserir novo registro COM user_id
        result = await supabase
          .from('configuracoes_sistema')
          .insert({
            modulo,
            configuracoes: novasConfiguracoes,
            user_id: user.id
          });
      }

      if (result.error) {
        console.error(`Erro ao salvar configuração do módulo ${modulo}:`, result.error);
        toast({
          title: "Erro ao salvar configurações",
          description: result.error.message,
          variant: "destructive"
        });
        return false;
      }

      // Atualizar estado local
      setConfiguracoes(prev => ({
        ...prev,
        [modulo]: novasConfiguracoes
      }));

      return true;
    } catch (error) {
      console.error(`Erro ao salvar configuração do módulo ${modulo}:`, error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Erro interno do sistema",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obter configuração de um módulo do estado local
  const obterConfiguracao = (modulo: string) => {
    return configuracoes[modulo] || {};
  };

  // Carregar configurações na inicialização
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return {
    configuracoes,
    loading,
    carregarConfiguracoes,
    carregarConfiguracao,
    salvarConfiguracao,
    obterConfiguracao
  };
};
