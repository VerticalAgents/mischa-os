import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subWeeks } from 'date-fns';
import { Cliente } from '@/types';
import { useSupabasePrecosCategoriaCliente } from './useSupabasePrecosCategoriaCliente';

interface PrecoCategoriaInfo {
  categoriaId: number;
  categoriaNome: string;
  precoUnitario: number;
  fonte: 'personalizado' | 'padrao';
}

interface QuantidadeMediaProduto {
  produtoId: string;
  produtoNome: string;
  categoriaId: number | null;
  quantidadeTotal12Semanas: number; // Total no período analisado (até 12 semanas)
  quantidadeMediaSemanal: number;   // Média baseada no período real do cliente
}

interface CustoCategoria {
  categoriaId: number;
  categoriaNome: string;
  custoMedio: number;
}

interface ResumoFinanceiroMensal {
  faturamentoMedio: number;
  custoLogistico: number;
  impostoEstimado: number;
  taxaBoleto: number;
  quantidadeEntregasMes: number;
  custoProdutos: number;
  totalCustosOperacionais: number;
  margemBruta: number;
  margemBrutaPercentual: number;
}

interface DadosFinanceirosCliente {
  precosCategoria: PrecoCategoriaInfo[];
  quantidadesMedias: QuantidadeMediaProduto[];
  custosCategoria: CustoCategoria[];
  resumoMensal: ResumoFinanceiroMensal;
}

const CUSTO_POR_ENTREGA = 15.00;
const TAXA_BOLETO = 2.19;
const ALIQUOTA_SIMPLES = 0.04;
const SEMANAS_POR_MES = 4.33;

// Custos de referência confiáveis (valores manuais corretos)
const CUSTOS_REFERENCIA: Record<string, number> = {
  'Brownie Avelã': 1.68,
  'Brownie Choco Duo': 1.42,
  'Brownie Oreo Cream': 1.45,
  'Brownie Stikadinho': 1.63,
  'Brownie Tradicional': 1.11,
  'Brownie Meio Amargo': 1.19,
  'Brownie Pistache': 2.76,
  'Brownie Nesquik': 1.50,
};

export function useClienteFinanceiro(cliente: Cliente) {
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  
  const { data: dadosFinanceiros, isLoading, error, refetch } = useQuery({
    queryKey: ['cliente-financeiro', cliente.id, cliente.emiteNotaFiscal, cliente.formaPagamento, cliente.tipoLogistica],
    queryFn: async () => {
      console.log('useClienteFinanceiro: Calculando dados financeiros para cliente', cliente.id);
      
      // 1. Buscar dados das últimas 12 semanas
      const dataInicio = subWeeks(new Date(), 12);
      
      // Buscar entregas
      const { data: entregas, error: errorEntregas } = await supabase
        .from('historico_entregas')
        .select('data, quantidade, itens')
        .eq('cliente_id', cliente.id)
        .eq('tipo', 'entrega')
        .gte('data', dataInicio.toISOString());
      
      if (errorEntregas) {
        console.error('Erro ao buscar entregas:', errorEntregas);
        throw errorEntregas;
      }
      
      console.log('useClienteFinanceiro: Entregas carregadas:', entregas?.length || 0);
      
      // Calcular número de semanas desde a primeira entrega
      let numeroSemanasReais = 12; // Valor padrão

      if (entregas && entregas.length > 0) {
        // Encontrar a data da primeira entrega
        const datasEntregas = entregas.map(e => new Date(e.data));
        const primeiraEntrega = new Date(Math.min(...datasEntregas.map(d => d.getTime())));
        const hoje = new Date();
        
        // Calcular diferença em semanas (arredondar para cima)
        const diferencaMilissegundos = hoje.getTime() - primeiraEntrega.getTime();
        const diferencaSemanas = Math.ceil(diferencaMilissegundos / (1000 * 60 * 60 * 24 * 7));
        
        // Usar no mínimo 1 semana e no máximo 12 semanas
        numeroSemanasReais = Math.max(1, Math.min(12, diferencaSemanas));
        
        console.log('📅 [Período Real] Cliente:', {
          nome: cliente.nome,
          primeiraEntrega: primeiraEntrega.toISOString().split('T')[0],
          semanasReais: numeroSemanasReais,
          totalEntregas: entregas.length
        });
      }
      
      // 2. Buscar categorias habilitadas
      const categoriasHabilitadas = cliente.categoriasHabilitadas || [];
      
      if (categoriasHabilitadas.length === 0) {
        console.log('useClienteFinanceiro: Nenhuma categoria habilitada');
        return {
          precosCategoria: [],
          quantidadesMedias: [],
          custosCategoria: [],
          resumoMensal: {
            faturamentoMedio: 0,
            custoLogistico: 0,
            impostoEstimado: 0,
            taxaBoleto: 0,
            quantidadeEntregasMes: 0,
            custoProdutos: 0,
            totalCustosOperacionais: 0,
            margemBruta: 0,
            margemBrutaPercentual: 0
          }
        };
      }
      
      // 3. Buscar dados das categorias
      const { data: categorias, error: errorCategorias } = await supabase
        .from('categorias_produto')
        .select('id, nome')
        .in('id', categoriasHabilitadas);
      
      if (errorCategorias) {
        console.error('Erro ao buscar categorias:', errorCategorias);
        throw errorCategorias;
      }
      
      // 4. Buscar preços personalizados do cliente
      const precosPersonalizados = await carregarPrecosPorCliente(cliente.id);
      
      // 5. Buscar configurações de preços padrão
      const { data: configPrecos, error: errorConfig } = await supabase
        .from('configuracoes_sistema')
        .select('configuracoes')
        .eq('modulo', 'precificacao')
        .single();
      
      if (errorConfig && errorConfig.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações de preços:', errorConfig);
      }
      
      const precosPadrao = (configPrecos?.configuracoes as any)?.precosPorCategoria || {};
      
      // 6. Buscar produtos para calcular custos
      const { data: produtos, error: errorProdutos } = await supabase
        .from('produtos_finais')
        .select('id, nome, categoria_id, custo_unitario');
      
      if (errorProdutos) {
        console.error('Erro ao buscar produtos:', errorProdutos);
        throw errorProdutos;
      }
      
      // 7. Calcular preços aplicados por categoria
      const precosCategoria: PrecoCategoriaInfo[] = categorias?.map(categoria => {
        // Verificar se há preço personalizado
        const precoPersonalizado = precosPersonalizados.find(
          p => p.categoria_id === categoria.id
        );
        
        if (precoPersonalizado && Number(precoPersonalizado.preco_unitario) > 0) {
          return {
            categoriaId: categoria.id,
            categoriaNome: categoria.nome,
            precoUnitario: Number(precoPersonalizado.preco_unitario),
            fonte: 'personalizado' as const
          };
        }
        
        // Usar preço padrão da configuração (buscar por ID da categoria)
        const precoPadrao = precosPadrao[categoria.id.toString()] || 0;
        
        return {
          categoriaId: categoria.id,
          categoriaNome: categoria.nome,
          precoUnitario: Number(precoPadrao),
          fonte: 'padrao' as const
        };
      }) || [];
      
      // 8. Calcular quantidades médias por produto
      const agregadoProdutos = new Map<string, {
        nome: string;
        categoriaId: number | null;
        total: number;
      }>();
      
      // Criar índice de produtos por nome para lookup rápido
      const produtosPorNome = new Map<string, any>();
      produtos?.forEach(p => {
        produtosPorNome.set(p.nome.toLowerCase(), p);
      });
      
      entregas?.forEach(entrega => {
        if (Array.isArray(entrega.itens)) {
          entrega.itens.forEach((item: any) => {
            const quantidade = item.quantidade || 0;
            if (quantidade === 0) return;
            
            let produtoId: string;
            let produtoNome: string;
            let categoriaId: number | null = null;
            
            // ESTRATÉGIA 1: Item tem produto_id
            if (item.produto_id) {
              produtoId = item.produto_id;
              const produto = produtos?.find(p => p.id === produtoId);
              
              if (produto) {
                produtoNome = produto.nome;
                categoriaId = produto.categoria_id || null;
              } else {
                // produto_id existe mas não encontrado em produtos_finais
                produtoNome = item.produto_nome || item.produto || item.nome || `Produto ${produtoId.slice(0, 8)}`;
              }
            } 
            // ESTRATÉGIA 2: Item tem apenas nome (dados legados)
            else if (item.produto || item.produto_nome || item.nome) {
              produtoNome = item.produto || item.produto_nome || item.nome;
              
              // Tentar encontrar produto pelo nome
              const produtoEncontrado = produtosPorNome.get(produtoNome.toLowerCase());
              if (produtoEncontrado) {
                produtoId = produtoEncontrado.id;
                categoriaId = produtoEncontrado.categoria_id || null;
              } else {
                // Produto não encontrado, usar nome como ID
                produtoId = `legacy_${produtoNome.toLowerCase().replace(/\s+/g, '_')}`;
              }
            } 
            // Item sem identificação
            else {
              return;
            }
            
            // Agregar quantidade
            if (!agregadoProdutos.has(produtoId)) {
              agregadoProdutos.set(produtoId, {
                nome: produtoNome,
                categoriaId: categoriaId,
                total: 0
              });
            }
            
            const agregado = agregadoProdutos.get(produtoId)!;
            agregado.total += quantidade;
          });
        }
      });
      
      const quantidadesMedias: QuantidadeMediaProduto[] = Array.from(agregadoProdutos.entries()).map(
        ([produtoId, dados]) => ({
          produtoId,
          produtoNome: dados.nome,
          categoriaId: dados.categoriaId,
          quantidadeTotal12Semanas: dados.total,
          quantidadeMediaSemanal: Math.round(dados.total / numeroSemanasReais)
        })
      );
      
      console.log('📊 [Quantidades Médias] Calculadas:', {
        cliente: cliente.nome,
        totalEntregas: entregas?.length || 0,
        semanasConsideradas: numeroSemanasReais,
        produtos: quantidadesMedias.map(q => ({
          nome: q.produtoNome,
          total12sem: q.quantidadeTotal12Semanas,
          mediaSemanal: q.quantidadeMediaSemanal
        }))
      });
      
      // 9. Calcular custos PONDERADOS por categoria (baseado nas vendas reais)
      const custosPorCategoria = new Map<number, { 
        custoTotal: number; 
        quantidadeTotal: number; 
        nome: string 
      }>();
      
      console.log('🔍 [Custo Médio] Iniciando cálculo ponderado...', {
        cliente: cliente.nome,
        totalEntregas: entregas?.length || 0,
        entregasComItens: entregas?.filter(h => h.itens && Array.isArray(h.itens) && h.itens.length > 0).length || 0,
        quantidadesProdutos: quantidadesMedias.length
      });
      
      // Usar quantidadesMedias (produtos realmente vendidos) para calcular custo ponderado
      quantidadesMedias.forEach(item => {
        if (!item.categoriaId) {
          console.warn('⚠️ [Custo Médio] Produto sem categoria:', item.produtoNome);
          return;
        }
        
        // ESTRATÉGIA 1: Buscar produto por ID
        let produto = produtos?.find(p => p.id === item.produtoId);
        
        // ESTRATÉGIA 2: Buscar produto por NOME (fallback)
        if (!produto) {
          console.log('🔄 [Custo Médio] Produto não encontrado por ID, tentando por nome:', {
            produtoId: item.produtoId,
            produtoNome: item.produtoNome
          });
          
          produto = produtosPorNome.get(item.produtoNome.toLowerCase());
          
          if (produto) {
            console.log('✅ [Custo Médio] Produto encontrado por nome:', produto.nome);
          }
        }
        
        // ESTRATÉGIA 3: Fallback - Pular item
        if (!produto) {
          console.error('❌ [Custo Médio] Produto não encontrado (ID nem Nome):', {
            produtoId: item.produtoId,
            produtoNome: item.produtoNome,
            quantidade: item.quantidadeMediaSemanal
          });
          return;
        }
        
        const categoria = categorias?.find(c => c.id === item.categoriaId);
        if (!categoria) {
          console.warn('⚠️ [Custo Médio] Categoria não encontrada:', item.categoriaId);
          return;
        }
        
        // Inicializar categoria se não existe
        if (!custosPorCategoria.has(item.categoriaId)) {
          custosPorCategoria.set(item.categoriaId, {
            custoTotal: 0,
            quantidadeTotal: 0,
            nome: categoria.nome
          });
        }
        
        const custoData = custosPorCategoria.get(item.categoriaId)!;
        
        // Calcular custo ponderado pela quantidade vendida
        const custoUnitarioDB = produto.custo_unitario || 0;
        const custoUnitario = CUSTOS_REFERENCIA[produto.nome] || custoUnitarioDB;
        
        // Log para rastreabilidade quando usar custo de referência
        if (CUSTOS_REFERENCIA[produto.nome]) {
          console.log('📌 [Custo] Usando custo de referência:', {
            produto: produto.nome,
            custoOriginal: custoUnitarioDB.toFixed(2),
            custoReferencia: custoUnitario.toFixed(2)
          });
        }
        
        const quantidadeSemanal = item.quantidadeMediaSemanal;
        const custoTotalProduto = custoUnitario * quantidadeSemanal;
        
        console.log('📊 [Custo Médio] Processando:', {
          produto: produto.nome,
          categoria: categoria.nome,
          custoUnitario: custoUnitario.toFixed(2),
          quantidadeSemanal,
          custoTotalProduto: custoTotalProduto.toFixed(2)
        });
        
        custoData.custoTotal += custoTotalProduto;
        custoData.quantidadeTotal += quantidadeSemanal;
      });
      
      // Calcular média ponderada final
      const custosCategoria: CustoCategoria[] = Array.from(
        custosPorCategoria.entries()
      ).map(([categoriaId, dados]) => {
        const custoMedio = dados.quantidadeTotal > 0 
          ? dados.custoTotal / dados.quantidadeTotal 
          : 0;
        
        console.log('💰 [Custo Médio] Resultado final:', {
          categoria: dados.nome,
          custoTotal: dados.custoTotal.toFixed(2),
          quantidadeTotal: dados.quantidadeTotal,
          custoMedio: custoMedio.toFixed(2)
        });
        
        return {
          categoriaId,
          categoriaNome: dados.nome,
          custoMedio: Math.ceil(custoMedio * 100) / 100 // Arredondar para cima (2 casas decimais)
        };
      });
      
      // 10. Calcular resumo financeiro mensal
      const quantidadeEntregasSemanas = entregas?.length || 0;
      const quantidadeEntregasMes = Math.round((quantidadeEntregasSemanas / numeroSemanasReais) * SEMANAS_POR_MES);
      
      // Calcular faturamento semanal
      let faturamentoSemanal = 0;
      let custoTotalSemanal = 0;
      
      quantidadesMedias.forEach(item => {
        if (item.categoriaId) {
          const precoInfo = precosCategoria.find(p => p.categoriaId === item.categoriaId);
          const custoInfo = custosCategoria.find(c => c.categoriaId === item.categoriaId);
          
          if (precoInfo) {
            faturamentoSemanal += item.quantidadeMediaSemanal * precoInfo.precoUnitario;
          }
          
          if (custoInfo) {
            custoTotalSemanal += item.quantidadeMediaSemanal * custoInfo.custoMedio;
          }
        }
      });
      
      const faturamentoMedio = faturamentoSemanal * SEMANAS_POR_MES;
      const custoProdutos = custoTotalSemanal * SEMANAS_POR_MES;
      
      // Custo logístico (apenas se "Própria" ou "PROPRIA")
      const custoLogistico = (cliente.tipoLogistica?.toUpperCase() === 'PROPRIA' || cliente.tipoLogistica === 'Própria')
        ? quantidadeEntregasMes * CUSTO_POR_ENTREGA 
        : 0;
      
      // Imposto estimado (apenas se emite NF)
      const impostoEstimado = cliente.emiteNotaFiscal 
        ? faturamentoMedio * ALIQUOTA_SIMPLES 
        : 0;
      
      // Taxa de boleto (apenas se forma de pagamento for Boleto)
      const taxaBoleto = (cliente.formaPagamento?.toUpperCase() === 'BOLETO' || cliente.formaPagamento === 'Boleto')
        ? quantidadeEntregasMes * TAXA_BOLETO
        : 0;
      
      const totalCustosOperacionais = custoLogistico + impostoEstimado + taxaBoleto + custoProdutos;
      const margemBruta = faturamentoMedio - totalCustosOperacionais;
      const margemBrutaPercentual = faturamentoMedio > 0 
        ? (margemBruta / faturamentoMedio) * 100 
        : 0;
      
      const resumoMensal: ResumoFinanceiroMensal = {
        faturamentoMedio,
        custoLogistico,
        impostoEstimado,
        taxaBoleto,
        quantidadeEntregasMes,
        custoProdutos,
        totalCustosOperacionais,
        margemBruta,
        margemBrutaPercentual
      };
      
      console.log('useClienteFinanceiro: Resumo calculado:', resumoMensal);
      
      return {
        precosCategoria,
        quantidadesMedias,
        custosCategoria,
        resumoMensal
      } as DadosFinanceirosCliente;
    },
    enabled: !!cliente.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos
  });
  
  return {
    dadosFinanceiros,
    isLoading,
    error,
    refetch
  };
}
