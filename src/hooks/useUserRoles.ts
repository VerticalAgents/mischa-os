
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'user';

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
      // For now, use user metadata or email to determine admin status
      // This is a temporary solution until Supabase types are updated
      const userMetadata = user.user_metadata || {};
      const email = user.email || '';
      
      // Check if user is admin based on email or metadata
      const isAdminEmail = email === 'admin@example.com' || email.includes('admin');
      const isAdminFromMetadata = userMetadata.role === 'admin';
      
      if (isAdminEmail || isAdminFromMetadata) {
        setUserRole('admin');
      } else {
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
      // This would normally update the user_roles table
      // For now, this is a placeholder
      console.log('Role assignment not implemented yet - need Supabase types update');
      throw new Error('Role assignment requires database migration to be completed');
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
