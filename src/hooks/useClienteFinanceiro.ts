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
  quantidadeTotal12Semanas: number;
  quantidadeMediaSemanal: number;
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

export function useClienteFinanceiro(cliente: Cliente) {
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  
  const { data: dadosFinanceiros, isLoading, error, refetch } = useQuery({
    queryKey: ['cliente-financeiro', cliente.id],
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
        .eq('modulo', 'precos')
        .single();
      
      if (errorConfig && errorConfig.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações de preços:', errorConfig);
      }
      
      const precosPadrao = (configPrecos?.configuracoes as any)?.precos || {};
      
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
        
        if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
          return {
            categoriaId: categoria.id,
            categoriaNome: categoria.nome,
            precoUnitario: precoPersonalizado.preco_unitario,
            fonte: 'personalizado' as const
          };
        }
        
        // Usar preço padrão da configuração
        const precoPadrao = precosPadrao[categoria.nome] || 0;
        
        return {
          categoriaId: categoria.id,
          categoriaNome: categoria.nome,
          precoUnitario: precoPadrao,
          fonte: 'padrao' as const
        };
      }) || [];
      
      // 8. Calcular quantidades médias por produto
      const agregadoProdutos = new Map<string, {
        nome: string;
        categoriaId: number | null;
        total: number;
      }>();
      
      entregas?.forEach(entrega => {
        if (Array.isArray(entrega.itens)) {
          entrega.itens.forEach((item: any) => {
            const produtoId = item.produto_id;
            const quantidade = item.quantidade || 0;
            
            if (produtoId) {
              const produto = produtos?.find(p => p.id === produtoId);
              const categoriaId = produto?.categoria_id || null;
              const produtoNome = produto?.nome || item.produto_nome || item.produto || item.nome || 'Produto não identificado';
              
              if (!agregadoProdutos.has(produtoId)) {
                agregadoProdutos.set(produtoId, {
                  nome: produtoNome,
                  categoriaId: categoriaId,
                  total: 0
                });
              }
              
              const agregado = agregadoProdutos.get(produtoId)!;
              agregado.total += quantidade;
            }
          });
        }
      });
      
      const quantidadesMedias: QuantidadeMediaProduto[] = Array.from(agregadoProdutos.entries()).map(
        ([produtoId, dados]) => ({
          produtoId,
          produtoNome: dados.nome,
          categoriaId: dados.categoriaId,
          quantidadeTotal12Semanas: dados.total,
          quantidadeMediaSemanal: Math.round(dados.total / 12)
        })
      );
      
      // 9. Calcular custos médios por categoria
      const custosPorCategoria = new Map<number, { soma: number; count: number; nome: string }>();
      
      produtos?.forEach(produto => {
        if (produto.categoria_id && categoriasHabilitadas.includes(produto.categoria_id)) {
          const categoria = categorias?.find(c => c.id === produto.categoria_id);
          if (categoria) {
            if (!custosPorCategoria.has(produto.categoria_id)) {
              custosPorCategoria.set(produto.categoria_id, {
                soma: 0,
                count: 0,
                nome: categoria.nome
              });
            }
            
            const custoData = custosPorCategoria.get(produto.categoria_id)!;
            custoData.soma += produto.custo_unitario || 0;
            custoData.count += 1;
          }
        }
      });
      
      const custosCategoria: CustoCategoria[] = Array.from(custosPorCategoria.entries()).map(
        ([categoriaId, dados]) => ({
          categoriaId,
          categoriaNome: dados.nome,
          custoMedio: dados.count > 0 ? dados.soma / dados.count : 0
        })
      );
      
      // 10. Calcular resumo financeiro mensal
      const quantidadeEntregasSemanas = entregas?.length || 0;
      const quantidadeEntregasMes = Math.round((quantidadeEntregasSemanas / 12) * SEMANAS_POR_MES);
      
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
      
      // Custo logístico (apenas se "Própria")
      const custoLogistico = cliente.tipoLogistica === 'Própria' 
        ? quantidadeEntregasMes * CUSTO_POR_ENTREGA 
        : 0;
      
      // Imposto estimado (apenas se emite NF)
      const impostoEstimado = cliente.emiteNotaFiscal 
        ? faturamentoMedio * ALIQUOTA_SIMPLES 
        : 0;
      
      // Taxa de boleto (apenas se forma de pagamento for Boleto)
      const taxaBoleto = cliente.formaPagamento === 'Boleto'
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
