
import { useState, useEffect } from 'react';
import { useConfiguracoesStore } from './useConfiguracoesStore';
import { useSupabasePrecosCategoriaCliente } from './useSupabasePrecosCategoriaCliente';
import { toast } from '@/hooks/use-toast';

export interface PrecoCategoriaCliente {
  categoriaId: number;
  preco: number;
  precoPersonalizado: boolean;
}

export const usePrecificacaoClienteStore = () => {
  const [precosCliente, setPrecosCliente] = useState<PrecoCategoriaCliente[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { obterConfiguracao } = useConfiguracoesStore();
  const { 
    precos: precosSupabase, 
    carregarPrecosPorCliente, 
    salvarPrecos 
  } = useSupabasePrecosCategoriaCliente();

  // Carregar preços para um cliente específico
  const carregarPrecosCliente = async (clienteId: string, categoriasHabilitadas: number[]) => {
    if (!clienteId || !categoriasHabilitadas?.length) {
      setPrecosCliente([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Carregando preços para cliente:', { clienteId, categoriasHabilitadas });
      
      // Carregar preços personalizados do cliente do Supabase
      const precosPersonalizados = await carregarPrecosPorCliente(clienteId);
      
      // Carregar configurações de precificação padrão
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      
      console.log('📊 Dados carregados:', { 
        precosPersonalizados: precosPersonalizados.length,
        precosPadrao: Object.keys(precosPadrao).length 
      });

      // Criar array de preços combinando personalizados e padrão
      const precosFinais: PrecoCategoriaCliente[] = categoriasHabilitadas.map(categoriaId => {
        const categoriaIdStr = categoriaId.toString();
        
        // Verificar se existe preço personalizado para esta categoria
        const precoPersonalizado = precosPersonalizados.find(
          p => p.categoria_id === categoriaId
        );
        
        if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
          return {
            categoriaId,
            preco: precoPersonalizado.preco_unitario,
            precoPersonalizado: true
          };
        }
        
        // Usar preço padrão da configuração
        const precoPadrao = precosPadrao[categoriaIdStr] || 0;
        return {
          categoriaId,
          preco: precoPadrao,
          precoPersonalizado: false
        };
      });

      console.log('✅ Preços finais carregados:', precosFinais);
      setPrecosCliente(precosFinais);
    } catch (error) {
      console.error('❌ Erro ao carregar preços do cliente:', error);
      toast({
        title: "Erro ao carregar preços",
        description: "Não foi possível carregar os preços por categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar preços personalizados do cliente
  const salvarPrecosCliente = async (clienteId: string, precos: PrecoCategoriaCliente[]) => {
    if (!clienteId) {
      toast({
        title: "Erro",
        description: "ID do cliente é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('💾 Salvando preços personalizados:', { clienteId, precos });
      
      // Converter para formato esperado pelo hook do Supabase
      const precosParaSalvar = precos
        .filter(p => p.precoPersonalizado && p.preco > 0)
        .map(p => ({
          categoria_id: p.categoriaId,
          preco_unitario: p.preco
        }));

      const sucesso = await salvarPrecos(clienteId, precosParaSalvar);
      
      if (sucesso) {
        toast({
          title: "Preços salvos",
          description: "Preços personalizados foram salvos com sucesso"
        });
      }
      
      return sucesso;
    } catch (error) {
      console.error('❌ Erro ao salvar preços do cliente:', error);
      toast({
        title: "Erro ao salvar preços",
        description: "Não foi possível salvar os preços personalizados",
        variant: "destructive"
      });
      return false;
    }
  };

  // Atualizar preço de uma categoria específica
  const atualizarPrecoCategoria = (categoriaId: number, novoPreco: number, personalizado: boolean = true) => {
    setPrecosCliente(prev => prev.map(p => 
      p.categoriaId === categoriaId 
        ? { ...p, preco: novoPreco, precoPersonalizado: personalizado }
        : p
    ));
  };

  // Resetar preço para o padrão
  const resetarPrecoParaPadrao = (categoriaId: number) => {
    const configPrecificacao = obterConfiguracao('precificacao');
    const precosPadrao = configPrecificacao?.precosPorCategoria || {};
    const precoPadrao = precosPadrao[categoriaId.toString()] || 0;
    
    atualizarPrecoCategoria(categoriaId, precoPadrao, false);
  };

  return {
    precosCliente,
    loading,
    carregarPrecosCliente,
    salvarPrecosCliente,
    atualizarPrecoCategoria,
    resetarPrecoParaPadrao
  };
};
