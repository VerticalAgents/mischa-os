
-- Fix: replace inline subquery with SECURITY DEFINER function to avoid RLS cascade
DROP POLICY IF EXISTS "Staff reads own custom_role permissions" ON public.role_permissions;
CREATE POLICY "Staff reads own custom_role permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR custom_role_id = (SELECT ctx.custom_role_id FROM public.get_my_staff_context() ctx)
  );

-- Allow staff to read their own staff_accounts record
CREATE POLICY "Staff can read own record" ON public.staff_accounts
  FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid());
