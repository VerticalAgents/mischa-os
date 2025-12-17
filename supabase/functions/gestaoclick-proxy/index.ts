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
    // Fetch most recent sale ordered by codigo descending
    const response = await fetch(`${GESTAOCLICK_BASE_URL}/vendas?limite=1&ordenar_por=codigo&ordem=desc`, {
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
    
    // Extract highest codigo from returned sales
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      // Handle both direct and nested response structures
      const venda = data.data[0];
      const codigoStr = venda.codigo || venda.Venda?.codigo;
      const ultimoCodigo = parseInt(codigoStr, 10);
      
      if (!isNaN(ultimoCodigo)) {
        console.log(`[gestaoclick-proxy] Último código encontrado: ${ultimoCodigo}, próximo: ${ultimoCodigo + 1}`);
        return ultimoCodigo + 1;
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
        const maxRetries = 5;

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
        const maxRetries = 5;

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