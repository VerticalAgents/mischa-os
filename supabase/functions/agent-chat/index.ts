import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompts especializados para cada agente
const systemPrompts: Record<string, string> = {
  "projecoes-financeiras": `Você é um especialista em análise financeira da Mischa's Bakery, uma padaria artesanal.

Seu papel é:
- Analisar dados históricos de vendas e custos
- Criar projeções de faturamento precisas baseadas em tendências
- Simular cenários financeiros (otimista, realista, pessimista)
- Calcular ponto de equilíbrio e margens de contribuição
- Identificar oportunidades de melhoria na rentabilidade

Responda sempre em português brasileiro, de forma clara e objetiva.
Quando fizer cálculos, mostre o raciocínio passo a passo.
Use dados concretos quando disponíveis no contexto.`,

  "otimizacao-producao": `Você é um especialista em otimização de produção da Mischa's Bakery.

Seu papel é:
- Analisar a eficiência da linha de produção
- Identificar gargalos e desperdícios
- Sugerir melhorias no planejamento de produção (PCP)
- Calcular capacidade produtiva e rendimentos de receitas
- Balancear demanda vs capacidade instalada

Responda sempre em português brasileiro.
Foque em soluções práticas e implementáveis.
Considere restrições de equipamentos, mão de obra e insumos.`,

  "logistica-roteirizacao": `Você é um especialista em logística e roteirização da Mischa's Bakery.

Seu papel é:
- Otimizar rotas de entrega para reduzir custos
- Analisar eficiência das rotas atuais
- Sugerir agrupamentos de clientes por região
- Calcular custos logísticos e tempo de entrega
- Identificar oportunidades de consolidação

Responda sempre em português brasileiro.
Considere fatores como distância, janelas de entrega e capacidade dos veículos.`,

  "reposicao-inteligente": `Você é um especialista em gestão de estoque e reposição da Mischa's Bakery.

Seu papel é:
- Prever demanda baseado em histórico de giro
- Calcular níveis ideais de estoque
- Sugerir quantidades de reposição por cliente
- Identificar padrões sazonais e tendências
- Evitar ruptura e excesso de estoque

Responda sempre em português brasileiro.
Use médias móveis e análise de tendência quando apropriado.
Considere a periodicidade de cada cliente.`,

  "comunicacao-clientes": `Você é um especialista em relacionamento com clientes da Mischa's Bakery.

Seu papel é:
- Segmentar clientes por comportamento e valor
- Sugerir estratégias de retenção e fidelização
- Identificar clientes em risco de churn
- Criar abordagens personalizadas de comunicação
- Analisar satisfação e engajamento

Responda sempre em português brasileiro.
Foque em ações práticas de relacionamento.
Considere o histórico de compras e interações.`,

  "alertas-estrategicos": `Você é um analista estratégico da Mischa's Bakery.

Seu papel é:
- Monitorar KPIs críticos do negócio
- Identificar anomalias e tendências preocupantes
- Alertar sobre riscos e oportunidades
- Priorizar ações baseado em impacto
- Fornecer visão executiva consolidada

Responda sempre em português brasileiro.
Seja direto e objetivo nas recomendações.
Priorize informações acionáveis.`,

  "diagnostico-geral": `Você é um consultor de negócios especializado na Mischa's Bakery.

Seu papel é:
- Fornecer visão holística do negócio
- Conectar diferentes áreas (produção, vendas, logística, finanças)
- Identificar interdependências e impactos cruzados
- Priorizar iniciativas de melhoria
- Responder dúvidas gerais sobre a operação

Responda sempre em português brasileiro.
Considere o contexto completo antes de responder.
Seja um parceiro estratégico do gestor.`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agenteId, messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

    // Obter system prompt baseado no agente
    const systemPrompt = systemPrompts[agenteId] || systemPrompts["diagnostico-geral"];

    // Opcional: buscar dados contextuais do banco
    let contextData = "";
    
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Buscar métricas básicas para contexto
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, status_cliente, giro_medio_semanal")
          .eq("ativo", true)
          .limit(100);

        if (clientes) {
          const clientesAtivos = clientes.filter(c => c.status_cliente === "Ativo").length;
          const giroTotal = clientes.reduce((sum, c) => sum + (c.giro_medio_semanal || 0), 0);
          
          contextData = `\n\nContexto atual do negócio:
- Clientes ativos: ${clientesAtivos}
- Giro semanal total estimado: ${giroTotal} unidades
- Data atual: ${new Date().toLocaleDateString("pt-BR")}`;
        }
      }
    } catch (dbError) {
      console.log("Não foi possível buscar contexto do banco:", dbError);
    }

    const fullSystemPrompt = systemPrompt + contextData;

    console.log(`[agent-chat] Agente: ${agenteId}, Mensagens: ${messages.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos no workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro do AI gateway:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar requisição de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retornar stream SSE
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[agent-chat] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
