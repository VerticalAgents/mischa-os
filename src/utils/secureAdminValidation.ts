
import { supabase } from '@/integrations/supabase/client';

export async function validateAdminAccess(userId: string): Promise<boolean> {
  try {
    // Get user from auth
    const { data: user, error } = await supabase.auth.getUser();
    
    if (error || !user.user || user.user.id !== userId) {
      console.warn('Admin validation failed: User not found or ID mismatch');
      return false;
    }

    // For now, use email pattern or user metadata to determine admin status
    // This is temporary until Supabase types are updated with user_roles table
    const userMetadata = user.user.user_metadata || {};
    const email = user.user.email || '';
    
    // Check if user is admin based on email or metadata
    const isAdminEmail = email === 'admin@example.com' || email.includes('admin');
    const isAdminFromMetadata = userMetadata.role === 'admin';
    
    const isAdmin = isAdminEmail || isAdminFromMetadata;
    
    if (isAdmin) {
      console.log('✅ Admin access validated for user:', email);
      return true;
    } else {
      console.warn('❌ Admin access denied for user:', email);
      return false;
    }
  } catch (error) {
    console.error('Error validating admin access:', error);
    return false;
  }
}

export async function assignUserRole(targetUserId: string, role: 'admin' | 'user'): Promise<boolean> {
  try {
    // Validate that current user is admin
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Not authenticated');
    }

    const isCurrentUserAdmin = await validateAdminAccess(currentUser.user.id);
    if (!isCurrentUserAdmin) {
      throw new Error('Insufficient permissions');
    }

    // For now, log the role assignment since we can't update the database
    console.log('Role assignment requested:', {
      targetUserId,
      role,
      assignedBy: currentUser.user.email
    });

    // TODO: Once Supabase types are updated, implement actual role assignment:
    // const { error } = await supabase
    //   .from('user_roles')
    //   .upsert({
    //     user_id: targetUserId,
    //     role: role
    //   });

    console.warn('Role assignment not implemented yet - need Supabase types update');
    return false;
  } catch (error) {
    console.error('Error assigning user role:', error);
    return false;
  }
}

export async function getUserRole(userId: string): Promise<'admin' | 'user'> {
  try {
    // Get user from auth
    const { data: user, error } = await supabase.auth.getUser();
    
    if (error || !user.user || user.user.id !== userId) {
      return 'user';
    }

    // For now, use email pattern or user metadata to determine admin status
    const userMetadata = user.user.user_metadata || {};
    const email = user.user.email || '';
    
    // Check if user is admin based on email or metadata
    const isAdminEmail = email === 'admin@example.com' || email.includes('admin');
    const isAdminFromMetadata = userMetadata.role === 'admin';
    
    return (isAdminEmail || isAdminFromMetadata) ? 'admin' : 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}
