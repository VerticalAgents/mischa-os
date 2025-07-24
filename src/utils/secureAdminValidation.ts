
import { supabase } from '@/integrations/supabase/client';

/**
 * Secure admin validation using database roles instead of hardcoded PINs
 */
export async function validateAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Check if user has admin role using the secure database function
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

/**
 * Assign admin role to a user
 */
export async function assignAdminRole(userId: string): Promise<boolean> {
  try {
    // Only existing admins can assign admin roles
    const isCurrentUserAdmin = await validateAdminAccess();
    if (!isCurrentUserAdmin) {
      throw new Error('Only administrators can assign admin roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin'
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error assigning admin role:', error);
    return false;
  }
}

/**
 * Remove admin role from a user
 */
export async function removeAdminRole(userId: string): Promise<boolean> {
  try {
    // Only existing admins can remove admin roles
    const isCurrentUserAdmin = await validateAdminAccess();
    if (!isCurrentUserAdmin) {
      throw new Error('Only administrators can remove admin roles');
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error removing admin role:', error);
    return false;
  }
}
