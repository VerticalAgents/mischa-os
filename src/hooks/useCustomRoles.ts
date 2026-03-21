import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomRole {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useCustomRoles() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRoles((data as CustomRole[]) || []);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      toast.error('Erro ao carregar tipos de acesso');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = async (name: string, description: string, color: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('custom_roles')
        .insert({ user_id: user.id, name, description, color });

      if (error) throw error;
      toast.success('Tipo de acesso criado!');
      await fetchRoles();
      return true;
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Erro ao criar tipo de acesso');
      return false;
    }
  };

  const updateRole = async (id: string, name: string, description: string, color: string) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .update({ name, description, color })
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de acesso atualizado!');
      await fetchRoles();
      return true;
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Erro ao atualizar');
      return false;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de acesso excluído!');
      await fetchRoles();
      return true;
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Erro ao excluir');
      return false;
    }
  };

  return { roles, loading, createRole, updateRole, deleteRole, fetchRoles };
}
