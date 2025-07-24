
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'user';

/**
 * Validates if the current user has admin access using database roles
 */
export async function validateAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user found');
      return false;
    }

    // Use any to bypass type checking for the new user_roles table
    const { data, error } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking admin access:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

/**
 * Assigns a role to a user (requires admin access)
 */
export async function assignUserRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    // First check if current user is admin
    const isAdmin = await validateAdminAccess();
    if (!isAdmin) {
      throw new Error('Insufficient permissions to assign roles');
    }

    // Use any to bypass type checking for the new user_roles table
    const { error } = await (supabase as any)
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role
      });

    if (error) {
      console.error('Error assigning role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in assignUserRole:', error);
    return false;
  }
}

/**
 * Gets the role of a specific user
 */
export async function getUserRole(userId: string): Promise<AppRole> {
  try {
    // Use any to bypass type checking for the new user_roles table
    const { data, error } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 'user'; // Default role
    }

    return data.role as AppRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Creates an admin user (should only be used for initial setup)
 */
export async function createAdminUser(userId: string): Promise<boolean> {
  try {
    return await assignUserRole(userId, 'admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}
