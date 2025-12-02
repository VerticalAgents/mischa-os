
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';

export type AppRole = 'admin' | 'user';

export function useUserRoles() {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [userRole, setUserRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Refs para evitar loops e chamadas duplicadas
  const isFetchingRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const fetchUserRole = useCallback(async (userId: string | null) => {
    // Evitar chamadas duplicadas
    if (isFetchingRef.current) {
      return;
    }
    
    // Evitar refetch para o mesmo usuário
    if (lastUserIdRef.current === userId && hasLoaded) {
      return;
    }

    if (!userId) {
      setUserRole('user');
      setLoading(false);
      setHasLoaded(true);
      lastUserIdRef.current = null;
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      // Use the secure database function
      const { data, error } = await supabase
        .rpc('get_user_role', {
          user_id: userId
        });

      if (error) {
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
        setUserRole('user');
      } else if (data) {
        setUserRole(data as AppRole);
      } else {
        // No role found, default to 'user'
        setUserRole('user');
      }
      
      lastUserIdRef.current = userId;
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError('Failed to fetch user role');
      setUserRole('user');
    } finally {
      setLoading(false);
      setHasLoaded(true);
      isFetchingRef.current = false;
    }
  }, [hasLoaded]);

  useEffect(() => {
    const userId = user?.id ?? null;
    
    // Só buscar se o userId mudou
    if (lastUserIdRef.current !== userId) {
      fetchUserRole(userId);
    }
  }, [user?.id, fetchUserRole]);

  const hasRole = (role: AppRole): boolean => {
    return userRole === role;
  };

  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      // Validate input
      if (!userId || !role) {
        throw new Error('User ID and role are required');
      }

      if (!['admin', 'user'].includes(role)) {
        throw new Error('Invalid role specified');
      }

      // Check if current user is admin
      if (!isAdmin()) {
        throw new Error('Insufficient permissions to assign roles');
      }

      // Prevent self-demotion from admin
      if (userId === user?.id && role === 'user' && userRole === 'admin') {
        throw new Error('Cannot remove your own admin access');
      }

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        });

      if (error) {
        throw error;
      }

      // Log the role assignment
      await logAction({
        action: 'ROLE_ASSIGNED',
        table_name: 'user_roles',
        record_id: userId,
        new_values: {
          user_id: userId,
          role: role,
          assigned_by: user?.id
        }
      });

      // Refresh role if assigning to current user
      if (userId === user?.id) {
        lastUserIdRef.current = null; // Force refetch
        await fetchUserRole(user.id);
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      throw err;
    }
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    try {
      // Check if current user is admin
      if (!isAdmin()) {
        throw new Error('Insufficient permissions to revoke roles');
      }

      // Prevent self-revocation of admin
      if (userId === user?.id && role === 'admin') {
        throw new Error('Cannot revoke your own admin access');
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        throw error;
      }

      // Log the role revocation
      await logAction({
        action: 'ROLE_REVOKED',
        table_name: 'user_roles',
        record_id: userId,
        old_values: {
          user_id: userId,
          role: role,
          revoked_by: user?.id
        }
      });

      // Refresh role if revoking from current user
      if (userId === user?.id) {
        lastUserIdRef.current = null; // Force refetch
        await fetchUserRole(user.id);
      }
    } catch (err) {
      console.error('Error revoking role:', err);
      throw err;
    }
  };

  // Função wrapper para refresh manual
  const refreshRole = useCallback(() => {
    lastUserIdRef.current = null; // Force refetch
    return fetchUserRole(user?.id ?? null);
  }, [user?.id, fetchUserRole]);

  return {
    userRole,
    loading: loading && !hasLoaded, // Só mostra loading na primeira vez
    error,
    hasRole,
    isAdmin,
    assignRole,
    revokeRole,
    refreshRole
  };
}
