import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAGHIPER_API_URL = 'https://api.paghiper.com';

interface PagHiperCredentials {
  apiKey: string;
  token: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log(`[paghiper-proxy] Action: ${action}`, JSON.stringify(params).substring(0, 200));

    // Get PagHiper credentials from environment
    const apiKey = Deno.env.get('PAGHIPER_API_KEY');
    const token = Deno.env.get('PAGHIPER_TOKEN');

    if (!apiKey || !token) {
      console.error('[paghiper-proxy] Credenciais PagHiper não configuradas');
      return new Response(
        JSON.stringify({ error: 'Credenciais PagHiper não configuradas. Configure PAGHIPER_API_KEY e PAGHIPER_TOKEN.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'test_connection': {
        // Test connection by querying a known transaction or just validate credentials format
        console.log('[paghiper-proxy] Testando conexão com PagHiper...');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Credenciais configuradas. Use buscar_boleto com um transaction_id para testar.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_boleto': {
        // Buscar boleto pelo transaction_id
        const { transaction_id } = params;
        
        if (!transaction_id) {
          return new Response(
            JSON.stringify({ error: 'transaction_id é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[paghiper-proxy] Buscando boleto:', transaction_id);

        const response = await fetch(`${PAGHIPER_API_URL}/transaction/status/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            apiKey: apiKey,
            token: token,
            transaction_id: transaction_id,
          }),
        });

        const responseText = await response.text();
        console.log('[paghiper-proxy] Resposta PagHiper (status):', response.status, responseText.substring(0, 500));

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error('[paghiper-proxy] Erro ao parsear resposta:', responseText);
          return new Response(
            JSON.stringify({ error: 'Resposta inválida do PagHiper', raw: responseText.substring(0, 500) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for PagHiper errors
        if (data.status_request?.result === 'reject') {
          console.error('[paghiper-proxy] PagHiper rejeitou:', data.status_request);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: data.status_request?.response_message || 'Boleto não encontrado',
              details: data.status_request
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract boleto data
        const statusRequest = data.status_request || {};
        const bankSlip = statusRequest.bank_slip || {};

        return new Response(
          JSON.stringify({
            success: true,
            transaction_id: statusRequest.transaction_id,
            order_id: statusRequest.order_id,
            status: statusRequest.status,
            status_date: statusRequest.status_date,
            due_date: statusRequest.due_date,
            value_cents: statusRequest.value_cents,
            value_fee_cents: statusRequest.value_fee_cents,
            discount_cents: statusRequest.discount_cents,
            payer_name: statusRequest.payer_name,
            payer_email: statusRequest.payer_email,
            payer_cpf_cnpj: statusRequest.payer_cpf_cnpj,
            // URLs do boleto
            url_slip: bankSlip.url_slip,
            url_slip_pdf: bankSlip.url_slip_pdf,
            digitable_line: bankSlip.digitable_line,
            bar_code_number_to_image: bankSlip.bar_code_number_to_image,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'listar_transacoes': {
        // Listar transações por período para encontrar boletos
        // NOTA: Este endpoint pode não estar disponível na API pública
        // Vamos tentar buscar usando os parâmetros disponíveis
        const { data_inicio, data_fim, status } = params;

        console.log('[paghiper-proxy] Listando transações:', { data_inicio, data_fim, status });

        // A API do PagHiper não tem endpoint de listagem pública
        // Vamos retornar um erro informativo
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'A API do PagHiper não possui endpoint público para listar transações. Use buscar_boleto com o transaction_id específico.',
            alternativa: 'Para obter o transaction_id, verifique se o GestaoClick armazena essa informação ou implemente um webhook para capturar no momento da criação do boleto.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'buscar_por_order_id': {
        // Tentar buscar boleto pelo order_id (código da venda no GestaoClick)
        // NOTA: A API do PagHiper usa transaction_id, não order_id para consultas
        const { order_id } = params;

        console.log('[paghiper-proxy] Tentando buscar por order_id:', order_id);

        // Infelizmente a API do PagHiper não tem busca por order_id
        // Retornar informação sobre essa limitação
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'A API do PagHiper não permite busca por order_id. É necessário o transaction_id.',
            sugestao: 'O transaction_id é gerado pelo PagHiper no momento da criação do boleto. Verifique se o GestaoClick armazena esse valor.'
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
    console.error('[paghiper-proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
