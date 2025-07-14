
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Bug, Database, Calculator } from "lucide-react";
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCategoriasProduto } from '@/hooks/useSupabaseCategoriasProduto';
import { useDREData } from '@/hooks/useDREData';

export function DREDebugTab() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  const { faturamentoSemanal, faturamentoMensal, precosDetalhados, disponivel } = useFaturamentoPrevisto();
  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { dreData, dreCalculationResult } = useDREData();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Agrupar dados por categoria
  const dadosPorCategoria = precosDetalhados.reduce((acc, item) => {
    const categoria = item.categoriaNome.toLowerCase();
    let grupo = 'outros';
    
    if (categoria.includes('revenda') || categoria.includes('padrão')) {
      grupo = 'revenda padrão';
    } else if (categoria.includes('food service')) {
      grupo = 'food service';
    }
    
    if (!acc[grupo]) {
      acc[grupo] = {
        items: [],
        faturamentoSemanal: 0,
        faturamentoMensal: 0,
        clientes: new Set()
      };
    }
    
    acc[grupo].items.push(item);
    acc[grupo].faturamentoSemanal += item.faturamentoSemanal;
    acc[grupo].faturamentoMensal += item.faturamentoSemanal * 4.33;
    acc[grupo].clientes.add(item.clienteId);
    
    return acc;
  }, {} as Record<string, any>);

  // Análise de clientes ativos
  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio);
  const clientesComCategorias = clientesAtivos.filter(c => c.categoriasHabilitadas && c.categoriasHabilitadas.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bug className="h-5 w-5 text-amber-600" />
        <h2 className="text-xl font-semibold">Debug DRE - Rastreamento de Dados</h2>
        <Badge variant="outline" className="text-amber-600">Modo Debug</Badge>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status Geral dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Clientes Totais</div>
              <div className="text-xl font-bold">{clientes.length}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600">Clientes Ativos</div>
              <div className="text-xl font-bold">{clientesAtivos.length}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600">Com Categorias</div>
              <div className="text-xl font-bold">{clientesComCategorias.length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-sm text-amber-600">Disponível</div>
              <div className="text-xl font-bold">{disponivel ? 'Sim' : 'Não'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Faturamento Previsto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Faturamento Semanal</div>
                <div className="text-xl font-bold">{formatCurrency(faturamentoSemanal)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Faturamento Mensal</div>
                <div className="text-xl font-bold">{formatCurrency(faturamentoMensal)}</div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Detalhes de Preços</div>
              <div className="text-xl font-bold">{precosDetalhados.length} itens</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Categoria</CardTitle>
          <CardDescription>Breakdown detalhado do faturamento por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dadosPorCategoria).map(([categoria, dados]) => (
              <Collapsible key={categoria}>
                <CollapsibleTrigger 
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  onClick={() => toggleSection(categoria)}
                >
                  <div className="flex items-center gap-3">
                    {openSections[categoria] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <div className="font-medium capitalize">{categoria}</div>
                      <div className="text-sm text-gray-600">{dados.clientes.size} clientes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(dados.faturamentoMensal)}</div>
                    <div className="text-sm text-gray-600">mensal</div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="pl-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-sm text-blue-600">Faturamento Semanal</div>
                        <div className="font-bold">{formatCurrency(dados.faturamentoSemanal)}</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-sm text-green-600">Faturamento Mensal (x4.33)</div>
                        <div className="font-bold">{formatCurrency(dados.faturamentoMensal)}</div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium mb-2">Itens:</div>
                    {dados.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-2 bg-gray-100 rounded text-sm">
                        <div className="flex justify-between">
                          <span>{item.clienteNome}</span>
                          <span>{formatCurrency(item.faturamentoSemanal * 4.33)}</span>
                        </div>
                        <div className="text-gray-600">
                          {item.categoriaNome} - Giro: {item.giroSemanal} - Preço: {formatCurrency(item.precoUnitario)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparação DRE vs Projeções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Comparação DRE vs Projeções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Fonte</div>
                <div className="font-bold">Categoria</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Projeções</div>
                <div className="font-bold">Valor</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">DRE</div>
                <div className="font-bold">Valor</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
                <div>Revenda Padrão</div>
                <div className="text-center">{formatCurrency(dadosPorCategoria['revenda padrão']?.faturamentoMensal || 0)}</div>
                <div className="text-center">{formatCurrency(dreCalculationResult?.receitaRevendaPadrao || 0)}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
                <div>Food Service</div>
                <div className="text-center">{formatCurrency(dadosPorCategoria['food service']?.faturamentoMensal || 0)}</div>
                <div className="text-center">{formatCurrency(dreCalculationResult?.receitaFoodService || 0)}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 rounded">
                <div className="font-bold">Total</div>
                <div className="text-center font-bold">{formatCurrency(faturamentoMensal)}</div>
                <div className="text-center font-bold">{formatCurrency(dreCalculationResult?.totalReceita || 0)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Brutos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Brutos (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible>
            <CollapsibleTrigger 
              className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200"
              onClick={() => toggleSection('json')}
            >
              {openSections['json'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Ver dados brutos
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Preços Detalhados:</div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(precosDetalhados, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Resultado DRE:</div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(dreCalculationResult, null, 2)}
                  </pre>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Alertas */}
      {!disponivel && (
        <Alert>
          <AlertDescription>
            ⚠️ Dados de faturamento não disponíveis - verifique se há clientes ativos com categorias habilitadas
          </AlertDescription>
        </Alert>
      )}
      
      {precosDetalhados.length === 0 && (
        <Alert>
          <AlertDescription>
            ⚠️ Nenhum detalhe de preços encontrado - verifique configurações de preços por categoria
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
