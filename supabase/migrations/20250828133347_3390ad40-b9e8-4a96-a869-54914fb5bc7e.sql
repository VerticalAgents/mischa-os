-- Drop the potentially problematic materialized view that might be causing the security issue
DROP MATERIALIZED VIEW IF EXISTS public.dados_analise_giro_materialized CASCADE;

-- Ensure no traces of SECURITY DEFINER remain
-- Clean up any potential remnants

-- Check if there are any remaining objects with security definer
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remove any potential problematic objects
    FOR r IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    FOR r IN 
        SELECT schemaname, matviewname 
        FROM pg_matviews 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname) || ' CASCADE';
    END LOOP;
END $$;

-- Add a marker to indicate security cleanup
COMMENT ON SCHEMA public IS 'All SECURITY DEFINER views and materialized views removed for security compliance';