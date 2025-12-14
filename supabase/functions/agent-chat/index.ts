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

// Função para buscar contexto completo do negócio
async function getFullContext(supabase: any): Promise<string> {
  const hoje = new Date().toISOString().split('T')[0];
  const data4Semanas = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const data14Dias = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // Queries paralelas para performance
    const [
      clientesResult,
      entregasResult,
      agendamentosResult,
      produtosResult,
      insumosResult,
      producaoResult,
      custosFixosResult,
      custosVariaveisResult,
      leadsResult,
      rotasResult,
      representantesResult,
    ] = await Promise.all([
      // Clientes ativos com detalhes
      supabase
        .from("clientes")
        .select("id, nome, status_cliente, giro_medio_semanal, quantidade_padrao, periodicidade_padrao, proxima_data_reposicao, ultima_data_reposicao_efetiva, rota_entrega_id, representante_id, categoria_estabelecimento_id")
        .eq("ativo", true)
        .order("giro_medio_semanal", { ascending: false })
        .limit(100),

      // Histórico de entregas últimas 4 semanas
      supabase
        .from("historico_entregas")
        .select("cliente_id, data, quantidade, tipo, itens")
        .gte("data", data4Semanas)
        .order("data", { ascending: false })
        .limit(300),

      // Agendamentos próximos 14 dias
      supabase
        .from("agendamentos_clientes")
        .select("cliente_id, data_proxima_reposicao, quantidade_total, status_agendamento, tipo_pedido, substatus_pedido")
        .gte("data_proxima_reposicao", hoje)
        .lte("data_proxima_reposicao", data14Dias)
        .order("data_proxima_reposicao", { ascending: true })
        .limit(100),

      // Produtos ativos com estoque
      supabase
        .from("produtos_finais")
        .select("id, nome, estoque_atual, estoque_minimo, estoque_ideal, preco_venda, categoria_id")
        .eq("ativo", true)
        .order("nome"),

      // Insumos com estoque
      supabase
        .from("insumos")
        .select("id, nome, estoque_atual, estoque_minimo, custo_medio, unidade_medida")
        .order("nome")
        .limit(50),

      // Produção última semana
      supabase
        .from("historico_producao")
        .select("produto_nome, formas_producidas, unidades_calculadas, data_producao, status")
        .gte("data_producao", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("data_producao", { ascending: false })
        .limit(50),

      // Custos fixos
      supabase
        .from("custos_fixos")
        .select("nome, valor, subcategoria, frequencia"),

      // Custos variáveis
      supabase
        .from("custos_variaveis")
        .select("nome, valor, subcategoria, percentual_faturamento"),

      // Leads ativos
      supabase
        .from("leads")
        .select("id, nome, status, origem, quantidade_estimada, data_visita")
        .not("status", "ilike", "%perdido%")
        .order("created_at", { ascending: false })
        .limit(30),

      // Rotas
      supabase
        .from("rotas_entrega")
        .select("id, nome")
        .eq("ativo", true),

      // Representantes
      supabase
        .from("representantes")
        .select("id, nome")
        .eq("ativo", true),
    ]);

    const clientes = clientesResult.data || [];
    const entregas = entregasResult.data || [];
    const agendamentos = agendamentosResult.data || [];
    const produtos = produtosResult.data || [];
    const insumos = insumosResult.data || [];
    const producao = producaoResult.data || [];
    const custosFixos = custosFixosResult.data || [];
    const custosVariaveis = custosVariaveisResult.data || [];
    const leads = leadsResult.data || [];
    const rotas = rotasResult.data || [];
    const representantes = representantesResult.data || [];

    // Criar mapa de rotas e representantes para lookup
    const rotasMap = Object.fromEntries(rotas.map((r: any) => [r.id, r.nome]));
    const repMap = Object.fromEntries(representantes.map((r: any) => [r.id, r.nome]));

    // Calcular métricas
    const clientesAtivos = clientes.filter((c: any) => c.status_cliente === "Ativo").length;
    const giroTotal = clientes.reduce((sum: number, c: any) => sum + (c.giro_medio_semanal || 0), 0);
    const volumeEntregas = entregas.reduce((sum: number, e: any) => sum + (e.quantidade || 0), 0);
    const totalCustosFixos = custosFixos.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
    const totalCustosVariaveis = custosVariaveis.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
    const unidadesProduzidas = producao.reduce((sum: number, p: any) => sum + (p.unidades_calculadas || 0), 0);

    // Agrupar entregas por data
    const entregasPorDia: Record<string, number> = {};
    entregas.forEach((e: any) => {
      const dia = e.data?.split('T')[0];
      if (dia) {
        entregasPorDia[dia] = (entregasPorDia[dia] || 0) + (e.quantidade || 0);
      }
    });

    // Agrupar agendamentos por dia
    const agendamentosPorDia: Record<string, { count: number; volume: number }> = {};
    agendamentos.forEach((a: any) => {
      const dia = a.data_proxima_reposicao;
      if (dia) {
        if (!agendamentosPorDia[dia]) agendamentosPorDia[dia] = { count: 0, volume: 0 };
        agendamentosPorDia[dia].count++;
        agendamentosPorDia[dia].volume += a.quantidade_total || 0;
      }
    });

    // Contar leads por status
    const leadsPorStatus: Record<string, number> = {};
    leads.forEach((l: any) => {
      leadsPorStatus[l.status] = (leadsPorStatus[l.status] || 0) + 1;
    });

    // Formatar contexto
    const context = `
## 📊 DADOS DO NEGÓCIO - Mischa's Bakery
📅 Data: ${new Date().toLocaleDateString("pt-BR")}

---

### 👥 CLIENTES
- **Total cadastrados:** ${clientes.length}
- **Clientes ativos:** ${clientesAtivos}
- **Giro semanal total estimado:** ${giroTotal} unidades

**Top 20 clientes por giro:**
${clientes.slice(0, 20).map((c: any) => 
  `- ${c.nome}: ${c.giro_medio_semanal || 0}/sem, periodicidade ${c.periodicidade_padrao || 7} dias, status: ${c.status_cliente}${c.rota_entrega_id ? `, rota: ${rotasMap[c.rota_entrega_id] || c.rota_entrega_id}` : ''}`
).join('\n')}

---

### 📦 ENTREGAS (últimas 4 semanas)
- **Total de entregas:** ${entregas.length}
- **Volume total:** ${volumeEntregas} unidades
- **Média por entrega:** ${entregas.length > 0 ? Math.round(volumeEntregas / entregas.length) : 0} unidades

**Entregas por dia (últimos 10 dias com movimento):**
${Object.entries(entregasPorDia).slice(0, 10).map(([dia, vol]) => 
  `- ${new Date(dia).toLocaleDateString("pt-BR")}: ${vol} unidades`
).join('\n')}

---

### 📅 AGENDAMENTOS (próximos 14 dias)
- **Total agendamentos:** ${agendamentos.length}
- **Volume previsto:** ${agendamentos.reduce((s: number, a: any) => s + (a.quantidade_total || 0), 0)} unidades

**Por dia:**
${Object.entries(agendamentosPorDia).slice(0, 10).map(([dia, info]) => 
  `- ${new Date(dia).toLocaleDateString("pt-BR")}: ${info.count} entregas (${info.volume} un.)`
).join('\n')}

---

### 🏭 ESTOQUE DE PRODUTOS
${produtos.map((p: any) => 
  `- ${p.nome}: ${p.estoque_atual || 0} un. (mín: ${p.estoque_minimo || 0}, ideal: ${p.estoque_ideal || 0})${p.preco_venda ? ` - R$ ${p.preco_venda}` : ''}`
).join('\n')}

---

### 🧪 INSUMOS (matéria-prima)
${insumos.slice(0, 20).map((i: any) => 
  `- ${i.nome}: ${i.estoque_atual || 0} ${i.unidade_medida} (mín: ${i.estoque_minimo || 0}) - custo médio R$ ${i.custo_medio || 0}`
).join('\n')}

---

### 🍞 PRODUÇÃO (última semana)
- **Total produzido:** ${unidadesProduzidas} unidades
- **Registros de produção:** ${producao.length}

**Detalhamento:**
${producao.slice(0, 15).map((p: any) => 
  `- ${p.data_producao}: ${p.produto_nome} - ${p.unidades_calculadas} un. (${p.formas_producidas} formas) - ${p.status}`
).join('\n')}

---

### 💰 CUSTOS
**Custos Fixos (total mensal: R$ ${totalCustosFixos.toFixed(2)}):**
${custosFixos.slice(0, 10).map((c: any) => 
  `- ${c.nome}: R$ ${c.valor} (${c.subcategoria})`
).join('\n')}

**Custos Variáveis (total: R$ ${totalCustosVariaveis.toFixed(2)}):**
${custosVariaveis.slice(0, 10).map((c: any) => 
  `- ${c.nome}: R$ ${c.valor} (${c.percentual_faturamento}% do faturamento)`
).join('\n')}

---

### 🎯 LEADS/PROSPECÇÃO
- **Leads ativos:** ${leads.length}

**Por status:**
${Object.entries(leadsPorStatus).map(([status, count]) => 
  `- ${status}: ${count}`
).join('\n')}

---

### 🚚 ROTAS DE ENTREGA
${rotas.map((r: any) => `- ${r.nome}`).join('\n')}

### 👤 REPRESENTANTES
${representantes.map((r: any) => `- ${r.nome}`).join('\n')}
`;

    console.log(`[agent-chat] Contexto carregado:`, {
      clientes: clientes.length,
      entregas: entregas.length,
      agendamentos: agendamentos.length,
      produtos: produtos.length,
      insumos: insumos.length,
      producao: producao.length,
      leads: leads.length,
    });

    return context;
  } catch (error) {
    console.error("[agent-chat] Erro ao buscar contexto:", error);
    return "\n\n⚠️ Não foi possível carregar todos os dados do sistema. Algumas informações podem estar indisponíveis.";
  }
}

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

    // Buscar contexto completo do banco
    let contextData = "";
    
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        contextData = await getFullContext(supabase);
      }
    } catch (dbError) {
      console.error("[agent-chat] Erro ao buscar contexto do banco:", dbError);
    }

    const fullSystemPrompt = systemPrompt + contextData;

    console.log(`[agent-chat] Agente: ${agenteId}, Mensagens: ${messages.length}, Contexto: ${contextData.length} chars`);

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
