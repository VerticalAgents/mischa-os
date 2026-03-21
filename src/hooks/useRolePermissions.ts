import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Master list of all available routes in the app
export const ALL_ROUTES = [
  { key: '/home', label: 'Início', group: 'Principal' },
  { key: '/agendamento', label: 'Agendamento', group: 'Operacional' },
  { key: '/expedicao', label: 'Expedição', group: 'Operacional' },
  { key: '/estoque/insumos', label: 'Estoque', group: 'Operacional' },
  { key: '/pcp', label: 'PCP', group: 'Operacional' },
  { key: '/controle-trocas', label: 'Controle de Trocas', group: 'Operacional' },
  { key: '/reagendamentos', label: 'Reagendamentos', group: 'Operacional' },
  { key: '/clientes', label: 'Clientes', group: 'Tático' },
  { key: '/mapas', label: 'Mapas', group: 'Tático' },
  { key: '/precificacao', label: 'Precificação', group: 'Tático' },
  { key: '/gestao-comercial', label: 'Gestão Comercial', group: 'Tático' },
  { key: '/dashboard-analytics', label: 'Dashboard & Analytics', group: 'Estratégico' },
  { key: '/analise-giro', label: 'Insights PDV', group: 'Estratégico' },
  { key: '/gestao-financeira', label: 'Financeiro', group: 'Estratégico' },
  { key: '/agentes-ia', label: 'Agentes de IA', group: 'Estratégico' },
  { key: '/manual', label: 'Manual', group: 'Sistema' },
  { key: '/configuracoes', label: 'Configurações', group: 'Sistema' },
] as const;

export interface RolePermission {
  id?: string;
  route_key: string;
  route_label: string;
  can_access: boolean;
  can_edit: boolean;
}

export function useRolePermissions(role: string) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role);

      if (error) throw error;

      // Merge DB data with master route list
      const dbMap = new Map((data || []).map(d => [d.route_key, d]));
      const merged = ALL_ROUTES.map(route => {
        const db = dbMap.get(route.key);
        return {
          id: db?.id,
          route_key: route.key,
          route_label: route.label,
          can_access: db?.can_access ?? false,
          can_edit: db?.can_edit ?? false,
        };
      });

      setPermissions(merged);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const togglePermission = (routeKey: string, field: 'can_access' | 'can_edit') => {
    setPermissions(prev => prev.map(p => {
      if (p.route_key !== routeKey) return p;
      if (field === 'can_access' && p.can_access) {
        // Turning off access also turns off edit
        return { ...p, can_access: false, can_edit: false };
      }
      if (field === 'can_edit' && !p.can_access) {
        // Can't enable edit without access
        return p;
      }
      return { ...p, [field]: !p[field] };
    }));
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upsert all permissions
      const rows = permissions.map(p => ({
        user_id: user.id,
        role,
        route_key: p.route_key,
        route_label: p.route_label,
        can_access: p.can_access,
        can_edit: p.can_edit,
      }));

      const { error } = await supabase
        .from('role_permissions')
        .upsert(rows, { onConflict: 'user_id,role,route_key' });

      if (error) throw error;

      toast.success('Permissões salvas com sucesso!');
      fetchPermissions();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(error.message || 'Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  return { permissions, loading, saving, togglePermission, savePermissions, fetchPermissions };
}

// Hook for sidebar/route guards to read effective permissions for current user
export function useMyPermissions() {
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [editableRoutes, setEditableRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('route_key, can_access, can_edit');

        if (error) throw error;

        setAllowedRoutes((data || []).filter(d => d.can_access).map(d => d.route_key));
        setEditableRoutes((data || []).filter(d => d.can_edit).map(d => d.route_key));
      } catch (error) {
        console.error('Error fetching my permissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { allowedRoutes, editableRoutes, loading };
}
