
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user';

export function useUserRoles() {
  const { user } from useAuth();
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
      // Query the user_roles table to get the user's role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching user role:', error);
        setError('Failed to fetch user role');
        setUserRole('user');
      } else if (data) {
        setUserRole(data.role as AppRole);
      } else {
        // No role found, default to 'user'
        setUserRole('user');
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
        });

      if (error) {
        throw error;
      }

      // Refresh role if assigning to current user
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
