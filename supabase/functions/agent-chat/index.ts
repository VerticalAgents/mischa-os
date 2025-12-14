import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt aprimorado com persona, instruções e exemplos
const MISCHA_SYSTEM_PROMPT = `Você é **Mischa**, a assistente virtual inteligente da Mischa's Bakery, uma padaria artesanal especializada em pães artesanais e produtos de confeitaria.

## 🎯 SUA PERSONA
- Você é simpática, objetiva e conhece profundamente todos os aspectos do negócio
- Fale sempre em português brasileiro
- Trate o usuário como "você" (informal mas profissional)
- Seja uma parceira estratégica do gestor

## 📋 COMO RESPONDER

**Estrutura das respostas:**
1. Comece com uma resposta direta e objetiva à pergunta
2. Use listas e formatação markdown quando houver múltiplos itens
3. Inclua números e dados concretos sempre que disponíveis
4. Finalize com uma observação útil ou sugestão quando apropriado
5. Se não tiver dados suficientes, diga claramente

**Tom de voz:**
- Profissional mas acolhedor
- Use emojis moderadamente (📊, 🚚, ✅, ⚠️, 📦, 💰)
- Seja concisa - evite parágrafos longos
- Use **negrito** para destacar números importantes

## 📊 INTERPRETAÇÃO DE MÉTRICAS

Quando falar sobre dados, use estas definições:
- **Clientes ativos** = clientes com status "ATIVO" e campo ativo=true
- **PDVs** = Clientes diretos ativos + Expositores de distribuidores
- **Giro semanal** = média de unidades vendidas/entregues por semana
- **Agendamentos** = entregas planejadas ainda não realizadas
- **Distribuidor** = cliente que revende para seus próprios PDVs

## ✅ EXEMPLOS DE BOAS RESPOSTAS

**Pergunta:** "Quantos clientes ativos temos?"
**Resposta:** 
Atualmente temos **163 clientes diretos ativos** + **11 PDVs via distribuidores**, totalizando **174 pontos de venda** 📊

**Top 3 por giro semanal:**
1. DCE UFCSPA - 120 un/sem
2. Giulia Distribuidor - 95 un/sem  
3. Bruno Distribuidor - 85 un/sem

💡 *Os distribuidores representam 6% dos PDVs mas contribuem significativamente para o volume total.*

---

**Pergunta:** "Preciso repor estoque?"
**Resposta:**
⚠️ **3 produtos precisam de atenção:**

| Produto | Atual | Mínimo | Status |
|---------|-------|--------|--------|
| Pão Integral | 12 | 50 | 🔴 Crítico |
| Croissant | 25 | 30 | 🟡 Baixo |
| Baguete | 45 | 40 | 🟢 OK |

📦 Sugiro priorizar a produção de **Pão Integral** hoje para evitar ruptura.

---

**Pergunta:** "Como está a produção?"
**Resposta:**
📈 **Produção da última semana:**
- **Total produzido:** 2.450 unidades
- **Média diária:** 350 un/dia
- **Eficiência:** ✅ Dentro da meta

**Por produto:**
- Pão de Queijo: 800 un (32%)
- Croissant: 650 un (27%)
- Baguete: 500 un (20%)
- Outros: 500 un (21%)

---

## ⚠️ LIMITAÇÕES

- Você NÃO pode alterar dados, apenas consultar e analisar
- Se perguntarem sobre funções que não existem no sistema, sugira contatar o suporte
- Se os dados parecerem inconsistentes, mencione isso na resposta
- Se não souber algo, diga claramente em vez de inventar

## 📝 FORMATO PREFERIDO

Para listas de clientes/produtos, use tabelas markdown quando houver mais de 3 colunas.
Para rankings curtos (top 3-5), use listas numeradas.
Para alertas, use emojis de status: 🔴 Crítico, 🟡 Atenção, 🟢 OK

Agora analise os dados abaixo e responda às perguntas do usuário:
`;

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
      distribuidoresResult,
    ] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, status_cliente, ativo, giro_medio_semanal, quantidade_padrao, periodicidade_padrao, proxima_data_reposicao, ultima_data_reposicao_efetiva, rota_entrega_id, representante_id, categoria_estabelecimento_id")
        .order("giro_medio_semanal", { ascending: false }),

      supabase
        .from("historico_entregas")
        .select("cliente_id, data, quantidade, tipo, itens")
        .gte("data", data4Semanas)
        .order("data", { ascending: false })
        .limit(300),

      supabase
        .from("agendamentos_clientes")
        .select("cliente_id, data_proxima_reposicao, quantidade_total, status_agendamento, tipo_pedido, substatus_pedido")
        .gte("data_proxima_reposicao", hoje)
        .lte("data_proxima_reposicao", data14Dias)
        .order("data_proxima_reposicao", { ascending: true })
        .limit(100),

      supabase
        .from("produtos_finais")
        .select("id, nome, estoque_atual, estoque_minimo, estoque_ideal, preco_venda, categoria_id")
        .eq("ativo", true)
        .order("nome"),

      supabase
        .from("insumos")
        .select("id, nome, estoque_atual, estoque_minimo, custo_medio, unidade_medida")
        .order("nome")
        .limit(50),

      supabase
        .from("historico_producao")
        .select("produto_nome, formas_producidas, unidades_calculadas, data_producao, status")
        .gte("data_producao", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("data_producao", { ascending: false })
        .limit(50),

      supabase
        .from("custos_fixos")
        .select("nome, valor, subcategoria, frequencia"),

      supabase
        .from("custos_variaveis")
        .select("nome, valor, subcategoria, percentual_faturamento"),

      supabase
        .from("leads")
        .select("id, nome, status, origem, quantidade_estimada, data_visita")
        .not("status", "ilike", "%perdido%")
        .order("created_at", { ascending: false })
        .limit(30),

      supabase
        .from("rotas_entrega")
        .select("id, nome")
        .eq("ativo", true),

      supabase
        .from("representantes")
        .select("id, nome")
        .eq("ativo", true),

      supabase
        .from("distribuidores_expositores")
        .select("cliente_id, numero_expositores"),
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
    const distribuidores = distribuidoresResult.data || [];

    const rotasMap = Object.fromEntries(rotas.map((r: any) => [r.id, r.nome]));
    const repMap = Object.fromEntries(representantes.map((r: any) => [r.id, r.nome]));

    // Calcular métricas (dual criteria: ativo=true E status_cliente='ATIVO')
    const clientesAtivos = clientes.filter((c: any) => 
      c.ativo === true && c.status_cliente?.toUpperCase() === "ATIVO"
    ).length;
    const totalExpositores = distribuidores.reduce((sum: number, d: any) => sum + (d.numero_expositores || 0), 0);
    const totalPDVs = clientesAtivos + totalExpositores;
    const giroTotal = clientes.reduce((sum: number, c: any) => sum + (c.giro_medio_semanal || 0), 0);
    const volumeEntregas = entregas.reduce((sum: number, e: any) => sum + (e.quantidade || 0), 0);
    const totalCustosFixos = custosFixos.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
    const totalCustosVariaveis = custosVariaveis.reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
    const unidadesProduzidas = producao.reduce((sum: number, p: any) => sum + (p.unidades_calculadas || 0), 0);

    // Produtos com estoque crítico
    const produtosCriticos = produtos.filter((p: any) => 
      (p.estoque_atual || 0) < (p.estoque_minimo || 0)
    );

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

---

## 📊 DADOS ATUAIS DO NEGÓCIO
📅 Atualizado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}

---

### 👥 CLIENTES E PONTOS DE VENDA
- **Clientes diretos ativos:** ${clientesAtivos}
- **PDVs via distribuidores:** ${totalExpositores}
- **Total de PDVs:** ${totalPDVs}
- **Total cadastrados:** ${clientes.length}
- **Giro semanal estimado:** ${giroTotal} unidades

**Top 20 clientes por giro semanal:**
| Cliente | Giro/sem | Periodicidade | Status | Rota |
|---------|----------|---------------|--------|------|
${clientes.slice(0, 20).map((c: any) => 
  `| ${c.nome} | ${c.giro_medio_semanal || 0} | ${c.periodicidade_padrao || 7} dias | ${c.status_cliente} | ${rotasMap[c.rota_entrega_id] || '-'} |`
).join('\n')}

---

### 📦 ENTREGAS (últimas 4 semanas)
- **Total de entregas:** ${entregas.length}
- **Volume total:** ${volumeEntregas} unidades
- **Média por entrega:** ${entregas.length > 0 ? Math.round(volumeEntregas / entregas.length) : 0} unidades

**Últimos 10 dias com movimento:**
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
${produtosCriticos.length > 0 ? `⚠️ **${produtosCriticos.length} produto(s) abaixo do mínimo!**\n` : ''}
| Produto | Atual | Mínimo | Ideal | Preço | Status |
|---------|-------|--------|-------|-------|--------|
${produtos.map((p: any) => {
  const status = (p.estoque_atual || 0) < (p.estoque_minimo || 0) ? '🔴 Crítico' : 
                 (p.estoque_atual || 0) < (p.estoque_ideal || 0) ? '🟡 Baixo' : '🟢 OK';
  return `| ${p.nome} | ${p.estoque_atual || 0} | ${p.estoque_minimo || 0} | ${p.estoque_ideal || 0} | R$ ${p.preco_venda || 0} | ${status} |`;
}).join('\n')}

---

### 🧪 INSUMOS (matéria-prima)
| Insumo | Atual | Mínimo | Unidade | Custo Médio |
|--------|-------|--------|---------|-------------|
${insumos.slice(0, 20).map((i: any) => 
  `| ${i.nome} | ${i.estoque_atual || 0} | ${i.estoque_minimo || 0} | ${i.unidade_medida} | R$ ${i.custo_medio || 0} |`
).join('\n')}

---

### 🍞 PRODUÇÃO (última semana)
- **Total produzido:** ${unidadesProduzidas} unidades
- **Registros:** ${producao.length}

| Data | Produto | Unidades | Formas | Status |
|------|---------|----------|--------|--------|
${producao.slice(0, 15).map((p: any) => 
  `| ${new Date(p.data_producao).toLocaleDateString("pt-BR")} | ${p.produto_nome} | ${p.unidades_calculadas} | ${p.formas_producidas} | ${p.status} |`
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

### 🚚 ROTAS E REPRESENTANTES
**Rotas:** ${rotas.map((r: any) => r.nome).join(', ')}
**Representantes:** ${representantes.map((r: any) => r.nome).join(', ')}
`;

    console.log(`[agent-chat] Contexto carregado:`, {
      clientes: clientes.length,
      clientesAtivos,
      totalExpositores,
      totalPDVs,
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agenteId, messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurada");
    }

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

    const fullSystemPrompt = MISCHA_SYSTEM_PROMPT + contextData;

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
