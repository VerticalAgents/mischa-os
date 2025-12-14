import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// DEFINIÇÃO DAS FERRAMENTAS (TOOLS)
// ============================================================================

const AGENT_TOOLS = [
  // 1️⃣ Clientes sem entrega há X dias
  {
    type: "function",
    function: {
      name: "clientes_sem_entrega",
      description: "Lista clientes ativos que não recebem entrega há X dias. Use para identificar clientes inativos ou que precisam de atenção.",
      parameters: {
        type: "object",
        properties: {
          dias: { type: "number", description: "Número mínimo de dias sem entrega (default: 14)" },
          limite: { type: "number", description: "Máximo de resultados (default: 20)" }
        }
      }
    }
  },
  
  // 2️⃣ Previsão de reposição da semana
  {
    type: "function",
    function: {
      name: "previsao_reposicao",
      description: "Lista agendamentos de reposição para um período. Mostra clientes, quantidades e datas previstas.",
      parameters: {
        type: "object",
        properties: {
          dias_a_frente: { type: "number", description: "Quantos dias à frente consultar (default: 7)" },
          status: { type: "string", description: "Filtrar por status: 'Previsto', 'Agendado', ou 'todos' (default: 'todos')" }
        }
      }
    }
  },
  
  // 3️⃣ Performance por rota
  {
    type: "function",
    function: {
      name: "performance_rota",
      description: "Analisa performance de entregas por rota: volume, frequência, giro médio dos clientes de cada rota.",
      parameters: {
        type: "object",
        properties: {
          rota_nome: { type: "string", description: "Nome da rota (opcional, se vazio retorna todas)" },
          periodo_dias: { type: "number", description: "Período de análise em dias (default: 30)" }
        }
      }
    }
  },
  
  // 4️⃣ Necessidade de insumos
  {
    type: "function",
    function: {
      name: "necessidade_insumos",
      description: "Lista insumos/matéria-prima com estoque baixo ou crítico. Identifica o que precisa comprar.",
      parameters: {
        type: "object",
        properties: {
          apenas_criticos: { type: "boolean", description: "Mostrar apenas insumos abaixo do mínimo (default: false)" }
        }
      }
    }
  },
  
  // 5️⃣ Clientes em queda de giro
  {
    type: "function",
    function: {
      name: "clientes_em_queda",
      description: "Identifica clientes com queda significativa no giro comparando últimas 4 semanas com período anterior.",
      parameters: {
        type: "object",
        properties: {
          percentual_queda: { type: "number", description: "% mínimo de queda para alertar (default: 20)" },
          limite: { type: "number", description: "Máximo de resultados (default: 15)" }
        }
      }
    }
  },
  
  // 6️⃣ Ranking de representantes
  {
    type: "function",
    function: {
      name: "ranking_representantes",
      description: "Ranking de representantes por volume de vendas, número de clientes ativos e entregas realizadas.",
      parameters: {
        type: "object",
        properties: {
          periodo_dias: { type: "number", description: "Período de análise em dias (default: 30)" }
        }
      }
    }
  },
  
  // 7️⃣ Necessidade de produção
  {
    type: "function",
    function: {
      name: "necessidade_producao",
      description: "Calcula necessidade de produção por produto considerando estoque atual, mínimo e agendamentos futuros.",
      parameters: {
        type: "object",
        properties: {
          dias_a_frente: { type: "number", description: "Dias de agendamentos a considerar (default: 7)" },
          apenas_criticos: { type: "boolean", description: "Mostrar apenas produtos com necessidade urgente" }
        }
      }
    }
  },
  
  // 8️⃣ Clientes novos
  {
    type: "function",
    function: {
      name: "clientes_novos",
      description: "Lista clientes cadastrados recentemente com suas primeiras entregas e evolução.",
      parameters: {
        type: "object",
        properties: {
          periodo_dias: { type: "number", description: "Considerar últimos X dias (default: 30)" }
        }
      }
    }
  },
  
  // 9️⃣ Entregas atrasadas
  {
    type: "function",
    function: {
      name: "entregas_atrasadas",
      description: "Lista agendamentos que estão atrasados (data prevista já passou sem confirmação de entrega).",
      parameters: {
        type: "object",
        properties: {
          dias_atras: { type: "number", description: "Quantos dias para trás verificar (default: 7)" }
        }
      }
    }
  },
  
  // 🔟 Faturamento estimado
  {
    type: "function",
    function: {
      name: "faturamento_estimado",
      description: "Estima faturamento baseado em entregas realizadas e preços por categoria de cliente.",
      parameters: {
        type: "object",
        properties: {
          periodo_dias: { type: "number", description: "Período a analisar (default: 7)" },
          agrupar_por: { type: "string", description: "Agrupar por: 'dia', 'semana', 'cliente', 'rota' (default: 'dia')" }
        }
      }
    }
  },
  
  // 🔍 Buscar entregas
  {
    type: "function",
    function: {
      name: "buscar_entregas",
      description: "Busca entregas no histórico com filtros flexíveis. Use para consultas específicas sobre entregas de clientes.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome ou parte do nome do cliente" },
          data_inicio: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
          data_fim: { type: "string", description: "Data final (YYYY-MM-DD)" },
          limite: { type: "number", description: "Máximo de resultados (default: 20)" }
        }
      }
    }
  },
  
  // 🔍 Calcular giro de cliente específico
  {
    type: "function",
    function: {
      name: "calcular_giro_cliente",
      description: "Calcula giro real histórico de um cliente específico baseado nas últimas 12 semanas de entregas.",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente" }
        },
        required: ["cliente_nome"]
      }
    }
  }
];

// ============================================================================
// HANDLERS DAS FERRAMENTAS
// ============================================================================

async function executarTool(supabase: any, toolName: string, args: any): Promise<string> {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  
  console.log(`[agent-chat] Executando tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      // 1️⃣ Clientes sem entrega
      case "clientes_sem_entrega": {
        const dias = args.dias || 14;
        const limite = args.limite || 20;
        const dataLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, ultima_data_reposicao_efetiva, status_cliente, rota_entrega_id")
          .eq("ativo", true)
          .order("ultima_data_reposicao_efetiva", { ascending: true, nullsFirst: true });
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        
        const resultado = clientes?.filter((c: any) => {
          if (!c.ultima_data_reposicao_efetiva) return true;
          return new Date(c.ultima_data_reposicao_efetiva) < new Date(dataLimite);
        }).slice(0, limite).map((c: any) => ({
          cliente: c.nome,
          ultima_entrega: c.ultima_data_reposicao_efetiva 
            ? new Date(c.ultima_data_reposicao_efetiva).toLocaleDateString('pt-BR')
            : 'Nunca recebeu',
          dias_sem_entrega: c.ultima_data_reposicao_efetiva
            ? Math.ceil((hoje.getTime() - new Date(c.ultima_data_reposicao_efetiva).getTime()) / (1000*60*60*24))
            : 999,
          rota: rotasMap[c.rota_entrega_id] || '-',
          status: c.status_cliente
        }));
        
        return JSON.stringify({ 
          total_encontrados: resultado?.length || 0, 
          clientes: resultado || [],
          filtro_dias: dias
        });
      }
      
      // 2️⃣ Previsão de reposição
      case "previsao_reposicao": {
        const diasAFrente = args.dias_a_frente || 7;
        const dataFim = new Date(Date.now() + diasAFrente * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let query = supabase
          .from("agendamentos_clientes")
          .select("cliente_id, data_proxima_reposicao, quantidade_total, status_agendamento, tipo_pedido")
          .gte("data_proxima_reposicao", hojeStr)
          .lte("data_proxima_reposicao", dataFim)
          .order("data_proxima_reposicao");
        
        if (args.status && args.status !== 'todos') {
          query = query.eq("status_agendamento", args.status);
        }
        
        const { data: agendamentos } = await query;
        
        const clienteIds = [...new Set(agendamentos?.map((a: any) => a.cliente_id) || [])];
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, rota_entrega_id")
          .in("id", clienteIds);
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        const clienteMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c]) || []);
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        
        const resultado = agendamentos?.map((a: any) => {
          const cliente = clienteMap[a.cliente_id];
          return {
            cliente: cliente?.nome || 'Desconhecido',
            data: new Date(a.data_proxima_reposicao).toLocaleDateString('pt-BR'),
            quantidade: a.quantidade_total,
            status: a.status_agendamento,
            tipo: a.tipo_pedido,
            rota: rotasMap[cliente?.rota_entrega_id] || '-'
          };
        });
        
        const volumeTotal = resultado?.reduce((s: number, a: any) => s + a.quantidade, 0) || 0;
        
        return JSON.stringify({
          periodo: `próximos ${diasAFrente} dias`,
          total_agendamentos: resultado?.length || 0,
          volume_total: volumeTotal,
          agendamentos: resultado || []
        });
      }
      
      // 3️⃣ Performance por rota
      case "performance_rota": {
        const periodoDias = args.periodo_dias || 30;
        const dataInicio = new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome").eq("ativo", true);
        const { data: clientes } = await supabase.from("clientes").select("id, nome, rota_entrega_id, giro_medio_semanal, ativo");
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("cliente_id, quantidade, data")
          .eq("tipo", "entrega")
          .gte("data", dataInicio);
        
        const clienteRotaMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c.rota_entrega_id]) || []);
        
        const performancePorRota = rotas?.map((rota: any) => {
          const clientesRota = clientes?.filter((c: any) => c.rota_entrega_id === rota.id && c.ativo) || [];
          const entregasRota = entregas?.filter((e: any) => clienteRotaMap[e.cliente_id] === rota.id) || [];
          const volumeTotal = entregasRota.reduce((s: number, e: any) => s + (e.quantidade || 0), 0);
          const giroMedio = clientesRota.length > 0 
            ? Math.round(clientesRota.reduce((s: number, c: any) => s + (c.giro_medio_semanal || 0), 0) / clientesRota.length)
            : 0;
          
          return {
            rota: rota.nome,
            clientes_ativos: clientesRota.length,
            entregas_periodo: entregasRota.length,
            volume_total: volumeTotal,
            giro_medio_cliente: giroMedio
          };
        }).filter((r: any) => !args.rota_nome || r.rota.toLowerCase().includes(args.rota_nome.toLowerCase()));
        
        return JSON.stringify({
          periodo_dias: periodoDias,
          rotas: performancePorRota?.sort((a: any, b: any) => b.volume_total - a.volume_total) || []
        });
      }
      
      // 4️⃣ Necessidade de insumos
      case "necessidade_insumos": {
        const { data: insumos } = await supabase
          .from("insumos")
          .select("id, nome, estoque_atual, estoque_minimo, estoque_ideal, custo_medio, unidade_medida")
          .order("nome");
        
        let resultado = insumos?.map((i: any) => {
          const atual = i.estoque_atual || 0;
          const minimo = i.estoque_minimo || 0;
          const ideal = i.estoque_ideal || minimo * 1.5;
          const status = atual < minimo ? '🔴 Crítico' : atual < ideal ? '🟡 Baixo' : '🟢 OK';
          const comprar = atual < ideal ? Math.ceil(ideal - atual) : 0;
          
          return {
            insumo: i.nome,
            atual,
            minimo,
            ideal: Math.round(ideal),
            unidade: i.unidade_medida,
            status,
            quantidade_comprar: comprar,
            custo_estimado: comprar * (i.custo_medio || 0)
          };
        }) || [];
        
        if (args.apenas_criticos) {
          resultado = resultado.filter((i: any) => i.status === '🔴 Crítico');
        }
        
        const custoTotal = resultado.reduce((s: number, i: any) => s + i.custo_estimado, 0);
        
        return JSON.stringify({
          total_insumos: resultado.length,
          criticos: resultado.filter((i: any) => i.status === '🔴 Crítico').length,
          custo_estimado_total: custoTotal.toFixed(2),
          insumos: resultado.sort((a: any, b: any) => b.quantidade_comprar - a.quantidade_comprar)
        });
      }
      
      // 5️⃣ Clientes em queda
      case "clientes_em_queda": {
        const percentualQueda = args.percentual_queda || 20;
        const limite = args.limite || 15;
        
        const data4Semanas = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
        const data8Semanas = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("cliente_id, quantidade, data")
          .eq("tipo", "entrega")
          .gte("data", data8Semanas);
        
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, rota_entrega_id, ativo")
          .eq("ativo", true);
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        const clienteMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c]) || []);
        
        // Calcular giro por período
        const giroPorCliente: Record<string, { recente: number; anterior: number }> = {};
        
        entregas?.forEach((e: any) => {
          if (!e.cliente_id) return;
          if (!giroPorCliente[e.cliente_id]) {
            giroPorCliente[e.cliente_id] = { recente: 0, anterior: 0 };
          }
          const dataEntrega = new Date(e.data);
          const data4SemanasDate = new Date(data4Semanas);
          
          if (dataEntrega >= data4SemanasDate) {
            giroPorCliente[e.cliente_id].recente += e.quantidade || 0;
          } else {
            giroPorCliente[e.cliente_id].anterior += e.quantidade || 0;
          }
        });
        
        const clientesEmQueda = Object.entries(giroPorCliente)
          .map(([clienteId, giros]) => {
            const cliente = clienteMap[clienteId];
            if (!cliente || giros.anterior === 0) return null;
            
            const variacao = ((giros.recente - giros.anterior) / giros.anterior) * 100;
            if (variacao > -percentualQueda) return null;
            
            return {
              cliente: cliente.nome,
              giro_4_semanas_anterior: giros.anterior,
              giro_4_semanas_recente: giros.recente,
              variacao_percentual: variacao.toFixed(1) + '%',
              rota: rotasMap[cliente.rota_entrega_id] || '-'
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => parseFloat(a.variacao_percentual) - parseFloat(b.variacao_percentual))
          .slice(0, limite);
        
        return JSON.stringify({
          criterio_queda: `-${percentualQueda}%`,
          total_encontrados: clientesEmQueda.length,
          clientes: clientesEmQueda
        });
      }
      
      // 6️⃣ Ranking de representantes
      case "ranking_representantes": {
        const periodoDias = args.periodo_dias || 30;
        const dataInicio = new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: representantes } = await supabase.from("representantes").select("id, nome").eq("ativo", true);
        const { data: clientes } = await supabase.from("clientes").select("id, representante_id, ativo");
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("cliente_id, quantidade, data")
          .eq("tipo", "entrega")
          .gte("data", dataInicio);
        
        const clienteRepMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c]) || []);
        
        const ranking = representantes?.map((rep: any) => {
          const clientesRep = clientes?.filter((c: any) => c.representante_id === rep.id) || [];
          const clientesAtivos = clientesRep.filter((c: any) => c.ativo);
          const entregasRep = entregas?.filter((e: any) => clienteRepMap[e.cliente_id]?.representante_id === rep.id) || [];
          const volumeTotal = entregasRep.reduce((s: number, e: any) => s + (e.quantidade || 0), 0);
          
          return {
            representante: rep.nome,
            clientes_total: clientesRep.length,
            clientes_ativos: clientesAtivos.length,
            entregas_periodo: entregasRep.length,
            volume_total: volumeTotal
          };
        }).sort((a: any, b: any) => b.volume_total - a.volume_total);
        
        return JSON.stringify({
          periodo_dias: periodoDias,
          ranking: ranking || []
        });
      }
      
      // 7️⃣ Necessidade de produção
      case "necessidade_producao": {
        const diasAFrente = args.dias_a_frente || 7;
        const dataFim = new Date(Date.now() + diasAFrente * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data: produtos } = await supabase
          .from("produtos_finais")
          .select("id, nome, estoque_atual, estoque_minimo, estoque_ideal, unidades_producao")
          .eq("ativo", true);
        
        const { data: agendamentos } = await supabase
          .from("agendamentos_clientes")
          .select("quantidade_total, itens_personalizados, tipo_pedido")
          .gte("data_proxima_reposicao", hojeStr)
          .lte("data_proxima_reposicao", dataFim);
        
        const { data: proporcoes } = await supabase
          .from("proporcoes_padrao")
          .select("produto_id, percentual")
          .eq("ativo", true);
        
        const proporcaoMap = Object.fromEntries(proporcoes?.map((p: any) => [p.produto_id, p.percentual]) || []);
        
        // Calcular demanda por produto
        const demandaPorProduto: Record<string, number> = {};
        
        agendamentos?.forEach((a: any) => {
          if (a.tipo_pedido === 'Alterado' && a.itens_personalizados) {
            try {
              const itens = typeof a.itens_personalizados === 'string' 
                ? JSON.parse(a.itens_personalizados) 
                : a.itens_personalizados;
              itens.forEach((item: any) => {
                const produtoId = item.produto_id;
                if (produtoId) {
                  demandaPorProduto[produtoId] = (demandaPorProduto[produtoId] || 0) + (item.quantidade || 0);
                }
              });
            } catch {}
          } else {
            // Distribuir por proporções
            const total = a.quantidade_total || 0;
            produtos?.forEach((p: any) => {
              const percentual = proporcaoMap[p.id] || 0;
              if (percentual > 0) {
                demandaPorProduto[p.id] = (demandaPorProduto[p.id] || 0) + Math.round(total * percentual / 100);
              }
            });
          }
        });
        
        let resultado = produtos?.map((p: any) => {
          const atual = p.estoque_atual || 0;
          const minimo = p.estoque_minimo || 0;
          const ideal = p.estoque_ideal || minimo * 1.5;
          const demanda = demandaPorProduto[p.id] || 0;
          const saldoAposDemanda = atual - demanda;
          const necessidade = saldoAposDemanda < minimo ? Math.ceil(ideal - saldoAposDemanda) : 0;
          const formas = p.unidades_producao > 0 ? Math.ceil(necessidade / p.unidades_producao) : 0;
          
          return {
            produto: p.nome,
            estoque_atual: atual,
            demanda_periodo: demanda,
            saldo_apos_demanda: saldoAposDemanda,
            necessidade_producao: necessidade,
            formas_sugeridas: formas,
            status: saldoAposDemanda < minimo ? '🔴 Produzir' : saldoAposDemanda < ideal ? '🟡 Monitorar' : '🟢 OK'
          };
        }) || [];
        
        if (args.apenas_criticos) {
          resultado = resultado.filter((p: any) => p.status === '🔴 Produzir');
        }
        
        return JSON.stringify({
          periodo_dias: diasAFrente,
          produtos_criticos: resultado.filter((p: any) => p.status === '🔴 Produzir').length,
          total_formas_sugeridas: resultado.reduce((s: number, p: any) => s + p.formas_sugeridas, 0),
          produtos: resultado.sort((a: any, b: any) => b.necessidade_producao - a.necessidade_producao)
        });
      }
      
      // 8️⃣ Clientes novos
      case "clientes_novos": {
        const periodoDias = args.periodo_dias || 30;
        const dataInicio = new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();
        
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, created_at, status_cliente, rota_entrega_id, representante_id")
          .gte("created_at", dataInicio)
          .order("created_at", { ascending: false });
        
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("cliente_id, quantidade, data")
          .eq("tipo", "entrega")
          .in("cliente_id", clientes?.map((c: any) => c.id) || []);
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        const { data: reps } = await supabase.from("representantes").select("id, nome");
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        const repsMap = Object.fromEntries(reps?.map((r: any) => [r.id, r.nome]) || []);
        
        const resultado = clientes?.map((c: any) => {
          const entregasCliente = entregas?.filter((e: any) => e.cliente_id === c.id) || [];
          const totalEntregue = entregasCliente.reduce((s: number, e: any) => s + (e.quantidade || 0), 0);
          
          return {
            cliente: c.nome,
            cadastrado_em: new Date(c.created_at).toLocaleDateString('pt-BR'),
            status: c.status_cliente,
            rota: rotasMap[c.rota_entrega_id] || '-',
            representante: repsMap[c.representante_id] || '-',
            entregas_realizadas: entregasCliente.length,
            volume_total: totalEntregue
          };
        });
        
        return JSON.stringify({
          periodo_dias: periodoDias,
          total_novos: resultado?.length || 0,
          clientes: resultado || []
        });
      }
      
      // 9️⃣ Entregas atrasadas
      case "entregas_atrasadas": {
        const diasAtras = args.dias_atras || 7;
        const dataLimite = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { data: agendamentos } = await supabase
          .from("agendamentos_clientes")
          .select("cliente_id, data_proxima_reposicao, quantidade_total, status_agendamento")
          .lt("data_proxima_reposicao", hojeStr)
          .gte("data_proxima_reposicao", dataLimite)
          .in("status_agendamento", ["Previsto", "Agendado"])
          .order("data_proxima_reposicao");
        
        const clienteIds = [...new Set(agendamentos?.map((a: any) => a.cliente_id) || [])];
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, rota_entrega_id, contato_telefone")
          .in("id", clienteIds);
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        const clienteMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c]) || []);
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        
        const resultado = agendamentos?.map((a: any) => {
          const cliente = clienteMap[a.cliente_id];
          const diasAtraso = Math.ceil((hoje.getTime() - new Date(a.data_proxima_reposicao).getTime()) / (1000*60*60*24));
          
          return {
            cliente: cliente?.nome || 'Desconhecido',
            data_prevista: new Date(a.data_proxima_reposicao).toLocaleDateString('pt-BR'),
            dias_atraso: diasAtraso,
            quantidade: a.quantidade_total,
            status: a.status_agendamento,
            rota: rotasMap[cliente?.rota_entrega_id] || '-'
          };
        });
        
        return JSON.stringify({
          periodo_verificado: `últimos ${diasAtras} dias`,
          total_atrasados: resultado?.length || 0,
          volume_atrasado: resultado?.reduce((s: number, a: any) => s + a.quantidade, 0) || 0,
          agendamentos: resultado?.sort((a: any, b: any) => b.dias_atraso - a.dias_atraso) || []
        });
      }
      
      // 🔟 Faturamento estimado
      case "faturamento_estimado": {
        const periodoDias = args.periodo_dias || 7;
        const agruparPor = args.agrupar_por || 'dia';
        const dataInicio = new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();
        
        // 1. Buscar entregas com itens
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("cliente_id, quantidade, data, itens")
          .eq("tipo", "entrega")
          .gte("data", dataInicio);
        
        // 2. Buscar clientes e rotas
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome, rota_entrega_id");
        
        const { data: rotas } = await supabase.from("rotas_entrega").select("id, nome");
        
        // 3. Buscar produtos e suas categorias
        const { data: produtos } = await supabase
          .from("produtos_finais")
          .select("id, nome, categoria_id");
        
        // 4. Buscar preços personalizados (cliente + categoria)
        const { data: precosPersonalizados } = await supabase
          .from("precos_categoria_cliente")
          .select("cliente_id, categoria_id, preco_unitario");
        
        // 5. Buscar preços padrão da configuração
        const { data: configPrecos } = await supabase
          .from("configuracoes_sistema")
          .select("configuracoes")
          .eq("modulo", "precificacao")
          .limit(1);
        
        const precosPadrao = configPrecos?.[0]?.configuracoes?.precosPorCategoria || {};
        const precoFallback = 4.50;
        
        // Mapas auxiliares
        const clienteMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c]) || []);
        const rotasMap = Object.fromEntries(rotas?.map((r: any) => [r.id, r.nome]) || []);
        const produtoMap = Object.fromEntries(produtos?.map((p: any) => [p.id, p]) || []);
        
        // Mapa de preços personalizados: chave = "clienteId_categoriaId"
        const precosClienteCategoriaMap: Record<string, number> = {};
        precosPersonalizados?.forEach((p: any) => {
          precosClienteCategoriaMap[`${p.cliente_id}_${p.categoria_id}`] = p.preco_unitario;
        });
        
        // Função para obter preço correto
        const obterPreco = (clienteId: string, categoriaId: number): number => {
          // 1. Preço personalizado por cliente/categoria
          const chave = `${clienteId}_${categoriaId}`;
          if (precosClienteCategoriaMap[chave]) {
            return precosClienteCategoriaMap[chave];
          }
          // 2. Preço padrão por categoria (da configuração)
          if (precosPadrao[categoriaId]) {
            return parseFloat(precosPadrao[categoriaId]);
          }
          // 3. Fallback
          return precoFallback;
        };
        
        // Calcular faturamento por entrega com preços por categoria
        const faturamentos = entregas?.map((e: any) => {
          const cliente = clienteMap[e.cliente_id];
          let valorTotal = 0;
          
          // Processar itens se existirem
          if (e.itens && Array.isArray(e.itens) && e.itens.length > 0) {
            e.itens.forEach((item: any) => {
              const produto = produtoMap[item.produto_id];
              const categoriaId = produto?.categoria_id || 1;
              const preco = obterPreco(e.cliente_id, categoriaId);
              valorTotal += (item.quantidade || 0) * preco;
            });
          } else {
            // Fallback: usar quantidade total com preço médio (categoria 1)
            const precoMedio = obterPreco(e.cliente_id, 1);
            valorTotal = (e.quantidade || 0) * precoMedio;
          }
          
          return {
            data: e.data.split('T')[0],
            cliente_id: e.cliente_id,
            cliente: cliente?.nome || 'Desconhecido',
            rota: rotasMap[cliente?.rota_entrega_id] || '-',
            quantidade: e.quantidade,
            valor: valorTotal
          };
        }) || [];
        
        const faturamentoTotal = faturamentos.reduce((s: number, f: any) => s + f.valor, 0);
        
        // Agrupar conforme solicitado
        let agrupado: any = {};
        faturamentos.forEach((f: any) => {
          let chave = '';
          switch (agruparPor) {
            case 'cliente': chave = f.cliente; break;
            case 'rota': chave = f.rota; break;
            case 'semana': 
              const d = new Date(f.data);
              const inicioSemana = new Date(d);
              inicioSemana.setDate(d.getDate() - d.getDay());
              chave = inicioSemana.toLocaleDateString('pt-BR');
              break;
            default: chave = new Date(f.data).toLocaleDateString('pt-BR');
          }
          if (!agrupado[chave]) agrupado[chave] = { volume: 0, valor: 0, entregas: 0 };
          agrupado[chave].volume += f.quantidade;
          agrupado[chave].valor += f.valor;
          agrupado[chave].entregas++;
        });
        
        const resumoAgrupado = Object.entries(agrupado).map(([chave, dados]: [string, any]) => ({
          [agruparPor]: chave,
          entregas: dados.entregas,
          volume: dados.volume,
          valor: `R$ ${dados.valor.toFixed(2)}`
        }));
        
        return JSON.stringify({
          periodo_dias: periodoDias,
          faturamento_total: `R$ ${faturamentoTotal.toFixed(2)}`,
          total_entregas: faturamentos.length,
          volume_total: faturamentos.reduce((s: number, f: any) => s + f.quantidade, 0),
          agrupado_por: agruparPor,
          detalhamento: resumoAgrupado.sort((a: any, b: any) => 
            parseFloat(b.valor.replace('R$ ', '')) - parseFloat(a.valor.replace('R$ ', ''))
          )
        });
      }
      
      // 🔍 Buscar entregas
      case "buscar_entregas": {
        const limite = args.limite || 20;
        
        let query = supabase
          .from("historico_entregas")
          .select("cliente_id, data, quantidade, tipo, observacao")
          .eq("tipo", "entrega")
          .order("data", { ascending: false })
          .limit(limite);
        
        if (args.data_inicio) {
          query = query.gte("data", args.data_inicio);
        }
        if (args.data_fim) {
          query = query.lte("data", args.data_fim);
        }
        
        const { data: entregas } = await query;
        
        // Buscar nomes de clientes
        const clienteIds = [...new Set(entregas?.map((e: any) => e.cliente_id) || [])];
        const { data: clientes } = await supabase
          .from("clientes")
          .select("id, nome")
          .in("id", clienteIds);
        
        const clienteMap = Object.fromEntries(clientes?.map((c: any) => [c.id, c.nome]) || []);
        
        // Filtrar por nome se especificado
        let resultado = entregas?.map((e: any) => ({
          cliente: clienteMap[e.cliente_id] || 'Desconhecido',
          data: new Date(e.data).toLocaleDateString('pt-BR'),
          quantidade: e.quantidade,
          observacao: e.observacao || ''
        })) || [];
        
        if (args.cliente_nome) {
          resultado = resultado.filter((e: any) => 
            e.cliente.toLowerCase().includes(args.cliente_nome.toLowerCase())
          );
        }
        
        return JSON.stringify({
          total_encontradas: resultado.length,
          entregas: resultado
        });
      }
      
      // 🔍 Calcular giro de cliente
      case "calcular_giro_cliente": {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("id, nome, status_cliente, ativo, quantidade_padrao, periodicidade_padrao")
          .ilike("nome", `%${args.cliente_nome}%`)
          .limit(1)
          .single();
        
        if (!cliente) {
          return JSON.stringify({ erro: `Cliente "${args.cliente_nome}" não encontrado` });
        }
        
        const data84Dias = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();
        const { data: entregas } = await supabase
          .from("historico_entregas")
          .select("data, quantidade")
          .eq("cliente_id", cliente.id)
          .eq("tipo", "entrega")
          .gte("data", data84Dias)
          .order("data", { ascending: true });
        
        const totalUnidades = entregas?.reduce((sum: number, e: any) => sum + (e.quantidade || 0), 0) || 0;
        
        let semanasConsideradas = 12;
        if (entregas && entregas.length > 0) {
          const primeiraData = new Date(entregas[0].data);
          const diasDesde = Math.ceil((hoje.getTime() - primeiraData.getTime()) / (1000*60*60*24));
          semanasConsideradas = Math.max(1, Math.min(12, Math.ceil(diasDesde / 7)));
        }
        
        const giroSemanal = entregas && entregas.length > 0 
          ? Math.round(totalUnidades / semanasConsideradas)
          : 0;
        
        return JSON.stringify({
          cliente: cliente.nome,
          status: cliente.status_cliente,
          ativo: cliente.ativo,
          giro_semanal_real: giroSemanal,
          total_entregas: entregas?.length || 0,
          total_unidades_12_semanas: totalUnidades,
          semanas_consideradas: semanasConsideradas,
          quantidade_padrao: cliente.quantidade_padrao,
          periodicidade_dias: cliente.periodicidade_padrao,
          entregas_recentes: entregas?.slice(-5).map((e: any) => ({
            data: new Date(e.data).toLocaleDateString('pt-BR'),
            quantidade: e.quantidade
          }))
        });
      }
      
      default:
        return JSON.stringify({ erro: `Ferramenta "${toolName}" não encontrada` });
    }
  } catch (error) {
    console.error(`[agent-chat] Erro na tool ${toolName}:`, error);
    return JSON.stringify({ erro: `Erro ao executar ${toolName}: ${error.message}` });
  }
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

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

## 🔧 FERRAMENTAS DISPONÍVEIS

Você tem acesso a ferramentas para consultar dados em tempo real. **SEMPRE use as ferramentas quando a pergunta exigir dados específicos ou filtrados:**

| Ferramenta | Quando Usar |
|------------|-------------|
| \`clientes_sem_entrega\` | Para identificar clientes inativos |
| \`previsao_reposicao\` | Para ver agendamentos futuros |
| \`performance_rota\` | Para analisar rotas de entrega |
| \`necessidade_insumos\` | Para verificar o que comprar |
| \`clientes_em_queda\` | Para detectar quedas de performance |
| \`ranking_representantes\` | Para comparar vendedores |
| \`necessidade_producao\` | Para planejar produção |
| \`clientes_novos\` | Para acompanhar novos clientes |
| \`entregas_atrasadas\` | Para identificar atrasos |
| \`faturamento_estimado\` | Para projetar receita |
| \`buscar_entregas\` | Para consultas específicas de histórico |
| \`calcular_giro_cliente\` | Para giro de cliente específico |

## 📊 INTERPRETAÇÃO DE MÉTRICAS

- **Clientes ativos** = clientes com status "ATIVO" e campo ativo=true
- **PDVs** = Clientes diretos ativos + Expositores de distribuidores
- **Giro semanal** = média de unidades vendidas/entregues por semana (baseado em entregas reais)
- **Agendamentos** = entregas planejadas ainda não realizadas

## ✅ EXEMPLOS

**Pergunta:** "Quais clientes não recebem há 15 dias?"
→ Use a ferramenta \`clientes_sem_entrega\` com dias=15

**Pergunta:** "O que preciso produzir essa semana?"
→ Use a ferramenta \`necessidade_producao\` com dias_a_frente=7

**Pergunta:** "Qual o giro do DCE UFCSPA?"
→ Use a ferramenta \`calcular_giro_cliente\` com cliente_nome="DCE UFCSPA"

**Pergunta:** "Quanto faturamos na última semana?"
→ Use a ferramenta \`faturamento_estimado\` com periodo_dias=7

## ⚠️ LIMITAÇÕES

- Você NÃO pode alterar dados, apenas consultar e analisar
- Se perguntarem sobre funções que não existem no sistema, sugira contatar o suporte
- Se os dados parecerem inconsistentes, mencione isso na resposta
- Se não souber algo, diga claramente em vez de inventar

## 📝 FORMATO PREFERIDO

Para listas de clientes/produtos, use tabelas markdown quando houver mais de 3 colunas.
Para rankings curtos (top 3-5), use listas numeradas.
Para alertas, use emojis de status: 🔴 Crítico, 🟡 Atenção, 🟢 OK
`;

// ============================================================================
// CONTEXTO BASE (métricas gerais)
// ============================================================================

async function getBaseContext(supabase: any): Promise<string> {
  try {
    const [
      { data: clientes },
      { data: distribuidores },
      { data: produtos },
      { data: agendamentosHoje }
    ] = await Promise.all([
      supabase.from("clientes").select("id, ativo, status_cliente").eq("ativo", true),
      supabase.from("distribuidores_expositores").select("numero_expositores"),
      supabase.from("produtos_finais").select("id, nome, estoque_atual, estoque_minimo").eq("ativo", true),
      supabase.from("agendamentos_clientes")
        .select("id")
        .eq("data_proxima_reposicao", new Date().toISOString().split('T')[0])
    ]);
    
    const clientesAtivos = clientes?.filter((c: any) => 
      c.ativo === true && c.status_cliente?.toUpperCase() === "ATIVO"
    ).length || 0;
    
    const totalExpositores = distribuidores?.reduce((s: number, d: any) => s + (d.numero_expositores || 0), 0) || 0;
    const totalPDVs = clientesAtivos + totalExpositores;
    
    const produtosCriticos = produtos?.filter((p: any) => 
      (p.estoque_atual || 0) < (p.estoque_minimo || 0)
    ).length || 0;
    
    return `
---
📅 **Data atual:** ${new Date().toLocaleDateString("pt-BR")}

**Resumo rápido:**
- Clientes ativos: ${clientesAtivos}
- PDVs totais: ${totalPDVs} (${clientesAtivos} diretos + ${totalExpositores} via distribuidores)
- Agendamentos hoje: ${agendamentosHoje?.length || 0}
- Produtos com estoque crítico: ${produtosCriticos}

Use as ferramentas disponíveis para consultas detalhadas.
---
`;
  } catch (error) {
    console.error("[agent-chat] Erro ao buscar contexto base:", error);
    return "";
  }
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração do Supabase não encontrada");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar contexto base (resumo rápido)
    const baseContext = await getBaseContext(supabase);
    const fullSystemPrompt = MISCHA_SYSTEM_PROMPT + baseContext;

    console.log(`[agent-chat] Agente: ${agenteId}, Mensagens: ${messages.length}`);

    // Preparar mensagens com system prompt
    let conversationMessages = [
      { role: "system", content: fullSystemPrompt },
      ...messages,
    ];

    // Loop de execução com tool calls
    let maxIterations = 5;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      iteration++;
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversationMessages,
          tools: AGENT_TOOLS,
          tool_choice: "auto",
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
            JSON.stringify({ error: "Créditos insuficientes. Verifique sua conta." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      
      if (!message) {
        throw new Error("Resposta inválida da API");
      }

      // Se não há tool calls, retornar resposta final
      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.log(`[agent-chat] Resposta final após ${iteration} iteração(ões)`);
        
        return new Response(
          JSON.stringify({ content: message.content }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Executar tool calls
      console.log(`[agent-chat] Iteração ${iteration}: Executando ${message.tool_calls.length} ferramenta(s)`);
      
      const toolResults = [];
      for (const toolCall of message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          args = {};
        }
        
        const result = await executarTool(supabase, toolCall.function.name, args);
        
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result
        });
      }

      // Adicionar resultados e continuar
      conversationMessages.push(message);
      conversationMessages.push(...toolResults);
    }

    // Se chegou ao limite de iterações
    console.log(`[agent-chat] Atingiu limite de ${maxIterations} iterações`);
    return new Response(
      JSON.stringify({ content: "Desculpe, não consegui processar sua solicitação completamente. Tente reformular a pergunta." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[agent-chat] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
