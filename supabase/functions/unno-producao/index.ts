// Producao registrada no unno-estoque (outro banco), para o botao
// "Puxar do unno-estoque" da aba Registro do PCP. SOMENTE LEITURA.
//
// O navegador nao fala com o banco de la: quem le e esta funcao, com um usuario
// que so enxerga as sessoes de producao (mischaos_leitor). A conexao fica no
// segredo UNNO_ESTOQUE_LEITURA_URL, fora do repositorio.
//
// A consulta e a mesma de mischas/automacoes/mischaos_sync/unno.mjs: uma linha
// por sessao x ficha, em formas. Quem compara com o Mischa OS e a tela
// (src/utils/sincroniaProducao.ts).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return responder({ error: 'Não autenticado' }, 401);

    // Vale a mesma regra do resto do PCP: dono ou equipe.
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: permitido, error: erroPermissao } = await supabase.rpc('is_owner_or_staff');
    if (erroPermissao || !permitido) return responder({ error: 'Sem permissão' }, 403);

    const { desde, ate } = await req.json().catch(() => ({}));
    if (!DATA.test(desde || '') || !DATA.test(ate || '')) {
      return responder({ error: 'Informe desde e ate como AAAA-MM-DD' }, 400);
    }

    const url = Deno.env.get('UNNO_ESTOQUE_LEITURA_URL');
    if (!url) return responder({ error: 'Conexão com o unno-estoque não configurada' }, 500);

    const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 5, connect_timeout: 10 });
    try {
      const sessoes = await sql`
        SELECT s.codigo                   AS sessao,
               s.data_producao::text      AS data,
               s.status                   AS status,
               f.nome                     AS ficha,
               sum(sk.multiplicador)::int AS formas
          FROM sessoes_producao_skus sk
          JOIN sessoes_producao s ON s.id = sk.sessao_id
          JOIN fichas_tecnicas f ON f.id = sk.ficha_tecnica_id
         WHERE s.data_producao BETWEEN ${desde}::date AND ${ate}::date
         GROUP BY 1, 2, 3, 4
         ORDER BY 2, 1, 4`;
      return responder({ sessoes });
    } finally {
      await sql.end({ timeout: 2 });
    }
  } catch (e) {
    console.error('unno-producao', e);
    return responder({ error: 'Não consegui ler o unno-estoque. Tente de novo em instantes.' }, 500);
  }
});
