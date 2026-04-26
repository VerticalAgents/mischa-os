import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';

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

export function useCustomRolePermissions(customRoleId: string | null) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!customRoleId) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('custom_role_id', customRoleId);

      if (error) throw error;

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
  }, [customRoleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const togglePermission = (routeKey: string, field: 'can_access' | 'can_edit') => {
    setPermissions(prev => prev.map(p => {
      if (p.route_key !== routeKey) return p;
      if (field === 'can_access' && p.can_access) {
        return { ...p, can_access: false, can_edit: false };
      }
      if (field === 'can_edit' && !p.can_access) {
        return p;
      }
      return { ...p, [field]: !p[field] };
    }));
  };

  const savePermissions = async () => {
    if (!customRoleId) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Delete existing permissions for this custom role, then insert fresh
      await supabase
        .from('role_permissions')
        .delete()
        .eq('custom_role_id', customRoleId);

      const rows = permissions
        .filter(p => p.can_access || p.can_edit)
        .map(p => ({
          user_id: user.id,
          custom_role_id: customRoleId,
          route_key: p.route_key,
          route_label: p.route_label,
          can_access: p.can_access,
          can_edit: p.can_edit,
        }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(rows);
        if (error) throw error;
      }

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

export interface RoutePermissionMap {
  [routeKey: string]: { can_access: boolean; can_edit: boolean };
}

// Hook for sidebar/route guards to read effective permissions for current user
export function useMyPermissions() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRoles();
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>([]);
  const [editableRoutes, setEditableRoutes] = useState<string[]>([]);
  const [permissionMap, setPermissionMap] = useState<RoutePermissionMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading || !user) return;

    // Admin has full access - no need to query
    if (userRole === 'admin') {
      const allKeys = ALL_ROUTES.map(r => r.key);
      setAllowedRoutes(allKeys);
      setEditableRoutes(allKeys);
      const map: RoutePermissionMap = {};
      allKeys.forEach(k => { map[k] = { can_access: true, can_edit: true }; });
      setPermissionMap(map);
      setLoading(false);
      return;
    }

    // Representante: acesso fixo apenas a Home, Clientes e Agendamento
    if (userRole === 'representante') {
      const repRoutes = ['/home', '/clientes', '/agendamento'];
      const map: RoutePermissionMap = {};
      repRoutes.forEach(k => { map[k] = { can_access: true, can_edit: true }; });
      setPermissionMap(map);
      setAllowedRoutes(repRoutes);
      setEditableRoutes(repRoutes);
      setLoading(false);
      return;
    }

    // Staff: RLS already filters to only their custom_role_id permissions
    const fetchPerms = async () => {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('route_key, can_access, can_edit');

        if (error) throw error;

        const map: RoutePermissionMap = {};
        const allowed: string[] = [];
        const editable: string[] = [];

        (data || []).forEach(d => {
          map[d.route_key] = { can_access: d.can_access, can_edit: d.can_edit };
          if (d.can_access) allowed.push(d.route_key);
          if (d.can_edit) editable.push(d.route_key);
        });

        setPermissionMap(map);
        setAllowedRoutes(allowed);
        setEditableRoutes(editable);
      } catch (error) {
        console.error('Error fetching my permissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerms();
  }, [user, userRole, roleLoading]);

  return { allowedRoutes, editableRoutes, permissionMap, loading };
}

// Convenience hook for a specific route
export function useRoutePermission(routeKey: string) {
  const { permissionMap, loading } = useMyPermissions();
  const perm = permissionMap[routeKey];
  return {
    canAccess: perm?.can_access ?? false,
    canEdit: perm?.can_edit ?? false,
    loading,
  };
}
