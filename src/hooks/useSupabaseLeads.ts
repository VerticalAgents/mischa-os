import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { toast } from '@/hooks/use-toast';

export const useSupabaseLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leadsFormatados: Lead[] = (data || []).map(lead => ({
        id: lead.id,
        nome: lead.nome,
        cnpjCpf: lead.cnpj_cpf || undefined,
        enderecoEntrega: lead.endereco_entrega || undefined,
        linkGoogleMaps: lead.link_google_maps || undefined,
        contatoNome: lead.contato_nome || undefined,
        contatoTelefone: lead.contato_telefone || undefined,
        contatoEmail: lead.contato_email || undefined,
        origem: lead.origem,
        status: lead.status as Lead['status'],
        representanteId: lead.representante_id || undefined,
        categoriaEstabelecimentoId: lead.categoria_estabelecimento_id || undefined,
        quantidadeEstimada: lead.quantidade_estimada || undefined,
        periodicidadeEstimada: lead.periodicidade_estimada || undefined,
        observacoes: lead.observacoes || undefined,
        dataVisita: lead.data_visita || undefined,
        dataContatoWhatsApp: lead.data_contato_whatsapp || undefined,
        dataResposta: lead.data_resposta || undefined,
        motivoPerda: lead.motivo_perda || undefined,
        clienteConvertidoId: lead.cliente_convertido_id || undefined,
        dataConversao: lead.data_conversao || undefined,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      }));

      setLeads(leadsFormatados);
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const adicionarLead = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          nome: lead.nome,
          cnpj_cpf: lead.cnpjCpf || null,
          endereco_entrega: lead.enderecoEntrega || null,
          link_google_maps: lead.linkGoogleMaps || null,
          contato_nome: lead.contatoNome || null,
          contato_telefone: lead.contatoTelefone || null,
          contato_email: lead.contatoEmail || null,
          origem: lead.origem,
          status: lead.status,
          representante_id: lead.representanteId || null,
          categoria_estabelecimento_id: lead.categoriaEstabelecimentoId || null,
          quantidade_estimada: lead.quantidadeEstimada || null,
          periodicidade_estimada: lead.periodicidadeEstimada || null,
          observacoes: lead.observacoes || null,
          data_visita: lead.dataVisita || null,
          data_contato_whatsapp: lead.dataContatoWhatsApp || null,
          data_resposta: lead.dataResposta || null,
          motivo_perda: lead.motivoPerda || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Lead adicionado',
        description: 'Novo lead foi criado com sucesso'
      });

      await carregarLeads();
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar lead:', error);
      toast({
        title: 'Erro ao adicionar lead',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carregarLeads]);

  const atualizarLead = useCallback(async (id: string, dados: Partial<Lead>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nome: dados.nome,
          cnpj_cpf: dados.cnpjCpf || null,
          endereco_entrega: dados.enderecoEntrega || null,
          link_google_maps: dados.linkGoogleMaps || null,
          contato_nome: dados.contatoNome || null,
          contato_telefone: dados.contatoTelefone || null,
          contato_email: dados.contatoEmail || null,
          origem: dados.origem,
          status: dados.status,
          representante_id: dados.representanteId || null,
          categoria_estabelecimento_id: dados.categoriaEstabelecimentoId || null,
          quantidade_estimada: dados.quantidadeEstimada || null,
          periodicidade_estimada: dados.periodicidadeEstimada || null,
          observacoes: dados.observacoes || null,
          data_visita: dados.dataVisita || null,
          data_contato_whatsapp: dados.dataContatoWhatsApp || null,
          data_resposta: dados.dataResposta || null,
          motivo_perda: dados.motivoPerda || null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Lead atualizado',
        description: 'Dados do lead foram salvos com sucesso'
      });

      await carregarLeads();
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: 'Erro ao atualizar lead',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carregarLeads]);

  const deletarLead = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Lead removido',
        description: 'Lead foi excluído com sucesso'
      });

      await carregarLeads();
    } catch (error: any) {
      console.error('Erro ao deletar lead:', error);
      toast({
        title: 'Erro ao deletar lead',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carregarLeads]);

  const converterLeadEmCliente = useCallback(async (leadId: string, clienteId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          cliente_convertido_id: clienteId,
          data_conversao: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      await carregarLeads();
    } catch (error: any) {
      console.error('Erro ao marcar lead como convertido:', error);
      toast({
        title: 'Erro ao converter lead',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [carregarLeads]);

  return {
    leads,
    loading,
    carregarLeads,
    adicionarLead,
    atualizarLead,
    deletarLead,
    converterLeadEmCliente
  };
};
