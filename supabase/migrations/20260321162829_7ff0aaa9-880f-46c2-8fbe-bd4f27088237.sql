
-- Add credential columns to staff_accounts
ALTER TABLE public.staff_accounts ADD COLUMN login_email text;
ALTER TABLE public.staff_accounts ADD COLUMN senha_acesso text;

-- Backfill login_email from profiles
UPDATE public.staff_accounts sa
SET login_email = p.email
FROM public.profiles p
WHERE p.id = sa.staff_user_id AND sa.login_email IS NULL;
