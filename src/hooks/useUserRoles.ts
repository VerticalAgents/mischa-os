
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export function useUserRoles() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole('user');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setError(error.message);
        setUserRole('user');
      } else {
        setUserRole(data?.role || 'user');
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError('Failed to fetch user role');
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return userRole === role;
  };

  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        }, {
          onConflict: 'user_id,role'
        });

      if (error) {
        throw error;
      }

      // Refresh current user's role if they're assigning to themselves
      if (userId === user?.id) {
        await fetchUserRole();
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      throw err;
    }
  };

  return {
    userRole,
    loading,
    error,
    hasRole,
    isAdmin,
    assignRole,
    refreshRole: fetchUserRole
  };
}
