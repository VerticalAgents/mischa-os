import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const body = await req.json().catch(() => ({}));
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data } = await supabase
    .from('integracoes_config')
    .select('config')
    .eq('integracao', 'gestaoclick')
    .limit(1)
    .maybeSingle();
  const cfg = (data?.config || {}) as any;
  const { data: out, error } = await supabase.functions.invoke('gestaoclick-proxy', {
    body: { ...body, access_token: cfg.access_token, secret_token: cfg.secret_token },
  });
  return new Response(JSON.stringify({ out, error: error?.message ?? null }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
