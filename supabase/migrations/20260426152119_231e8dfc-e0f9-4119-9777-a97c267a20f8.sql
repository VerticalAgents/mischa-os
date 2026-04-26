CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles 
  WHERE user_id = $1 
  ORDER BY CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'producao' THEN 2 
    WHEN 'representante' THEN 3
    WHEN 'user' THEN 4 
    ELSE 5 END 
  ASC LIMIT 1;
$function$;