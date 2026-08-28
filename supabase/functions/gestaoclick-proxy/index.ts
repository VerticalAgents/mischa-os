import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GESTAOCLICK_BASE_URL = 'https://api.gestaoclick.com';

interface GestaoClickConfig {
  access_token: string;
  secret_token: string;
  situacao_id?: string;
  situacao_edicao_id?: string;
  situacao_cancelado_id?: string;
  vendedor_id?: string;
  loja_id?: string;
  empresa_id?: string;
  fornecedor_id?: string;
  forma_pagamento_ids?: {
    BOLETO?: string;
    PIX?: string;
    DINHEIRO?: string;
  };
}

// Helper: Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper: GET paginado genérico na API do GestaoClick
async function fetchGCPaginado(
  path: string,
  access_token: string,
  secret_token: string,
  chave?: string,
): Promise<any[]> {
  const todos: any[] = [];
  let pagina = 1;
  let totalPaginas = 1;

  do {
    const sep = path.includes('?') ? '&' : '?';
    const resp = await fetch(`${GESTAOCLICK_BASE_URL}/${path}${sep}pagina=${pagina}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': access_token,
        'secret-access-token': secret_token,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Erro ao consultar ${path}: ${resp.status} ${errorText.slice(0, 200)}`);
    }

    const json = await resp.json();
    const lista = json?.data || [];
    lista.forEach((item: any) => todos.push(chave ? (item[chave] || item) : item));

    if (json?.meta?.total_paginas) totalPaginas = json.meta.total_paginas;
    if (lista.length === 0) break;
    pagina++;
  } while (pagina <= totalPaginas && pagina <= 50);

  return todos;
}

const numGC = (v: any): number => parseFloat(String(v ?? '0').replace(',', '.')) || 0;

// Helper: resolve os tokens do GestaoClick do "dono" da conta (admin) a partir
// do usuario autenticado. Usado em acoes SOMENTE LEITURA para que contas de
// representante/staff (que nao tem conta no GC) possam visualizar os dados.
async function resolveTokensDoDono(
  supabase: any,
  userId: string | null,
): Promise<{ access_token: string; secret_token: string } | null> {
  if (!userId) return null;

  let ownerId: string | null = null;

  const { data: repAccount } = await supabase
    .from('representante_accounts')
    .select('owner_id, ativo')
    .eq('auth_user_id', userId)
    .eq('ativo', true)
    .maybeSingle();
  if (repAccount?.owner_id) ownerId = repAccount.owner_id as string;

  if (!ownerId) {
    const { data: staffOwner } = await supabase.rpc('get_owner_id', { _user_id: userId });
    if (staffOwner) ownerId = staffOwner as string;
  }

  if (!ownerId) ownerId = userId;

  const { data: configData } = await supabase
    .from('integracoes_config')
    .select('config')
    .eq('user_id', ownerId)
    .eq('integracao', 'gestaoclick')
    .maybeSingle();

  const cfg = (configData?.config || {}) as GestaoClickConfig;
  if (!cfg.access_token || !cfg.secret_token) return null;
  return { access_token: cfg.access_token, secret_token: cfg.secret_token };
}

// Helper: Calculate data_vencimento based on payment method
function calcularDataVencimento(formaPagamento: string, prazoPagamentoDias: number | null): string {
  const dataVenda = new Date();
  
  switch (formaPagamento) {
    case 'DINHEIRO':
      // Same day
      return formatDate(dataVenda);
    case 'PIX':
      // +1 day
      return formatDate(addDays(dataVenda, 1));
    case 'BOLETO':
    default:
      // Use prazo_pagamento_dias (default 7)
      const prazo = prazoPagamentoDias || 7;
      return formatDate(addDays(dataVenda, prazo));
  }
}

// Helper: Detect GestaoClick error in response (even with 200 status)
function hasGCError(responseText: string, status: number): boolean {
  if (status >= 400) return true;
  if (responseText.includes('cake-error')) return true;
  if (responseText.includes('"status":"error"')) return true;
  if (responseText.includes('"ok":false')) return true;
  if (responseText.includes('não possui permissão')) return true;
  if (responseText.includes('Pedido não encontrado')) return true;
  return false;
}

// Helper: Get next sequential sale code from GestaoClick
async function getProximoCodigoVenda(accessToken: string, secretToken: string): Promise<number> {
  try {
    // Fetch last 50 sales to find the true highest numeric code
    // (ordenação pode ser alfabética: "999" > "2060", então precisamos do Math.max)
    const response = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?limite=50&ordenar_por=codigo&ordem=desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'secret-access-token': secretToken,
      },
    });

    if (!response.ok) {
      console.log('[gestaoclick-proxy] Erro ao buscar última venda, usando timestamp como fallback');
      return Math.floor(Date.now() / 1000);
    }

    const data = await response.json();
    
    // Extract highest codigo from ALL returned sales using Math.max
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const codigos = data.data
        .map((venda: any) => {
          const codigoStr = venda.codigo || venda.Venda?.codigo;
          return parseInt(codigoStr, 10);
        })
        .filter((c: number) => !isNaN(c));
      
      if (codigos.length > 0) {
        const maxCodigo = Math.max(...codigos);
        console.log(`[gestaoclick-proxy] Maior código encontrado entre ${codigos.length} vendas: ${maxCodigo}, próximo: ${maxCodigo + 1}`);
        return maxCodigo + 1;
      }
    }
    
    // If no sales found, start from 1
    console.log('[gestaoclick-proxy] Nenhuma venda encontrada, começando do 1');
    return 1;
  } catch (error) {
    console.error('[gestaoclick-proxy] Erro ao buscar próximo código:', error);
    return Math.floor(Date.now() / 1000);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`[gestaoclick-proxy] Action: ${action}`, params);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    switch (action) {
      case 'test_connection': {
        // Test connection with provided tokens
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch situacoes_vendas
        const situacoesResponse = await fetch(`${GESTAOCLICK_BASE_URL}/situacoes_vendas`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!situacoesResponse.ok) {
          const errorText = await situacoesResponse.text();
          console.error('[gestaoclick-proxy] situacoes_vendas error:', errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao conectar: ${situacoesResponse.status}` }),
            { status: situacoesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const situacoesData = await situacoesResponse.json();
        console.log('[gestaoclick-proxy] situacoes_vendas response:', situacoesData);

        // Fetch formas_pagamentos
        const formasResponse = await fetch(`${GESTAOCLICK_BASE_URL}/formas_pagamentos`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!formasResponse.ok) {
          const errorText = await formasResponse.text();
          console.error('[gestaoclick-proxy] formas_pagamentos error:', errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao buscar formas de pagamento: ${formasResponse.status}` }),
            { status: formasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const formasData = await formasResponse.json();
        console.log('[gestaoclick-proxy] formas_pagamentos response:', formasData);

        // Parse responses - API returns { data: [...] }
        const situacoes = situacoesData.data || situacoesData.situacoes_vendas || situacoesData || [];
        const formasPagamento = formasData.data || formasData.formas_pagamentos || formasData || [];

        return new Response(
          JSON.stringify({ 
            success: true, 
            situacoes: Array.isArray(situacoes) ? situacoes.map((s: any) => ({
              id: s.id || s.situacao_venda_id,
              nome: s.nome || s.situacao_venda
            })) : [],
            formas_pagamento: Array.isArray(formasPagamento) ? formasPagamento.map((f: any) => ({
              id: f.FormasPagamento?.id || f.id || f.forma_pagamento_id,
              nome: f.FormasPagamento?.nome || f.nome || f.forma_pagamento
            })) : []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_clientes_gc': {
        // List ALL clients from GestaoClick with pagination
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const todosClientes: any[] = [];
        let paginaAtual = 1;
        let totalPaginas = 1;

        do {
          const clientesResponse = await fetch(`${GESTAOCLICK_BASE_URL}/clientes?pagina=${paginaAtual}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': access_token,
              'secret-access-token': secret_token,
            },
          });

          if (!clientesResponse.ok) {
            const errorText = await clientesResponse.text();
            console.error('[gestaoclick-proxy] clientes error:', errorText);
            return new Response(
              JSON.stringify({ error: `Erro ao buscar clientes: ${clientesResponse.status}` }),
              { status: clientesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const clientesData = await clientesResponse.json();
          console.log(`[gestaoclick-proxy] clientes page ${paginaAtual}/${clientesData?.meta?.total_paginas || 1}, count: ${clientesData?.data?.length || 0}`);

          if (clientesData?.meta?.total_paginas) {
            totalPaginas = clientesData.meta.total_paginas;
          }

          const clientes = clientesData.data || [];
          todosClientes.push(...clientes);

          paginaAtual++;
        } while (paginaAtual <= totalPaginas);

        console.log('[gestaoclick-proxy] total clientes fetched:', todosClientes.length);

        return new Response(
          JSON.stringify({ 
            success: true, 
            clientes: todosClientes.map((c: any) => {
              const cliente = c.Cliente || c;
              return {
                id: cliente.id,
                nome: cliente.nome || cliente.razao_social,
                cnpj_cpf: cliente.cnpj || cliente.cpf || cliente.cnpj_cpf
              };
            })
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_funcionarios_gc': {
        // List ALL employees from GestaoClick with pagination
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const todosFuncionarios: any[] = [];
        let paginaAtual = 1;
        let totalPaginas = 1;

        do {
          const funcionariosResponse = await fetch(`${GESTAOCLICK_BASE_URL}/funcionarios?pagina=${paginaAtual}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': access_token,
              'secret-access-token': secret_token,
            },
          });

          if (!funcionariosResponse.ok) {
            const errorText = await funcionariosResponse.text();
            console.error('[gestaoclick-proxy] funcionarios error:', errorText);
            return new Response(
              JSON.stringify({ error: `Erro ao buscar funcionários: ${funcionariosResponse.status}` }),
              { status: funcionariosResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const funcionariosData = await funcionariosResponse.json();
          console.log(`[gestaoclick-proxy] funcionarios page ${paginaAtual}/${funcionariosData?.meta?.total_paginas || 1}, count: ${funcionariosData?.data?.length || 0}`);

          if (funcionariosData?.meta?.total_paginas) {
            totalPaginas = funcionariosData.meta.total_paginas;
          }

          const funcionarios = funcionariosData.data || [];
          todosFuncionarios.push(...funcionarios);

          paginaAtual++;
        } while (paginaAtual <= totalPaginas);

        console.log('[gestaoclick-proxy] total funcionarios fetched:', todosFuncionarios.length);

        return new Response(
          JSON.stringify({ 
            success: true, 
            funcionarios: todosFuncionarios.map((f: any) => {
              const func = f.Funcionario || f;
              return {
                id: func.id,
                nome: func.nome
              };
            })
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_produtos_gc': {
        // List ALL products from GestaoClick with pagination
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const todosProdutos: any[] = [];
        let paginaAtual = 1;
        let totalPaginas = 1;

        do {
          const produtosResponse = await fetch(`${GESTAOCLICK_BASE_URL}/produtos?pagina=${paginaAtual}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': access_token,
              'secret-access-token': secret_token,
            },
          });

          if (!produtosResponse.ok) {
            const errorText = await produtosResponse.text();
            console.error('[gestaoclick-proxy] produtos error:', errorText);
            return new Response(
              JSON.stringify({ error: `Erro ao buscar produtos: ${produtosResponse.status}` }),
              { status: produtosResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const produtosData = await produtosResponse.json();
          console.log(`[gestaoclick-proxy] produtos page ${paginaAtual}/${produtosData?.meta?.total_paginas || 1}, count: ${produtosData?.data?.length || 0}`);

          if (produtosData?.meta?.total_paginas) {
            totalPaginas = produtosData.meta.total_paginas;
          }

          const produtos = produtosData.data || [];
          todosProdutos.push(...produtos);

          paginaAtual++;
        } while (paginaAtual <= totalPaginas);

        console.log('[gestaoclick-proxy] total produtos fetched:', todosProdutos.length);

        return new Response(
          JSON.stringify({ 
            success: true, 
            produtos: todosProdutos.map((p: any) => {
              const produto = p.Produto || p;
              return {
                id: produto.id,
                nome: produto.nome,
                codigo: produto.codigo,
                preco: produto.preco_venda || produto.preco
              };
            })
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_lojas_gc': {
        // List ALL stores from GestaoClick
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] Buscando lojas...');

        const lojasResponse = await fetch(`${GESTAOCLICK_BASE_URL}/lojas`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!lojasResponse.ok) {
          const errorText = await lojasResponse.text();
          console.error('[gestaoclick-proxy] lojas error:', errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao buscar lojas: ${lojasResponse.status}` }),
            { status: lojasResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const lojasData = await lojasResponse.json();
        console.log('[gestaoclick-proxy] lojas response:', JSON.stringify(lojasData).substring(0, 500));

        const lojas = lojasData.data || [];

        return new Response(
          JSON.stringify({ 
            success: true, 
            lojas: Array.isArray(lojas) ? lojas.map((l: any) => {
              const loja = l.Loja || l;
              return {
                id: loja.id,
                nome: loja.nome || loja.fantasia,
                cnpj: loja.cnpj,
                ativo: loja.ativo
              };
            }) : []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_fornecedores_gc': {
        // List ALL suppliers from GestaoClick (used for NF-e emitter)
        const { access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] Buscando fornecedores...');

        const fornecedoresResponse = await fetch(`${GESTAOCLICK_BASE_URL}/fornecedores`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!fornecedoresResponse.ok) {
          const errorText = await fornecedoresResponse.text();
          console.error('[gestaoclick-proxy] fornecedores error:', errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao buscar fornecedores: ${fornecedoresResponse.status}` }),
            { status: fornecedoresResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const fornecedoresData = await fornecedoresResponse.json();
        console.log('[gestaoclick-proxy] fornecedores response:', JSON.stringify(fornecedoresData).substring(0, 500));

        const fornecedores = fornecedoresData.data || [];

        return new Response(
          JSON.stringify({ 
            success: true, 
            fornecedores: Array.isArray(fornecedores) ? fornecedores.map((f: any) => {
              const fornecedor = f.Fornecedor || f;
              return {
                id: fornecedor.id,
                nome: fornecedor.nome || fornecedor.razao_social || fornecedor.fantasia,
                cnpj_cpf: fornecedor.cnpj_cpf || fornecedor.cnpj
              };
            }) : []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'criar_venda': {
        const { agendamento_id, cliente_id } = params;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if agendamento already has a venda
        const { data: agendamentoExistente } = await supabase
          .from('agendamentos_clientes')
          .select('gestaoclick_venda_id')
          .eq('id', agendamento_id)
          .single();

        if (agendamentoExistente?.gestaoclick_venda_id) {
          return new Response(
            JSON.stringify({ 
              error: 'Este pedido já possui uma venda GestaoClick vinculada',
              venda_id: agendamentoExistente.gestaoclick_venda_id
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 1. Get GestaoClick config
        const { data: configData, error: configError } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        if (configError || !configData?.config) {
          console.error('[gestaoclick-proxy] Config not found:', configError);
          return new Response(
            JSON.stringify({ error: 'Configure as credenciais do GestaoClick em Configurações → Integrações' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as unknown as GestaoClickConfig;
        
        if (!config.access_token || !config.secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens do GestaoClick não configurados' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!config.situacao_id) {
          return new Response(
            JSON.stringify({ error: 'Situação de venda não configurada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Get client data
        const { data: cliente, error: clienteError } = await supabase
          .from('clientes')
          .select('gestaoclick_cliente_id, forma_pagamento, prazo_pagamento_dias, nome')
          .eq('id', cliente_id)
          .single();

        if (clienteError || !cliente) {
          console.error('[gestaoclick-proxy] Client not found:', clienteError);
          return new Response(
            JSON.stringify({ error: 'Cliente não encontrado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!cliente.gestaoclick_cliente_id) {
          return new Response(
            JSON.stringify({ error: `Cliente "${cliente.nome}" não possui ID GestaoClick configurado` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const clienteIdGCStr = String(cliente.gestaoclick_cliente_id).trim();
        const clienteIdGC = Number.parseInt(clienteIdGCStr, 10);

        if (!Number.isFinite(clienteIdGC)) {
          return new Response(
            JSON.stringify({ error: `ID GestaoClick inválido para o cliente "${cliente.nome}": "${clienteIdGCStr}"` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 3. Get order items using database function
        const { data: itens, error: itensError } = await supabase
          .rpc('compute_entrega_itens_v2', { p_agendamento_id: agendamento_id });

        if (itensError || !itens || itens.length === 0) {
          console.error('[gestaoclick-proxy] Items error:', itensError);
          return new Response(
            JSON.stringify({ error: 'Não foi possível calcular os itens do pedido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 4. Get products with GestaoClick IDs
        const produtoIds = itens.map((i: { produto_id: string }) => i.produto_id);
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos_finais')
          .select('id, nome, gestaoclick_produto_id, categoria_id')
          .in('id', produtoIds);

        if (produtosError) {
          console.error('[gestaoclick-proxy] Products error:', produtosError);
          return new Response(
            JSON.stringify({ error: 'Erro ao buscar produtos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 5. Get client custom prices
        const categoriaIds = [...new Set(produtos?.map(p => p.categoria_id).filter(Boolean))];
        const { data: precosCliente } = await supabase
          .from('precos_categoria_cliente')
          .select('categoria_id, preco_unitario')
          .eq('cliente_id', cliente_id)
          .in('categoria_id', categoriaIds as number[]);

        // 6. Get default category prices
        const { data: configSistema } = await supabase
          .from('configuracoes_sistema')
          .select('configuracoes')
          .eq('modulo', 'precificacao')
          .eq('user_id', userId)
          .maybeSingle();

        const precosDefault = (configSistema?.configuracoes as { precosPorCategoria?: Record<string, number> })?.precosPorCategoria || {};

        // 7. Build items with prices - using correct GestaoClick structure
        const produtosVenda: any[] = [];
        
        for (const item of itens) {
          const produto = produtos?.find(p => p.id === item.produto_id);
          if (!produto?.gestaoclick_produto_id) {
            return new Response(
              JSON.stringify({ error: `Produto "${produto?.nome || item.produto_id}" não possui ID GestaoClick` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Determine price: custom → default category → fallback
          let precoUnitario = 4.50;
          const categoriaId = produto.categoria_id;
          
          if (categoriaId) {
            const precoPersonalizado = precosCliente?.find(p => p.categoria_id === categoriaId);
            if (precoPersonalizado) {
              precoUnitario = precoPersonalizado.preco_unitario;
            } else if (precosDefault[categoriaId.toString()]) {
              precoUnitario = precosDefault[categoriaId.toString()];
            }
          }

          // GestaoClick expects nested structure: produtos: [{ produto: { ... } }]
          produtosVenda.push({
            produto: {
              produto_id: produto.gestaoclick_produto_id,
              quantidade: item.quantidade.toString(),
              valor_venda: precoUnitario.toFixed(2)
            }
          });
        }

        // 8. Determine payment method
        const formaPagamento = cliente.forma_pagamento || 'BOLETO';
        const formaPagamentoId = config.forma_pagamento_ids?.[formaPagamento as keyof typeof config.forma_pagamento_ids];
        
        if (!formaPagamentoId) {
          return new Response(
            JSON.stringify({ error: `Forma de pagamento "${formaPagamento}" não mapeada em Configurações → GestaoClick` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 9. Get next sequential code from GestaoClick
        const codigo = await getProximoCodigoVenda(config.access_token, config.secret_token);
        console.log(`[gestaoclick-proxy] Código da nova venda: ${codigo}`);
        const dataVenda = formatDate(new Date());
        
        // 10. Calculate data_vencimento based on payment method
        const dataVencimento = calcularDataVencimento(formaPagamento, cliente.prazo_pagamento_dias);
        console.log(`[gestaoclick-proxy] Payment: ${formaPagamento}, Prazo: ${cliente.prazo_pagamento_dias}, Data Vencimento: ${dataVencimento}`);

        // 11. Build sale payload according to GestaoClick API docs
        const vendaPayload: Record<string, any> = {
          tipo: 'produto',
          codigo: codigo,
          data: dataVenda,
          prazo_entrega: dataVenda,
          data_primeira_parcela: dataVencimento,
          cliente_id: clienteIdGC,
          situacao_id: config.situacao_id,
          forma_pagamento_id: formaPagamentoId,
          produtos: produtosVenda
        };

        // Add vendedor_id AND funcionario_id if configured (some APIs use one or the other)
        if (config.vendedor_id) {
          vendaPayload.vendedor_id = config.vendedor_id;
          vendaPayload.funcionario_id = config.vendedor_id;
        }

        console.log('[gestaoclick-proxy] Sending venda payload:', JSON.stringify(vendaPayload, null, 2));

        // 12. Create sale in GestaoClick with retry for duplicate codigo
        let vendaResponse;
        let vendaResponseText;
        let currentCodigo = codigo;
        let retryCount = 0;
        const maxRetries = 20;

        while (retryCount < maxRetries) {
          vendaPayload.codigo = currentCodigo;
          console.log(`[gestaoclick-proxy] Tentativa ${retryCount + 1}: criando venda com código ${currentCodigo}`);

          vendaResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access-token': config.access_token,
              'secret-access-token': config.secret_token,
            },
            body: JSON.stringify(vendaPayload),
          });

          vendaResponseText = await vendaResponse.text();
          console.log('[gestaoclick-proxy] Venda response:', vendaResponse.status, vendaResponseText);

          // Check if error is duplicate codigo (handle Unicode escapes in response)
          const isDuplicateCode = vendaResponseText.includes('sendo utilizado') || 
                                  vendaResponseText.includes('already in use') ||
                                  vendaResponseText.includes('j\\u00e1 est\\u00e1 sendo');
          if (isDuplicateCode) {
            currentCodigo++;
            retryCount++;
            console.log(`[gestaoclick-proxy] Código duplicado, tentando próximo: ${currentCodigo}`);
            continue;
          }

          // If not duplicate error, break the loop
          break;
        }

        if (!vendaResponse!.ok) {
          let errorMessage = `Erro ${vendaResponse!.status}`;
          try {
            const errorData = JSON.parse(vendaResponseText!);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = vendaResponseText || errorMessage;
          }

          // Mensagem específica para código duplicado após esgotar tentativas
          if (errorMessage.includes('sendo utilizado') || errorMessage.includes('j\u00e1 est\u00e1 sendo')) {
            errorMessage = `Não foi possível gerar a venda: todos os códigos sequenciais de ${codigo} até ${currentCodigo} já estão em uso no GestaoClick. Tente novamente em alguns segundos.`;
          }

          if (errorMessage.includes('cliente_id informado')) {
            errorMessage = `ID GestaoClick do cliente inválido ("${clienteIdGCStr}") para "${cliente.nome}". Confirme o ID GC no cadastro do cliente no GestaoClick e atualize no Lovable.`;
          }

          return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: vendaResponse!.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let vendaCriada;
        try {
          vendaCriada = JSON.parse(vendaResponseText!);
        } catch {
          vendaCriada = { venda_id: currentCodigo };
        }

        const vendaId = vendaCriada.data?.venda_id || vendaCriada.venda_id || vendaCriada.id || currentCodigo;
        console.log('[gestaoclick-proxy] Venda created with ID:', vendaId);

        // 13. Update agendamento with sale ID
        const { error: updateError } = await supabase
          .from('agendamentos_clientes')
          .update({
            gestaoclick_venda_id: vendaId.toString(),
            gestaoclick_sincronizado_em: new Date().toISOString()
          })
          .eq('id', agendamento_id);

        if (updateError) {
          console.error('[gestaoclick-proxy] Failed to update agendamento:', updateError);
          // Don't fail the whole operation, just log
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            venda_id: vendaId,
            codigo: codigo
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'atualizar_venda': {
        // UPDATE SALE: DELETE existing + POST new (because PUT doesn't work reliably)
        const { agendamento_id, cliente_id, venda_id } = params;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!venda_id) {
          return new Response(
            JSON.stringify({ error: 'ID da venda não fornecido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get config
        const { data: configData } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        if (!configData?.config) {
          return new Response(
            JSON.stringify({ error: 'Configure as credenciais do GestaoClick' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as unknown as GestaoClickConfig;

        // Verificar se temos a configuração de status "Cancelado"
        if (!config.situacao_cancelado_id) {
          return new Response(
            JSON.stringify({ error: 'Configure a situação "Cancelado" em Configurações → Integrações → GestaoClick' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 1. Alterar status da venda para "Cancelado" para permitir exclusão
        console.log('[gestaoclick-proxy] Alterando status da venda para Cancelado:', venda_id, '→', config.situacao_cancelado_id);
        const putStatusResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas/${venda_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
          body: JSON.stringify({ situacao_id: config.situacao_cancelado_id }),
        });

        const putStatusText = await putStatusResponse.text();
        console.log('[gestaoclick-proxy] PUT status cancelado response:', putStatusResponse.status, putStatusText.substring(0, 500));

        // Se falhou ao mudar status, a venda pode não existir ou não ser acessível
        if (hasGCError(putStatusText, putStatusResponse.status)) {
          console.log('[gestaoclick-proxy] Não foi possível alterar status, venda inacessível. Limpando vínculo.');
          await supabase
            .from('agendamentos_clientes')
            .update({ gestaoclick_venda_id: null, gestaoclick_sincronizado_em: null })
            .eq('id', agendamento_id);

          return new Response(
            JSON.stringify({ 
              success: false, 
              vendaExcluida: true, 
              error: 'Venda não encontrada ou sem permissão no GestaoClick. Vínculo removido - você pode gerar uma nova venda.' 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Agora sim, DELETE a venda (que está em status "cancelado")
        console.log('[gestaoclick-proxy] Deletando venda em status cancelado:', venda_id);
        const deleteResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas/${venda_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
        });

        const deleteText = await deleteResponse.text();
        console.log('[gestaoclick-proxy] DELETE response:', deleteResponse.status, deleteText.substring(0, 500));

        // Mesmo se DELETE falhar com erro, continuamos para criar nova venda
        // (a venda antiga já está cancelada)
        if (hasGCError(deleteText, deleteResponse.status)) {
          console.warn('[gestaoclick-proxy] Aviso: DELETE retornou erro, mas venda já está cancelada. Continuando...', deleteText.substring(0, 200));
        }

        // 3. Get client data
        const { data: cliente } = await supabase
          .from('clientes')
          .select('gestaoclick_cliente_id, forma_pagamento, prazo_pagamento_dias, nome, representante_id')
          .eq('id', cliente_id)
          .single();

        if (!cliente?.gestaoclick_cliente_id) {
          return new Response(
            JSON.stringify({ error: 'Cliente não possui ID GestaoClick' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const clienteIdGC = parseInt(String(cliente.gestaoclick_cliente_id).trim(), 10);

        // 4. Get order items
        const { data: itens } = await supabase
          .rpc('compute_entrega_itens_v2', { p_agendamento_id: agendamento_id });

        if (!itens || itens.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Não foi possível calcular os itens do pedido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 5. Get products with GestaoClick IDs
        const produtoIds = itens.map((i: { produto_id: string }) => i.produto_id);
        const { data: produtos } = await supabase
          .from('produtos_finais')
          .select('id, nome, gestaoclick_produto_id, categoria_id')
          .in('id', produtoIds);

        // 6. Get prices
        const categoriaIds = [...new Set(produtos?.map(p => p.categoria_id).filter(Boolean))];
        const { data: precosCliente } = await supabase
          .from('precos_categoria_cliente')
          .select('categoria_id, preco_unitario')
          .eq('cliente_id', cliente_id)
          .in('categoria_id', categoriaIds as number[]);

        const { data: configSistema } = await supabase
          .from('configuracoes_sistema')
          .select('configuracoes')
          .eq('modulo', 'precificacao')
          .eq('user_id', userId)
          .maybeSingle();

        const precosDefault = (configSistema?.configuracoes as { precosPorCategoria?: Record<string, number> })?.precosPorCategoria || {};

        // 7. Build products array
        const produtosVenda: any[] = [];
        for (const item of itens) {
          const produto = produtos?.find(p => p.id === item.produto_id);
          if (!produto?.gestaoclick_produto_id) {
            return new Response(
              JSON.stringify({ error: `Produto "${produto?.nome || item.produto_id}" não possui ID GestaoClick` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          let precoUnitario = 4.50;
          const categoriaId = produto.categoria_id;
          if (categoriaId) {
            const precoPersonalizado = precosCliente?.find(p => p.categoria_id === categoriaId);
            if (precoPersonalizado) {
              precoUnitario = precoPersonalizado.preco_unitario;
            } else if (precosDefault[categoriaId.toString()]) {
              precoUnitario = precosDefault[categoriaId.toString()];
            }
          }

          produtosVenda.push({
            produto: {
              produto_id: produto.gestaoclick_produto_id,
              quantidade: item.quantidade.toString(),
              valor_venda: precoUnitario.toFixed(2)
            }
          });
        }

        // 8. Determine payment method
        const formaPagamento = cliente.forma_pagamento || 'BOLETO';
        const formaPagamentoId = config.forma_pagamento_ids?.[formaPagamento as keyof typeof config.forma_pagamento_ids];
        
        if (!formaPagamentoId) {
          return new Response(
            JSON.stringify({ error: `Forma de pagamento "${formaPagamento}" não mapeada` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 9. Get vendedor_id from representante if mapped
        let vendedorId = config.vendedor_id;
        if (cliente.representante_id) {
          const { data: representante } = await supabase
            .from('representantes')
            .select('gestaoclick_funcionario_id')
            .eq('id', cliente.representante_id)
            .single();
          
          if (representante?.gestaoclick_funcionario_id) {
            vendedorId = representante.gestaoclick_funcionario_id;
          }
        }

        // 10. Get next sequential code
        const novoCodigo = await getProximoCodigoVenda(config.access_token, config.secret_token);
        const dataVenda = formatDate(new Date());
        const dataVencimento = calcularDataVencimento(formaPagamento, cliente.prazo_pagamento_dias);

        // 11. Build new sale payload
        const vendaPayload: Record<string, any> = {
          tipo: 'produto',
          codigo: novoCodigo,
          data: dataVenda,
          prazo_entrega: dataVenda,
          data_primeira_parcela: dataVencimento,
          cliente_id: clienteIdGC,
          situacao_id: config.situacao_id,
          forma_pagamento_id: formaPagamentoId,
          produtos: produtosVenda
        };

        if (vendedorId) {
          vendaPayload.vendedor_id = vendedorId;
          vendaPayload.funcionario_id = vendedorId;
        }

        console.log('[gestaoclick-proxy] Criando nova venda:', JSON.stringify(vendaPayload, null, 2));

        // 12. POST new sale with retry for duplicate codigo
        let vendaResponse;
        let vendaResponseText;
        let currentCodigo = novoCodigo;
        let retryCount = 0;
        const maxRetries = 20;

        while (retryCount < maxRetries) {
          vendaPayload.codigo = currentCodigo;
          console.log(`[gestaoclick-proxy] Tentativa ${retryCount + 1}: criando venda com código ${currentCodigo}`);

          vendaResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access-token': config.access_token,
              'secret-access-token': config.secret_token,
            },
            body: JSON.stringify(vendaPayload),
          });

          vendaResponseText = await vendaResponse.text();
          console.log('[gestaoclick-proxy] POST nova venda response:', vendaResponse.status, vendaResponseText.substring(0, 500));

          // Check if error is duplicate codigo (handle Unicode escapes in response)
          const isDuplicateCode = vendaResponseText.includes('sendo utilizado') || 
                                  vendaResponseText.includes('already in use') ||
                                  vendaResponseText.includes('j\\u00e1 est\\u00e1 sendo');
          if (isDuplicateCode) {
            currentCodigo++;
            retryCount++;
            console.log(`[gestaoclick-proxy] Código duplicado, tentando próximo: ${currentCodigo}`);
            continue;
          }

          // If not duplicate error, break the loop
          break;
        }

        if (hasGCError(vendaResponseText!, vendaResponse!.status)) {
          return new Response(
            JSON.stringify({ error: 'Erro ao criar nova venda no GestaoClick: ' + vendaResponseText!.substring(0, 200) }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let vendaCriada;
        try {
          vendaCriada = JSON.parse(vendaResponseText!);
        } catch {
          vendaCriada = { venda_id: currentCodigo };
        }

        const novoVendaId = vendaCriada.data?.venda_id || vendaCriada.venda_id || vendaCriada.id || currentCodigo;
        console.log('[gestaoclick-proxy] Nova venda criada com ID:', novoVendaId);

        // 13. Update agendamento with new sale ID
        await supabase
          .from('agendamentos_clientes')
          .update({
            gestaoclick_venda_id: novoVendaId.toString(),
            gestaoclick_sincronizado_em: new Date().toISOString()
          })
          .eq('id', agendamento_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            venda_id: novoVendaId,
            codigo: novoCodigo,
            venda_anterior_excluida: venda_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'criar_nf': {
        // CREATE NF (Nota Fiscal) in GestaoClick
        // FLOW: 1) Resolve internal venda_id, 2) Create draft NF, 3) Validate values, 4) Correct if needed, 5) Emit
        const { agendamento_id, cliente_id } = params;

        console.log(`[gestaoclick-proxy] === CRIAR NF === agendamento_id=${agendamento_id}, cliente_id=${cliente_id}`);

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if agendamento already has an NF
        const { data: agendamentoCheck } = await supabase
          .from('agendamentos_clientes')
          .select('gestaoclick_nf_id, gestaoclick_venda_id')
          .eq('id', agendamento_id)
          .single();

        if (agendamentoCheck?.gestaoclick_nf_id) {
          return new Response(
            JSON.stringify({ 
              error: 'Este pedido já possui uma NF vinculada',
              nf_id: agendamentoCheck.gestaoclick_nf_id
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get GestaoClick config
        const { data: configData } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        if (!configData?.config) {
          return new Response(
            JSON.stringify({ error: 'Configure as credenciais do GestaoClick em Configurações → Integrações' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as unknown as GestaoClickConfig & { loja_id?: string };
        
        if (!config.access_token || !config.secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens do GestaoClick não configurados' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!config.loja_id) {
          return new Response(
            JSON.stringify({ error: 'Loja para NF-e não configurada em Configurações → GestaoClick' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get client data
        const { data: cliente, error: clienteError } = await supabase
          .from('clientes')
          .select('gestaoclick_cliente_id, forma_pagamento, prazo_pagamento_dias, nome')
          .eq('id', cliente_id)
          .single();

        if (clienteError || !cliente) {
          return new Response(
            JSON.stringify({ error: 'Cliente não encontrado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!cliente.gestaoclick_cliente_id) {
          return new Response(
            JSON.stringify({ error: `Cliente "${cliente.nome}" não possui ID GestaoClick configurado` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[gestaoclick-proxy] Cliente: ${cliente.nome}, GC_ID: ${cliente.gestaoclick_cliente_id}`);

        // ========== STEP 1: Resolve internal venda_id from codigo ==========
        let vendaInternalId: number | null = null;
        const vendaCodigo = agendamentoCheck?.gestaoclick_venda_id;
        
        if (vendaCodigo) {
          console.log(`[gestaoclick-proxy] Buscando ID interno da venda com codigo=${vendaCodigo}`);
          try {
            const vendaSearchResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?codigo=${vendaCodigo}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'access-token': config.access_token,
                'secret-access-token': config.secret_token,
              },
            });
            
            const vendaSearchText = await vendaSearchResponse.text();
            console.log(`[gestaoclick-proxy] Venda search response: ${vendaSearchResponse.status} ${vendaSearchText.substring(0, 300)}`);
            
            const vendaSearchData = JSON.parse(vendaSearchText);
            if (vendaSearchData.code === 200 && vendaSearchData.data && Array.isArray(vendaSearchData.data) && vendaSearchData.data.length > 0) {
              vendaInternalId = parseInt(vendaSearchData.data[0].id, 10);
              console.log(`[gestaoclick-proxy] Venda codigo=${vendaCodigo} → ID interno=${vendaInternalId}`);
            } else {
              console.warn(`[gestaoclick-proxy] Venda com codigo=${vendaCodigo} não encontrada no GC`);
            }
          } catch (err) {
            console.error(`[gestaoclick-proxy] Erro ao buscar venda por codigo:`, err);
          }
        }

        // Get order items using database function
        const { data: itens, error: itensError } = await supabase
          .rpc('compute_entrega_itens_v2', { p_agendamento_id: agendamento_id });

        if (itensError || !itens || itens.length === 0) {
          console.error('[gestaoclick-proxy] NF Items error:', itensError);
          return new Response(
            JSON.stringify({ error: 'Não foi possível calcular os itens do pedido para NF' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get products with GestaoClick IDs
        const produtoIds = itens.map((i: { produto_id: string }) => i.produto_id);
        const { data: produtos } = await supabase
          .from('produtos_finais')
          .select('id, nome, gestaoclick_produto_id, categoria_id')
          .in('id', produtoIds);

        // Get client custom prices
        const categoriaIds = [...new Set(produtos?.map(p => p.categoria_id).filter(Boolean))];
        const { data: precosCliente } = await supabase
          .from('precos_categoria_cliente')
          .select('categoria_id, preco_unitario')
          .eq('cliente_id', cliente_id)
          .in('categoria_id', categoriaIds as number[]);

        // Get default category prices
        const { data: configSistema } = await supabase
          .from('configuracoes_sistema')
          .select('configuracoes')
          .eq('modulo', 'precificacao')
          .eq('user_id', userId)
          .maybeSingle();

        const precosDefault = (configSistema?.configuracoes as { precosPorCategoria?: Record<string, number> })?.precosPorCategoria || {};

        // Build products array for NF with detailed logging
        // IMPORTANTE: Usar formato ANINHADO igual ao de vendas para que o GestaoClick aceite os preços
        const produtosNF: any[] = [];
        let valorTotal = 0;
        
        console.log(`[gestaoclick-proxy] Calculando produtos para NF (${itens.length} itens):`);
        
        for (const item of itens) {
          const produto = produtos?.find(p => p.id === item.produto_id);
          if (!produto?.gestaoclick_produto_id) {
            return new Response(
              JSON.stringify({ error: `Produto "${produto?.nome || item.produto_id}" não possui ID GestaoClick` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Determine price: custom → default category → fallback
          let precoUnitario = 4.50;
          const categoriaId = produto.categoria_id;
          let precoOrigem = 'fallback';
          
          if (categoriaId) {
            const precoPersonalizado = precosCliente?.find(p => p.categoria_id === categoriaId);
            if (precoPersonalizado) {
              precoUnitario = precoPersonalizado.preco_unitario;
              precoOrigem = 'cliente_personalizado';
            } else if (precosDefault[categoriaId.toString()]) {
              precoUnitario = precosDefault[categoriaId.toString()];
              precoOrigem = 'categoria_padrao';
            }
          }

          const subtotal = item.quantidade * precoUnitario;
          valorTotal += subtotal;

          console.log(`[gestaoclick-proxy]   - ${produto.nome}: qtd=${item.quantidade}, preco=${precoUnitario.toFixed(2)} (${precoOrigem}), subtotal=${subtotal.toFixed(2)}`);

          // Formato PLANO para NF - produto_id como INT, quantidade e valor_venda como números
          produtosNF.push({
            produto_id: parseInt(produto.gestaoclick_produto_id, 10),
            quantidade: Math.round(item.quantidade),
            valor_venda: Math.round(precoUnitario * 100) / 100
          });
        }

        console.log(`[gestaoclick-proxy] Valor total calculado: R$ ${valorTotal.toFixed(2)}`);

        // Determine payment method and due date
        const formaPagamento = cliente.forma_pagamento || 'BOLETO';
        const formaPagamentoId = config.forma_pagamento_ids?.[formaPagamento as keyof typeof config.forma_pagamento_ids];
        
        if (!formaPagamentoId) {
          return new Response(
            JSON.stringify({ error: `Forma de pagamento "${formaPagamento}" não mapeada em Configurações → GestaoClick` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const dataVencimento = calcularDataVencimento(formaPagamento, cliente.prazo_pagamento_dias);
        
        // Helper to format date as DD/MM/YYYY for GestaoClick
        const formatDateBR = (dateStr: string): string => {
          const [year, month, day] = dateStr.split('-');
          return `${day}/${month}/${year}`;
        };

        const hoje = formatDate(new Date());
        const hojeBR = formatDateBR(hoje);

        // ========== STEP 2: Create NF as DRAFT (envio_automatico: 0) ==========
        // Build NF payload - para NF de SAÍDA (venda)
        const nfPayload: Record<string, any> = {
          tipo_nf: 1,           // 1 = NF de SAÍDA (venda)
          loja_id: parseInt(config.loja_id, 10),
          envio_automatico: 0,  // Create as DRAFT first, we will emit after validation
          indicador_final: 0,   // Não é consumidor final (revenda B2B)
          id_destinatario: parseInt(cliente.gestaoclick_cliente_id, 10),
          data_emissao: hojeBR,
          data_entrada_saida: hojeBR,
          produtos: produtosNF,
          pagamento: [{
            forma_pagamento_id: parseInt(formaPagamentoId, 10),
            valor_pagamento: Math.round(valorTotal * 100) / 100,
            data_vencimento: formatDateBR(dataVencimento)
          }]
        };

        // Link to sale order using INTERNAL ID (not codigo)
        if (vendaInternalId) {
          nfPayload.pedido_id = vendaInternalId;
          console.log(`[gestaoclick-proxy] Vinculando NF à venda interna ID=${vendaInternalId}`);
        } else {
          console.log(`[gestaoclick-proxy] NF será criada sem vínculo com venda`);
        }

        console.log('[gestaoclick-proxy] Creating NF DRAFT with payload:', JSON.stringify(nfPayload, null, 2));

        // Create NF in GestaoClick (as draft)
        const nfResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais_produtos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
          body: JSON.stringify(nfPayload),
        });

        const nfResponseText = await nfResponse.text();
        console.log('[gestaoclick-proxy] NF draft response:', nfResponse.status, nfResponseText);

        if (!nfResponse.ok || hasGCError(nfResponseText, nfResponse.status)) {
          let errorMessage = `Erro ao criar NF: ${nfResponse.status}`;
          try {
            const errorData = JSON.parse(nfResponseText);
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
          } catch {
            errorMessage = nfResponseText || errorMessage;
          }
          
          return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: nfResponse.status >= 400 ? nfResponse.status : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let nfCriada;
        try {
          nfCriada = JSON.parse(nfResponseText);
        } catch {
          nfCriada = {};
        }

        const nfId = nfCriada.data?.dados || nfCriada.data?.nota_fiscal_id || nfCriada.nota_fiscal_id || nfCriada.id || nfCriada.data?.id;
        
        if (!nfId) {
          console.error('[gestaoclick-proxy] NF created but no ID returned:', nfCriada);
          return new Response(
            JSON.stringify({ error: 'NF criada mas ID não retornado pelo GestaoClick' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] NF DRAFT created with ID:', nfId);

        // ========== STEP 3: Validate NF values by fetching the created NF ==========
        let nfValida = false;
        let tentativasValidacao = 0;
        const maxTentativasValidacao = 2;

        while (!nfValida && tentativasValidacao < maxTentativasValidacao) {
          tentativasValidacao++;
          console.log(`[gestaoclick-proxy] Validando NF (tentativa ${tentativasValidacao})...`);

          // Wait a bit for GestaoClick to process
          await new Promise(resolve => setTimeout(resolve, 500));

          try {
            const nfGetResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais_produtos/${nfId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'access-token': config.access_token,
                'secret-access-token': config.secret_token,
              },
            });

            const nfGetText = await nfGetResponse.text();
            console.log(`[gestaoclick-proxy] NF GET response: ${nfGetResponse.status} ${nfGetText.substring(0, 500)}`);

            const nfGetData = JSON.parse(nfGetText);
            
            if (nfGetData.code === 200 && nfGetData.data) {
              const valorTotalNF = parseFloat(nfGetData.data.valor_total_nf || nfGetData.data.valor_total || '0');
              console.log(`[gestaoclick-proxy] NF valor_total no GC: R$ ${valorTotalNF.toFixed(2)}, esperado: R$ ${valorTotal.toFixed(2)}`);

              // Check if value is correct (within 0.01 tolerance for rounding)
              if (Math.abs(valorTotalNF - valorTotal) < 0.02) {
                nfValida = true;
                console.log('[gestaoclick-proxy] NF valores OK!');
              } else if (valorTotalNF === 0 || valorTotalNF < valorTotal * 0.9) {
                // ========== STEP 4: Correct via PUT if values are wrong ==========
                console.log('[gestaoclick-proxy] NF com valores incorretos, tentando corrigir via PUT...');

                // PUT também usa formato aninhado para consistência
                const nfUpdatePayload: Record<string, any> = {
                  tipo_nf: 1,
                  loja_id: parseInt(config.loja_id, 10),
                  id_destinatario: parseInt(cliente.gestaoclick_cliente_id, 10),
                  data_emissao: hojeBR,
                  data_entrada_saida: hojeBR,
                  produtos: produtosNF,
                  pagamento: [{
                    forma_pagamento_id: parseInt(formaPagamentoId, 10),
                    valor_pagamento: Math.round(valorTotal * 100) / 100,
                    data_vencimento: formatDateBR(dataVencimento)
                  }]
                };

                if (vendaInternalId) {
                  nfUpdatePayload.pedido_id = vendaInternalId;
                }

                console.log('[gestaoclick-proxy] PUT NF payload:', JSON.stringify(nfUpdatePayload, null, 2));

                const nfPutResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais_produtos/${nfId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'access-token': config.access_token,
                    'secret-access-token': config.secret_token,
                  },
                  body: JSON.stringify(nfUpdatePayload),
                });

                const nfPutText = await nfPutResponse.text();
                console.log(`[gestaoclick-proxy] NF PUT response: ${nfPutResponse.status} ${nfPutText.substring(0, 300)}`);

                if (nfPutResponse.ok && !hasGCError(nfPutText, nfPutResponse.status)) {
                  // Continue loop to re-validate
                  console.log('[gestaoclick-proxy] PUT executado, re-validando...');
                } else {
                  console.error('[gestaoclick-proxy] Erro ao corrigir NF via PUT:', nfPutText);
                  // Try to continue anyway
                }
              } else {
                // Value is non-zero but different - might be acceptable
                console.log('[gestaoclick-proxy] NF valor diferente mas não zerado, prosseguindo...');
                nfValida = true;
              }
            }
          } catch (err) {
            console.error('[gestaoclick-proxy] Erro ao validar NF:', err);
          }
        }

        // ========== STEP 5: Save NF as draft (em_aberto) - DO NOT EMIT ==========
        // Update agendamento with NF ID and status
        const { error: updateError } = await supabase
          .from('agendamentos_clientes')
          .update({
            gestaoclick_nf_id: nfId.toString(),
            gestaoclick_nf_status: 'em_aberto'
          })
          .eq('id', agendamento_id);

        if (updateError) {
          console.error('[gestaoclick-proxy] Failed to update agendamento with NF ID:', updateError);
        }

        console.log(`[gestaoclick-proxy] NF ${nfId} criada como rascunho (em_aberto)`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            nf_id: nfId,
            status: 'em_aberto',
            valor_total: valorTotal,
            nf_valida: nfValida
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'emitir_nf': {
        // EMIT an existing NF (second step)
        const { nf_id, agendamento_id } = params as { nf_id: string; agendamento_id: string };

        if (!nf_id) {
          return new Response(
            JSON.stringify({ error: 'nf_id não fornecido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's GestaoClick config
        const { data: configData, error: configError } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .single();

        if (configError || !configData) {
          return new Response(
            JSON.stringify({ error: 'Configuração GestaoClick não encontrada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as GestaoClickConfig;

        console.log(`[gestaoclick-proxy] Emitindo NF ID=${nf_id}...`);

        // FASE 1: Sempre tentar emitir, não bloquear por pré-check inconsistente
        // O pré-check é apenas informativo - se falhar, tentamos emitir mesmo assim
        let valorTotalGC = 0;
        let checkFailed = false;
        let checkErrorReason = '';
        
        try {
          const nfCheckResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais_produtos/${nf_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': config.access_token,
              'secret-access-token': config.secret_token,
            },
          });
          const nfCheckText = await nfCheckResponse.text();
          console.log(`[gestaoclick-proxy] NF pré-check: status=${nfCheckResponse.status} body=${nfCheckText.substring(0, 500)}`);
          
          // Usar hasGCError para detectar erros lógicos (ex: "ok":false, "não possui permissão")
          if (hasGCError(nfCheckText, nfCheckResponse.status)) {
            checkFailed = true;
            try {
              const errorData = JSON.parse(nfCheckText);
              checkErrorReason = errorData.data?.mensagem || errorData.mensagem || errorData.message || 'Erro no pré-check';
            } catch {
              checkErrorReason = nfCheckText.substring(0, 200);
            }
            console.warn(`[gestaoclick-proxy] Pré-check falhou (${checkErrorReason}), tentando emitir mesmo assim...`);
          } else if (nfCheckResponse.ok) {
            try {
              const nfCheckData = JSON.parse(nfCheckText);
              if (nfCheckData.code === 200 && nfCheckData.data) {
                valorTotalGC = parseFloat(nfCheckData.data.valor_total_nf || nfCheckData.data.valor_total || nfCheckData.data.vNF || '0');
                console.log(`[gestaoclick-proxy] Valor total confirmado no GC: R$ ${valorTotalGC.toFixed(2)}`);
              } else {
                checkFailed = true;
                checkErrorReason = 'Resposta sem dados válidos';
                console.warn('[gestaoclick-proxy] Resposta NF sem data válida, tentando emitir mesmo assim');
              }
            } catch (parseErr) {
              checkFailed = true;
              checkErrorReason = 'Erro ao parsear resposta';
              console.warn('[gestaoclick-proxy] Erro ao parsear resposta do pré-check');
            }
          } else {
            checkFailed = true;
            checkErrorReason = `HTTP ${nfCheckResponse.status}`;
            console.warn(`[gestaoclick-proxy] Falha HTTP no pré-check (${nfCheckResponse.status}), tentando emitir mesmo assim`);
          }
        } catch (err) {
          checkFailed = true;
          checkErrorReason = err instanceof Error ? err.message : 'Erro desconhecido';
          console.error('[gestaoclick-proxy] Exceção no pré-check:', err);
        }

        // IMPORTANTE: Só bloquear por TOTAL_ZERADO se o check foi bem-sucedido E valor é realmente 0
        // Se o check falhou (por permissão, erro de rede, etc), tentamos emitir mesmo assim
        if (!checkFailed && valorTotalGC < 0.01) {
          console.warn(`[gestaoclick-proxy] NF ${nf_id} com valor zerado CONFIRMADO (pré-check OK), não será emitida`);
          return new Response(
            JSON.stringify({ 
              success: true,
              emitida: false,
              motivo_nao_emitida: 'TOTAL_ZERADO',
              valor_total_gc: valorTotalGC,
              warning: `NF com valor R$ 0,00 no GestaoClick. Verifique a configuração de produtos/preços.`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log se estamos tentando emitir apesar de check ter falhado
        if (checkFailed) {
          console.log(`[gestaoclick-proxy] Pré-check falhou (${checkErrorReason}), mas vamos tentar emitir NF ${nf_id} mesmo assim...`);
        }

        // Emit the NF
        const emitirResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais_produtos/emitir/${nf_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
        });

        const emitirText = await emitirResponse.text();
        console.log(`[gestaoclick-proxy] Emitir NF response: ${emitirResponse.status} ${emitirText}`);

        if (!emitirResponse.ok || hasGCError(emitirText, emitirResponse.status)) {
          let errorMessage = `Erro ao emitir NF: ${emitirResponse.status}`;
          try {
            const errorData = JSON.parse(emitirText);
            errorMessage = errorData.data?.mensagem || errorData.message || errorData.error || errorData.errors?.[0] || JSON.stringify(errorData);
          } catch {
            errorMessage = emitirText || errorMessage;
          }
          
          console.warn(`[gestaoclick-proxy] NF ${nf_id} não emitida: ${errorMessage}`);
          
          return new Response(
            JSON.stringify({ 
              success: true,
              emitida: false,
              motivo_nao_emitida: 'ERRO_EMISSAO',
              erro_emissao: errorMessage,
              valor_total_gc: valorTotalGC,
              warning: `Erro ao emitir: ${errorMessage}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[gestaoclick-proxy] NF ${nf_id} emitida com sucesso!`);

        // Update agendamento status to 'emitida'
        if (agendamento_id) {
          const { error: updateError } = await supabase
            .from('agendamentos_clientes')
            .update({ gestaoclick_nf_status: 'emitida' })
            .eq('id', agendamento_id);

          if (updateError) {
            console.error('[gestaoclick-proxy] Failed to update agendamento NF status:', updateError);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            emitida: true,
            valor_total_gc: valorTotalGC
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sincronizar_status': {
        // Verify which sales and NFs still exist in GestaoClick
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's GestaoClick config
        const { data: configData, error: configError } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .single();

        if (configError || !configData) {
          return new Response(
            JSON.stringify({ error: 'Configuração GestaoClick não encontrada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as GestaoClickConfig;
        const { agendamentos } = params as { agendamentos: Array<{ id: string; gestaoclick_venda_id: string; gestaoclick_nf_id?: string }> };

        if (!agendamentos || agendamentos.length === 0) {
          return new Response(
            JSON.stringify({ success: true, vendasExcluidas: [], nfsExcluidas: [] }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const vendasExcluidas: string[] = [];
        const nfsExcluidas: string[] = [];

        // Check each venda
        for (const ag of agendamentos) {
          // Check if venda exists by searching with codigo filter
          if (ag.gestaoclick_venda_id) {
            try {
              // Use codigo filter since gestaoclick_venda_id stores the codigo, not the internal ID
              const vendaResponse = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?codigo=${ag.gestaoclick_venda_id}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'access-token': config.access_token,
                  'secret-access-token': config.secret_token,
                },
              });

              const vendaText = await vendaResponse.text();
              let vendaExists = false;
              
              try {
                const vendaData = JSON.parse(vendaText);
                // Check if the response has valid data array with at least one result
                if (vendaData.code === 200 && vendaData.data && Array.isArray(vendaData.data) && vendaData.data.length > 0) {
                  vendaExists = true;
                }
              } catch {
                // Parse error means invalid response
              }
              
              // If venda doesn't exist
              if (!vendaExists) {
                console.log(`[gestaoclick-proxy] Venda ${ag.gestaoclick_venda_id} não existe mais no GC`);
                vendasExcluidas.push(ag.id);
                
                // Clear the venda_id from database
                await supabase
                  .from('agendamentos_clientes')
                  .update({ 
                    gestaoclick_venda_id: null,
                    gestaoclick_sincronizado_em: null
                  })
                  .eq('id', ag.id);
              }
            } catch (error) {
              console.error(`[gestaoclick-proxy] Error checking venda ${ag.gestaoclick_venda_id}:`, error);
            }
          }

          // Check if NF exists (only if venda still exists)
          if (ag.gestaoclick_nf_id && !vendasExcluidas.includes(ag.id)) {
            try {
              const nfResponse = await fetch(`${GESTAOCLICK_BASE_URL}/notas_fiscais/${ag.gestaoclick_nf_id}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'access-token': config.access_token,
                  'secret-access-token': config.secret_token,
                },
              });

              const nfText = await nfResponse.text();
              let nfExists = false;
              
              try {
                const nfData = JSON.parse(nfText);
                // Check if the response has valid data with an id
                if (nfData.code === 200 && nfData.data && nfData.data.id) {
                  nfExists = true;
                }
              } catch {
                // Parse error means invalid response
              }
              
              // If NF doesn't exist
              if (!nfExists) {
                console.log(`[gestaoclick-proxy] NF ${ag.gestaoclick_nf_id} não existe mais no GC`);
                nfsExcluidas.push(ag.id);
                
                // Clear the nf_id from database
                await supabase
                  .from('agendamentos_clientes')
                  .update({ gestaoclick_nf_id: null })
                  .eq('id', ag.id);
              }
            } catch (error) {
              console.error(`[gestaoclick-proxy] Error checking NF ${ag.gestaoclick_nf_id}:`, error);
            }
          } else if (ag.gestaoclick_nf_id && vendasExcluidas.includes(ag.id)) {
            // If venda was deleted, NF is also invalid
            nfsExcluidas.push(ag.id);
            await supabase
              .from('agendamentos_clientes')
              .update({ gestaoclick_nf_id: null })
              .eq('id', ag.id);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            vendasExcluidas,
            nfsExcluidas
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'criar_cliente_gc': {
        // Create client in GestaoClick when creating in Lovable
        const { 
          nome, 
          tipo_pessoa,
          cnpj_cpf, 
          inscricao_estadual,
          endereco, 
          contato_nome, 
          contato_telefone, 
          contato_email, 
          observacoes,
          cidade_nome,
          estado
        } = params;
        
        console.log('[gestaoclick-proxy] Criando cliente no GC:', { nome, tipo_pessoa, cnpj_cpf, inscricao_estadual });
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch GestaoClick config
        const { data: configData } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        if (!configData?.config) {
          return new Response(
            JSON.stringify({ error: 'GestaoClick não configurado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as GestaoClickConfig;

        // Use tipo_pessoa from params, or determine from document length
        const docLimpo = (cnpj_cpf || '').replace(/\D/g, '');
        const tipoPessoa = tipo_pessoa || (docLimpo.length > 11 ? 'PJ' : 'PF');
        
        // Build request body for GestaoClick
        const clienteGcBody: any = {
          tipo_pessoa: tipoPessoa,
          nome: nome || '',
          ativo: '1',
        };

        // Add document based on type
        if (tipoPessoa === 'PJ') {
          clienteGcBody.cnpj = cnpj_cpf || '';
          // NÃO enviar razao_social - fluxo unidirecional GC → Lovable
          // Add inscricao_estadual (IE) for PJ
          if (inscricao_estadual) {
            clienteGcBody.ie = inscricao_estadual;
          }
        } else {
          clienteGcBody.cpf = cnpj_cpf || '';
        }

        // Add contact info
        if (contato_telefone) {
          clienteGcBody.celular = contato_telefone;
        }
        if (contato_email) {
          clienteGcBody.email = contato_email;
        }

        // Add loja_id if configured
        if (config.loja_id) {
          clienteGcBody.loja_id = config.loja_id;
        }

        // Add contact as array if contato_nome provided
        if (contato_nome) {
          clienteGcBody.contatos = [{
            contato: {
              nome: contato_nome,
              contato: contato_email || contato_telefone || '',
              cargo: '',
              observacao: observacoes || ''
            }
          }];
        }

        // Add address if provided
        if (endereco) {
          clienteGcBody.enderecos = [{
            endereco: {
              logradouro: endereco,
              numero: '',
              complemento: '',
              bairro: '',
              nome_cidade: cidade_nome || '',
              estado: estado || ''
            }
          }];
        }

        console.log('[gestaoclick-proxy] Payload para criar cliente:', JSON.stringify(clienteGcBody));

        // Call GestaoClick API to create client
        const createResponse = await fetch(`${GESTAOCLICK_BASE_URL}/clientes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
          body: JSON.stringify(clienteGcBody),
        });

        const createText = await createResponse.text();
        console.log('[gestaoclick-proxy] Resposta criar cliente GC:', createText);

        // Parse response
        let createData;
        try {
          createData = JSON.parse(createText);
        } catch {
          console.error('[gestaoclick-proxy] Erro ao parsear resposta:', createText);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Resposta inválida do GestaoClick',
              raw_response: createText.substring(0, 500)
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for errors
        if (hasGCError(createText, createResponse.status)) {
          console.error('[gestaoclick-proxy] Erro ao criar cliente no GC:', createData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: createData.mensagem || createData.message || 'Erro ao criar cliente no GestaoClick',
              details: createData
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract client ID from response
        const clienteGcId = createData.data?.id || createData.id;
        
        if (!clienteGcId) {
          console.error('[gestaoclick-proxy] ID do cliente não retornado:', createData);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'ID do cliente não retornado pelo GestaoClick',
              response: createData
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] Cliente criado no GC com ID:', clienteGcId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            gestaoclick_cliente_id: clienteGcId,
            message: `Cliente criado no GestaoClick com ID ${clienteGcId}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'atualizar_cliente_gc': {
        // DEPRECATED: Não mais utilizado. A sincronização agora é GC → Lovable.
        console.warn('[gestaoclick-proxy] Action atualizar_cliente_gc DEPRECATED - use buscar_cliente_gc');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Action descontinuada. A sincronização agora é feita do GestaoClick para o Lovable via buscar_cliente_gc.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_cliente_gc': {
        // Buscar dados de um único cliente no GestaoClick pelo ID
        const { gestaoclick_cliente_id } = params;
        
        console.log('[gestaoclick-proxy] Buscando cliente no GC:', gestaoclick_cliente_id);
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Usuário não autenticado' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!gestaoclick_cliente_id) {
          return new Response(
            JSON.stringify({ error: 'ID do cliente GestaoClick não fornecido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch GestaoClick config
        const { data: configData } = await supabase
          .from('integracoes_config')
          .select('config')
          .eq('user_id', userId)
          .eq('integracao', 'gestaoclick')
          .maybeSingle();

        if (!configData?.config) {
          return new Response(
            JSON.stringify({ error: 'GestaoClick não configurado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const config = configData.config as GestaoClickConfig;

        // GET client from GestaoClick
        const getResponse = await fetch(`${GESTAOCLICK_BASE_URL}/clientes/${gestaoclick_cliente_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': config.access_token,
            'secret-access-token': config.secret_token,
          },
        });

        const getText = await getResponse.text();
        console.log('[gestaoclick-proxy] Resposta buscar cliente GC:', getText.substring(0, 500));

        let getData;
        try {
          getData = JSON.parse(getText);
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Resposta inválida do GestaoClick' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (hasGCError(getText, getResponse.status)) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: getData.mensagem || getData.message || 'Erro ao buscar cliente no GestaoClick'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract client data - GC returns { data: { Cliente: { ... } } } or { data: { ... } }
        const clienteGc = getData.data?.Cliente || getData.data || getData;
        
        console.log('[gestaoclick-proxy] Cliente GC encontrado:', {
          id: clienteGc.id,
          nome: clienteGc.nome,
          razao_social: clienteGc.razao_social,
          tipo_pessoa: clienteGc.tipo_pessoa,
          cnpj: clienteGc.cnpj,
          cpf: clienteGc.cpf,
          ie: clienteGc.ie
        });

        return new Response(
          JSON.stringify({ 
            success: true,
            cliente: {
              id: clienteGc.id,
              nome: clienteGc.nome || '',
              razao_social: clienteGc.razao_social || '',
              tipo_pessoa: clienteGc.tipo_pessoa || 'PJ',
              cnpj: clienteGc.cnpj || '',
              cpf: clienteGc.cpf || '',
              inscricao_estadual: clienteGc.ie || ''
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_razoes_sociais_lote': {
        // Buscar razões sociais de múltiplos clientes em lote
        const { gestaoclick_cliente_ids, access_token, secret_token } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!gestaoclick_cliente_ids || !Array.isArray(gestaoclick_cliente_ids) || gestaoclick_cliente_ids.length === 0) {
          return new Response(
            JSON.stringify({ error: 'IDs de clientes não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] Buscando razões sociais em lote:', gestaoclick_cliente_ids.length, 'clientes');

        const resultados: Record<string, string> = {};
        
        // Buscar em paralelo (máximo 10 por vez para não sobrecarregar)
        const batchSize = 10;
        for (let i = 0; i < gestaoclick_cliente_ids.length; i += batchSize) {
          const batch = gestaoclick_cliente_ids.slice(i, i + batchSize);
          
          const promises = batch.map(async (gcId: string) => {
            try {
              const response = await fetch(
                `${GESTAOCLICK_BASE_URL}/clientes/${gcId}`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'access-token': access_token,
                    'secret-access-token': secret_token,
                  },
                }
              );
              
              if (!response.ok) {
                console.warn(`[gestaoclick-proxy] Erro ao buscar cliente ${gcId}:`, response.status);
                return { id: gcId, razao_social: '-' };
              }
              
              const data = await response.json();
              const cliente = data.data?.Cliente || data.Cliente || data.data || data;
              
              // Priorizar razao_social, depois nome/fantasia
              const razaoSocial = cliente.razao_social || cliente.nome || cliente.fantasia || '-';
              
              return { id: gcId, razao_social: razaoSocial };
            } catch (err) {
              console.error(`[gestaoclick-proxy] Erro ao buscar cliente ${gcId}:`, err);
              return { id: gcId, razao_social: '-' };
            }
          });
          
          const results = await Promise.all(promises);
          results.forEach(r => { resultados[r.id] = r.razao_social; });
        }

        console.log('[gestaoclick-proxy] Razões sociais encontradas:', Object.keys(resultados).length);

        return new Response(
          JSON.stringify({ success: true, razoes_sociais: resultados }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_recebimentos_venda': {
        // (ver case 'buscar_venda_por_codigo' abaixo para resolver o ID interno da venda)
        // Buscar recebimentos (boletos) de uma venda
        const { access_token, secret_token, cliente_id, data_venda, valor_venda } = params;
        
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!cliente_id) {
          return new Response(
            JSON.stringify({ error: 'cliente_id não fornecido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[gestaoclick-proxy] Buscando recebimentos para cliente:', cliente_id, 'data:', data_venda);

        // Calcular intervalo de datas para busca (7 dias antes e depois da venda)
        const dataBase = data_venda ? new Date(data_venda) : new Date();
        const dataInicio = formatDate(addDays(dataBase, -7));
        const dataFim = formatDate(addDays(dataBase, 30)); // Boletos podem ter vencimento até 30 dias após

        const recebimentosUrl = `${GESTAOCLICK_BASE_URL}/recebimentos?cliente_id=${cliente_id}&data_inicio=${dataInicio}&data_fim=${dataFim}&liquidado=ab`;
        console.log('[gestaoclick-proxy] URL recebimentos:', recebimentosUrl);

        const recebimentosResponse = await fetch(recebimentosUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!recebimentosResponse.ok) {
          const errorText = await recebimentosResponse.text();
          console.error('[gestaoclick-proxy] recebimentos error:', errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao buscar recebimentos: ${recebimentosResponse.status}` }),
            { status: recebimentosResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const recebimentosData = await recebimentosResponse.json();
        // Log COMPLETO da resposta para investigar campos disponíveis (incluindo transaction_id do PagHiper)
        console.log('[gestaoclick-proxy] recebimentos FULL response:', JSON.stringify(recebimentosData));

        const responseText = JSON.stringify(recebimentosData);
        if (hasGCError(responseText, recebimentosResponse.status)) {
          console.error('[gestaoclick-proxy] GC error in recebimentos response');
          return new Response(
            JSON.stringify({ error: 'Erro do GestaoClick ao buscar recebimentos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const recebimentos = recebimentosData.data || [];
        
        // Filtrar por valor aproximado se fornecido (tolerância de R$1)
        let recebimentosFiltrados = recebimentos;
        if (valor_venda && valor_venda > 0) {
          recebimentosFiltrados = recebimentos.filter((r: any) => {
            const rec = r.Recebimento || r;
            const valorRec = parseFloat(rec.valor || '0');
            return Math.abs(valorRec - valor_venda) < 1;
          });
          
          // Se não encontrou com filtro de valor, retornar todos
          if (recebimentosFiltrados.length === 0) {
            recebimentosFiltrados = recebimentos;
          }
        }

        console.log('[gestaoclick-proxy] recebimentos filtrados:', recebimentosFiltrados.length);

        // Retornar TODOS os campos do recebimento para investigação
        return new Response(
          JSON.stringify({ 
            success: true, 
            recebimentos: recebimentosFiltrados.map((r: any) => {
              const rec = r.Recebimento || r;
              // Retornar objeto completo para ver todos os campos disponíveis
              return {
                ...rec,
                // Campos conhecidos (para compatibilidade)
                id: rec.id,
                codigo: rec.codigo,
                descricao: rec.descricao,
                valor: rec.valor,
                cliente_id: rec.cliente_id,
                nome_cliente: rec.nome_cliente,
                data_vencimento: rec.data_vencimento,
                liquidado: rec.liquidado,
                hash: rec.hash,
                // Campos potenciais do PagHiper (investigação)
                transaction_id: rec.transaction_id,
                paghiper_id: rec.paghiper_id,
                boleto_url: rec.boleto_url,
                link_boleto: rec.link_boleto,
                url_boleto: rec.url_boleto
              };
            }),
            // Incluir raw_data para investigação completa
            raw_sample: recebimentosFiltrados.length > 0 ? recebimentosFiltrados[0] : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_venda_por_codigo': {
        // Resolver o ID interno da venda a partir do numero/codigo (ex.: "Venda de nº 1765946984")
        const { access_token, secret_token, codigo } = params;

        if (!access_token || !secret_token || !codigo) {
          return new Response(
            JSON.stringify({ error: 'Tokens ou codigo nao fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const vendaResp = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?codigo=${encodeURIComponent(String(codigo))}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'access-token': access_token,
            'secret-access-token': secret_token,
          },
        });

        if (!vendaResp.ok) {
          const errorText = await vendaResp.text();
          console.error('[gestaoclick-proxy] buscar_venda_por_codigo error:', vendaResp.status, errorText);
          return new Response(
            JSON.stringify({ error: `Erro ao buscar venda: ${vendaResp.status}`, details: errorText }),
            { status: vendaResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const vendaJson = await vendaResp.json();
        const lista = vendaJson?.data || [];
        const venda = (lista[0]?.Venda || lista[0]) ?? null;

        if (!venda?.id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Venda nao encontrada no GestaoClick' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            venda: {
              id: String(venda.id),
              codigo: venda.codigo,
              hash: venda.hash,
              loja_id: venda.loja_id ? String(venda.loja_id) : null,
              nome_cliente: venda.nome_cliente,
              valor_total: venda.valor_total,
              nota_fiscal_id: venda.nota_fiscal_id || null,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_recebimentos_abertos': {
        // Buscar TODOS os recebimentos em aberto (liquidado=ab) com paginacao
        const { meses_retroativos } = params;

        // Acao somente leitura: se o chamador nao mandar tokens (ex.: conta de
        // representante, que nao tem acesso a integracao), resolvemos os tokens
        // do dono da conta a partir do JWT validado acima.
        let access_token: string | undefined = params.access_token;
        let secret_token: string | undefined = params.secret_token;

        if (!access_token || !secret_token) {
          const doDono = await resolveTokensDoDono(supabase, userId);
          if (!doDono) {
            return new Response(
              JSON.stringify({ error: 'Integração com o GestãoClick não configurada' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          access_token = doDono.access_token;
          secret_token = doDono.secret_token;
        }

        const mesesRetro = Number(meses_retroativos) > 0 ? Number(meses_retroativos) : 12;
        const hoje = new Date();
        const dataInicio = formatDate(addDays(hoje, -30 * mesesRetro));
        const dataFim = formatDate(addDays(hoje, 120));

        const todos: any[] = [];
        let paginaAtual = 1;
        let totalPaginas = 1;

        do {
          const url = `${GESTAOCLICK_BASE_URL}/recebimentos?liquidado=ab&data_inicio=${dataInicio}&data_fim=${dataFim}&pagina=${paginaAtual}`;
          const resp = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': access_token,
              'secret-access-token': secret_token,
            },
          });

          if (!resp.ok) {
            const errorText = await resp.text();
            console.error('[gestaoclick-proxy] recebimentos abertos error:', errorText);
            return new Response(
              JSON.stringify({ error: `Erro ao buscar recebimentos: ${resp.status}` }),
              { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const json = await resp.json();
          if (hasGCError(JSON.stringify(json), resp.status)) {
            return new Response(
              JSON.stringify({ error: 'Erro do GestaoClick ao buscar recebimentos' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const lista = json?.data || [];
          lista.forEach((r: any) => todos.push(r.Recebimento || r));

          if (json?.meta?.total_paginas) totalPaginas = json.meta.total_paginas;
          if (lista.length === 0) break;
          paginaAtual++;
        } while (paginaAtual <= totalPaginas && paginaAtual <= 50);

        console.log(`[gestaoclick-proxy] recebimentos abertos: ${todos.length} títulos`);

        // Mapa de formas de pagamento (id -> nome) para enriquecer os títulos
        const mapaFormas = new Map<string, string>();
        try {
          const formasResp = await fetch(`${GESTAOCLICK_BASE_URL}/formas_pagamentos`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'access-token': access_token,
              'secret-access-token': secret_token,
            },
          });
          if (formasResp.ok) {
            const formasJson = await formasResp.json();
            const listaFormas = formasJson?.data || [];
            listaFormas.forEach((f: any) => {
              const item = f?.FormasPagamento || f;
              if (item?.id) mapaFormas.set(String(item.id), item.nome || '');
            });
          }
        } catch (e) {
          console.error('[gestaoclick-proxy] erro ao buscar formas de pagamento:', e);
        }

        return new Response(
          JSON.stringify({
            success: true,
            periodo: { data_inicio: dataInicio, data_fim: dataFim },
            recebimentos: todos
              .filter((rec: any) => String(rec.liquidado ?? '0') !== '1')
              .map((rec: any) => ({
                id: rec.id,
                codigo: rec.codigo,
                descricao: rec.descricao,
                valor: rec.valor,
                cliente_id: rec.cliente_id,
                nome_cliente: rec.nome_cliente,
                data_vencimento: rec.data_vencimento,
                liquidado: rec.liquidado,
                hash: rec.hash,
                valor_total: rec.valor_total,
                conta_bancaria_id: rec.conta_bancaria_id,
                nome_conta_bancaria: rec.nome_conta_bancaria,
                forma_pagamento_id: rec.forma_pagamento_id,
                nome_forma_pagamento:
                  rec.nome_forma_pagamento ||
                  (rec.forma_pagamento_id ? mapaFormas.get(String(rec.forma_pagamento_id)) : undefined),
              })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'historico_financeiro_cliente': {
        // Histórico de títulos de UM cliente — pagos e em aberto — para medir
        // pontualidade cruzando vencimento com liquidação. As outras ações só
        // trazem o que está em aberto, que não diz nada sobre comportamento.
        const { cliente_id, meses } = params;

        if (!cliente_id) {
          return new Response(
            JSON.stringify({ error: 'cliente_id não informado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let access_token: string | undefined = params.access_token;
        let secret_token: string | undefined = params.secret_token;

        if (!access_token || !secret_token) {
          const doDono = await resolveTokensDoDono(supabase, userId);
          if (!doDono) {
            return new Response(
              JSON.stringify({ error: 'Integração com o GestãoClick não configurada' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          access_token = doDono.access_token;
          secret_token = doDono.secret_token;
        }

        const janelaMeses = Number(meses) > 0 ? Number(meses) : 12;
        const hoje = new Date();
        const dataInicio = formatDate(addDays(hoje, -30 * janelaMeses));
        // Inclui o que ainda vai vencer: um título futuro em aberto faz parte
        // da situação do cliente, mesmo não entrando na conta de pontualidade.
        const dataFim = formatDate(addDays(hoje, 120));

        // Sem filtro `liquidado`: a API devolve pagos e em aberto de uma vez, e
        // a separação é feita pelo próprio campo. Evita depender de um valor de
        // filtro e corta pela metade o número de requisições (o limite é de 3
        // por segundo).
        const titulos = await fetchGCPaginado(
          `recebimentos?cliente_id=${encodeURIComponent(String(cliente_id))}` +
            `&data_inicio=${dataInicio}&data_fim=${dataFim}`,
          access_token,
          secret_token,
          'Recebimento',
        );

        console.log(
          `[gestaoclick-proxy] historico do cliente ${cliente_id}: ${titulos.length} títulos desde ${dataInicio}`
        );

        return new Response(
          JSON.stringify({
            success: true,
            periodo: { data_inicio: dataInicio, data_fim: dataFim },
            titulos: titulos.map((t: any) => ({
              id: String(t.id),
              codigo: t.codigo,
              descricao: t.descricao,
              valor: t.valor,
              valor_total: t.valor_total,
              data_vencimento: t.data_vencimento,
              data_liquidacao: t.data_liquidacao,
              liquidado: t.liquidado,
              nome_forma_pagamento: t.nome_forma_pagamento,
            })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_contas_bancarias': {
        const { access_token, secret_token } = params;
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const contas = await fetchGCPaginado('contas_bancarias', access_token, secret_token, 'ContaBancaria');
        console.log(`[gestaoclick-proxy] contas bancárias: ${contas.length}`);

        return new Response(
          JSON.stringify({
            success: true,
            contas: contas.map((c: any) => ({ id: String(c.id), nome: c.nome })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'atualizar_vencimento_recebimento': {
        // Altera a data de vencimento de um título a receber no GestaoClick
        const { access_token, secret_token, recebimento_id, data_vencimento } = params;

        if (!access_token || !secret_token || !recebimento_id || !data_vencimento) {
          return new Response(
            JSON.stringify({ error: 'Parâmetros obrigatórios: recebimento_id, data_vencimento e tokens' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data_vencimento))) {
          return new Response(
            JSON.stringify({ error: 'data_vencimento deve estar no formato YYYY-MM-DD' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const gcHeaders = {
          'Content-Type': 'application/json',
          'access-token': access_token,
          'secret-access-token': secret_token,
        };

        // 1) Ler o título atual (para retorno/validação)
        const getResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'GET',
          headers: gcHeaders,
        });
        const getJson = await getResp.json().catch(() => null);
        const atual = getJson?.data?.Recebimento || getJson?.data || null;

        if (!getResp.ok || !atual?.id) {
          console.error('[gestaoclick-proxy] recebimento não encontrado:', recebimento_id, JSON.stringify(getJson));
          return new Response(
            JSON.stringify({ error: `Título ${recebimento_id} não encontrado no GestãoClick` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (String(atual.liquidado ?? '0') === '1') {
          return new Response(
            JSON.stringify({ error: 'Título já liquidado — não é possível alterar o vencimento' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2) Atualizar o vencimento (o GC exige os campos principais no PUT)
        const payload: Record<string, unknown> = {
          data_vencimento,
          valor: atual.valor,
          cliente_id: atual.cliente_id,
          descricao: atual.descricao,
        };
        if (atual.conta_bancaria_id) payload.conta_bancaria_id = atual.conta_bancaria_id;
        if (atual.plano_contas_id) payload.plano_contas_id = atual.plano_contas_id;
        if (atual.forma_pagamento_id) payload.forma_pagamento_id = atual.forma_pagamento_id;

        const putResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'PUT',
          headers: gcHeaders,
          body: JSON.stringify(payload),
        });
        const putText = await putResp.text();
        console.log('[gestaoclick-proxy] PUT recebimento status', putResp.status, putText.slice(0, 500));

        // 3) Conferir no GC se a data realmente mudou (o GC responde 200 com avisos de PHP)
        const confResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'GET',
          headers: gcHeaders,
        });
        const confJson = await confResp.json().catch(() => null);
        const confirmado = confJson?.data?.Recebimento || confJson?.data || null;
        const dataConfirmada = String(confirmado?.data_vencimento || '').slice(0, 10);

        if (!putResp.ok || dataConfirmada !== data_vencimento) {
          return new Response(
            JSON.stringify({
              error: 'GestãoClick recusou a alteração do vencimento',
              data_vencimento_atual: dataConfirmada || null,
              detalhe: putText.slice(0, 500),
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            recebimento_id: String(recebimento_id),
            data_vencimento_anterior: atual.data_vencimento,
            data_vencimento: data_vencimento,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'atualizar_situacao_recebimento': {
        // Altera a situação (em aberto / recebido) de um título a receber, sem mexer no valor
        const { access_token, secret_token, recebimento_id, situacao, data_liquidacao, forma_pagamento_id } = params;

        if (!access_token || !secret_token || !recebimento_id || !situacao) {
          return new Response(
            JSON.stringify({ error: 'Parâmetros obrigatórios: recebimento_id, situacao e tokens' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!['recebido', 'em_aberto'].includes(String(situacao))) {
          return new Response(
            JSON.stringify({ error: "situacao deve ser 'recebido' ou 'em_aberto'" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const liquidar = String(situacao) === 'recebido';
        const dataLiq = liquidar
          ? (/^\d{4}-\d{2}-\d{2}$/.test(String(data_liquidacao || '')) ? String(data_liquidacao) : formatDate(new Date()))
          : '';

        const gcHeadersSit = {
          'Content-Type': 'application/json',
          'access-token': access_token,
          'secret-access-token': secret_token,
        };

        const getSitResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'GET',
          headers: gcHeadersSit,
        });
        const getSitJson = await getSitResp.json().catch(() => null);
        const atualSit = getSitJson?.data?.Recebimento || getSitJson?.data || null;

        if (!getSitResp.ok || !atualSit?.id) {
          return new Response(
            JSON.stringify({ error: `Título ${recebimento_id} não encontrado no GestãoClick` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Preserva todos os campos financeiros do título (nunca alteramos o valor)
        const payloadSit: Record<string, unknown> = {
          liquidado: liquidar ? '1' : '0',
          data_liquidacao: dataLiq,
          valor: atualSit.valor,
          cliente_id: atualSit.cliente_id,
          descricao: atualSit.descricao,
          data_vencimento: atualSit.data_vencimento,
        };
        if (atualSit.conta_bancaria_id) payloadSit.conta_bancaria_id = atualSit.conta_bancaria_id;
        if (atualSit.plano_contas_id) payloadSit.plano_contas_id = atualSit.plano_contas_id;
        const formaFinal = forma_pagamento_id ? String(forma_pagamento_id) : atualSit.forma_pagamento_id;
        if (formaFinal) payloadSit.forma_pagamento_id = formaFinal;

        const putSitResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'PUT',
          headers: gcHeadersSit,
          body: JSON.stringify(payloadSit),
        });
        const putSitText = await putSitResp.text();
        console.log('[gestaoclick-proxy] PUT situação recebimento', recebimento_id, putSitResp.status, putSitText.slice(0, 200));

        const confSitResp = await fetch(`${GESTAOCLICK_BASE_URL}/recebimentos/${recebimento_id}`, {
          method: 'GET',
          headers: gcHeadersSit,
        });
        const confSitJson = await confSitResp.json().catch(() => null);
        const confSit = confSitJson?.data?.Recebimento || confSitJson?.data || null;
        const liquidadoAgora = String(confSit?.liquidado ?? '0') === '1';

        if (!putSitResp.ok || liquidadoAgora !== liquidar) {
          return new Response(
            JSON.stringify({
              error: 'GestãoClick recusou a alteração da situação',
              detalhe: putSitText.slice(0, 500),
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            recebimento_id: String(recebimento_id),
            situacao: liquidar ? 'recebido' : 'em_aberto',
            data_liquidacao: confSit?.data_liquidacao || null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_formas_pagamento_gc': {
        const { access_token, secret_token } = params;
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const lista = await fetchGCPaginado(
          'formas_pagamentos',
          access_token,
          secret_token,
          'FormasPagamento',
        );

        return new Response(
          JSON.stringify({
            success: true,
            formas_pagamento: lista
              .map((f: any) => ({
                id: String(f?.id ?? f?.forma_pagamento_id ?? ''),
                nome: String(f?.nome ?? f?.forma_pagamento ?? ''),
              }))
              .filter((f: { id: string; nome: string }) => f.id && f.nome),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_pagamentos_abertos': {
        const { access_token, secret_token, dias_futuros, meses_retroativos } = params;
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const mesesRetro = Number(meses_retroativos) > 0 ? Number(meses_retroativos) : 12;
        const diasFuturos = Number(dias_futuros) > 0 ? Number(dias_futuros) : 180;
        const hoje = new Date();
        const dataInicio = formatDate(addDays(hoje, -30 * mesesRetro));
        const dataFim = formatDate(addDays(hoje, diasFuturos));

        const todos = await fetchGCPaginado(
          `pagamentos?liquidado=ab&data_inicio=${dataInicio}&data_fim=${dataFim}`,
          access_token,
          secret_token,
          'Pagamento',
        );

        console.log(`[gestaoclick-proxy] pagamentos abertos: ${todos.length} títulos`);

        return new Response(
          JSON.stringify({
            success: true,
            periodo: { data_inicio: dataInicio, data_fim: dataFim },
            pagamentos: todos
              .filter((p: any) => String(p.liquidado ?? '0') !== '1')
              .map((p: any) => ({
                id: String(p.id),
                codigo: p.codigo,
                descricao: p.descricao,
                valor: p.valor,
                valor_total: p.valor_total,
                data_vencimento: p.data_vencimento,
                conta_bancaria_id: p.conta_bancaria_id,
                nome_conta_bancaria: p.nome_conta_bancaria,
                nome_fornecedor: p.nome_fornecedor,
                nome_cliente: p.nome_cliente,
                nome_plano_conta: p.nome_plano_conta,
                liquidado: p.liquidado,
              })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_movimentos_liquidados': {
        // Soma dos liquidados por conta bancária a partir de uma data de referência
        const { access_token, secret_token, data_referencia } = params;
        if (!access_token || !secret_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens não fornecidos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hoje = new Date();
        const dataInicio = /^\d{4}-\d{2}-\d{2}$/.test(String(data_referencia || ''))
          ? String(data_referencia)
          : formatDate(addDays(hoje, -90));
        const dataFim = formatDate(hoje);

        const [recebidos, pagos] = await Promise.all([
          fetchGCPaginado(
            `recebimentos?liquidado=li&data_inicio=${dataInicio}&data_fim=${dataFim}`,
            access_token,
            secret_token,
            'Recebimento',
          ),
          fetchGCPaginado(
            `pagamentos?liquidado=li&data_inicio=${dataInicio}&data_fim=${dataFim}`,
            access_token,
            secret_token,
            'Pagamento',
          ),
        ]);

        const porConta: Record<string, { entradas: number; saidas: number }> = {};
        const acumular = (conta: any, valor: number, tipo: 'entradas' | 'saidas') => {
          const key = String(conta || 'sem_conta');
          if (!porConta[key]) porConta[key] = { entradas: 0, saidas: 0 };
          porConta[key][tipo] += valor;
        };

        recebidos.forEach((r: any) =>
          acumular(r.conta_bancaria_id, numGC(r.valor_total ?? r.valor), 'entradas')
        );
        pagos.forEach((p: any) =>
          acumular(p.conta_bancaria_id, numGC(p.valor_total ?? p.valor), 'saidas')
        );

        console.log(
          `[gestaoclick-proxy] liquidados desde ${dataInicio}: ${recebidos.length} recebidos, ${pagos.length} pagos`
        );

        return new Response(
          JSON.stringify({
            success: true,
            periodo: { data_inicio: dataInicio, data_fim: dataFim },
            por_conta: Object.entries(porConta).map(([conta_bancaria_id, v]) => ({
              conta_bancaria_id,
              entradas: v.entradas,
              saidas: v.saidas,
              liquido: v.entradas - v.saidas,
            })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[gestaoclick-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});