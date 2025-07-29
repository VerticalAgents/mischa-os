
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCategoriasEstabelecimento = () => {
  const [categorias, setCategorias] = useState<CategoriaEstabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      
      // Verificar se há sessão ativa antes de fazer a requisição
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('Sessão não encontrada, não carregando categorias de estabelecimento');
        setCategorias([]);
        return;
      }

      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias de estabelecimento:', error);
        
        // Se for erro de autenticação, não mostrar toast para evitar spam
        if (error.code !== 'PGRST301' && !error.message?.includes('JWT expired')) {
          toast({
            title: "Erro",
            description: "Erro ao carregar categorias de estabelecimento",
            variant: "destructive"
          });
        }
        
        // Definir array vazio em caso de erro para não travar outras funcionalidades
        setCategorias([]);
        return;
      }

      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias de estabelecimento:', error);
      
      // Em caso de erro, definir array vazio para não travar a aplicação
      setCategorias([]);
      
      // Não mostrar toast para erros de rede/autenticação
      if (!(error instanceof Error) || !error.message?.includes('JWT expired')) {
        toast({
          title: "Erro",
          description: "Erro ao carregar categorias de estabelecimento",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoria = async (categoria: {
    nome: string;
    descricao?: string;
  }) => {
    try {
      console.log('Tentando adicionar categoria:', categoria);
      
      // Verificar sessão antes de adicionar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .insert({
          nome: categoria.nome.trim(),
          descricao: categoria.descricao?.trim() || null,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast({
          title: "Erro ao criar categoria",
          description: error.message || "Erro desconhecido",
          variant: "destructive"
        });
        return false;
      }

      console.log('Categoria criada com sucesso:', data);
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });

      await carregarCategorias();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar categoria",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarCategoria = async (id: number, updates: {
    nome?: string;
    descricao?: string;
  }) => {
    try {
      console.log('Atualizando categoria:', id, updates);
      
      // Verificar sessão antes de atualizar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome.trim();
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao?.trim() || null;
      
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        toast({
          title: "Erro ao atualizar categoria",
          description: error.message || "Erro desconhecido",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });

      await carregarCategorias();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerCategoria = async (id: number) => {
    try {
      console.log('Removendo categoria:', id);
      
      // Verificar sessão antes de remover
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Faça login novamente.",
          variant: "destructive"
        });
        return false;
      }
      
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover categoria:', error);
        toast({
          title: "Erro ao remover categoria",
          description: error.message || "Erro desconhecido",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso"
      });

      await carregarCategorias();
      return true;
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover categoria",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  return {
    categorias,
    loading,
    carregarCategorias,
    adicionarCategoria,
    atualizarCategoria,
    removerCategoria,
  };
};
