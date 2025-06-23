
import { supabase } from '@/integrations/supabase/client';

export async function validateAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    return !!roleData;
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

export async function requireAdminAccess(): Promise<void> {
  const isAdmin = await validateAdminAccess();
  
  if (!isAdmin) {
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação');
  }
}

// Utility to create admin users (should be used sparingly and with caution)
export async function createAdminUser(userEmail: string): Promise<boolean> {
  try {
    // First verify current user is admin
    const hasAccess = await validateAdminAccess();
    if (!hasAccess) {
      throw new Error('Apenas administradores podem criar outros administradores');
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (userError || !userData) {
      throw new Error('Usuário não encontrado');
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userData.id,
        role: 'admin'
      });

    if (roleError) {
      throw roleError;
    }

    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}
