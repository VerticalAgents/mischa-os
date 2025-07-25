
import { supabase } from '@/integrations/supabase/client';
import { SecureInputValidator } from './secureInputValidator';

export type AppRole = 'admin' | 'user';

/**
 * Validates if the current user has admin access using secure database roles
 */
export async function validateAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user found');
      return false;
    }

    // Use the secure database function to check admin access
    const { data, error } = await supabase
      .rpc('has_role', {
        user_id: user.id,
        required_role: 'admin'
      });

    if (error) {
      console.error('Error checking admin access:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

/**
 * Securely assigns a role to a user (requires admin access)
 */
export async function assignUserRole(userId: string, role: AppRole): Promise<boolean> {
  try {
    // Input validation
    if (!SecureInputValidator.validateLength(userId, 1, 100)) {
      throw new Error('Invalid user ID format');
    }

    if (!['admin', 'user'].includes(role)) {
      throw new Error('Invalid role specified');
    }

    // First check if current user is admin
    const isAdmin = await validateAdminAccess();
    if (!isAdmin) {
      throw new Error('Insufficient permissions to assign roles');
    }

    const { error } = await supabase
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
 * Securely gets the role of a specific user
 */
export async function getUserRole(userId: string): Promise<AppRole> {
  try {
    if (!SecureInputValidator.validateLength(userId, 1, 100)) {
      return 'user';
    }

    const { data, error } = await supabase
      .rpc('get_user_role', {
        user_id: userId
      });

    if (error || !data) {
      return 'user'; // Default role
    }

    return data as AppRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Creates an admin user with proper validation
 */
export async function createAdminUser(userId: string): Promise<boolean> {
  try {
    // Additional validation for admin creation
    if (!SecureInputValidator.validateLength(userId, 1, 100)) {
      throw new Error('Invalid user ID format');
    }

    return await assignUserRole(userId, 'admin');
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
}

/**
 * Securely revokes admin access from a user
 */
export async function revokeAdminAccess(userId: string): Promise<boolean> {
  try {
    // Input validation
    if (!SecureInputValidator.validateLength(userId, 1, 100)) {
      throw new Error('Invalid user ID format');
    }

    // First check if current user is admin
    const isAdmin = await validateAdminAccess();
    if (!isAdmin) {
      throw new Error('Insufficient permissions to revoke roles');
    }

    // Prevent self-revocation
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === userId) {
      throw new Error('Cannot revoke your own admin access');
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) {
      console.error('Error revoking admin access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in revokeAdminAccess:', error);
    return false;
  }
}
