
-- Drop the leaky policy that returns ALL owner permissions to staff
DROP POLICY IF EXISTS "Staff can read owner permissions" ON public.role_permissions;

-- Drop the overly permissive policy that lets any user manage their own permissions
DROP POLICY IF EXISTS "Users can manage own role_permissions" ON public.role_permissions;
