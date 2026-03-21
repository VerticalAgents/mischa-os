
-- Create custom_roles table for user-defined access types
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom_roles" ON public.custom_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add custom_role_id to role_permissions to link permissions to custom roles
ALTER TABLE public.role_permissions 
  ADD COLUMN custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE CASCADE;

-- Make the enum role column nullable (custom roles won't use it)
ALTER TABLE public.role_permissions ALTER COLUMN role DROP NOT NULL;

-- Unique constraint for custom role + route
CREATE UNIQUE INDEX idx_role_permissions_custom_role_route 
  ON public.role_permissions (custom_role_id, route_key) 
  WHERE custom_role_id IS NOT NULL;

-- Trigger for updated_at on custom_roles
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
