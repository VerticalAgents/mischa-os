
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, BarChart3 } from "lucide-react";
import { useDREData } from '@/hooks/useDREData';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';

export function DREAuditoria() {
  const { dreData, dreCalculationResult, isLoading, error } = useDREData();
  const { faturamentoMensal, precosDetalhados, disponivel } = useFaturamentoPrevisto();
  
  const [validationResults, setValidationResults] = useState<{
    faturamentoMatch: boolean;
    dadosConsistentes: boolean;
    detalhes: string[];
  }>({
    faturamentoMatch: false,
    dadosConsistentes: false,
    detalhes: []
  });

  useEffect(() => {
    if (dreData && dreCalculationResult && disponivel) {
      const detalhes: string[] = [];
      
      // Validar faturamento total
      const faturamentoMatch = Math.abs(dreData.totalRevenue - faturamentoMensal) < 1;
      if (!faturamentoMatch) {
        detalhes.push(`Faturamento DRE: R$ ${dreData.totalRevenue.toFixed(2)} vs Projeções: R$ ${faturamentoMensal.toFixed(2)}`);
      }
      
      // Validar dados por categoria
      const revendaProjecoes = precosDetalhados
        .filter(p => p.categoriaNome.toLowerCase().includes('revenda') || p.categoriaNome.toLowerCase().includes('padrão'))
        .reduce((sum, p) => sum + (p.faturamentoSemanal * 4.33), 0);
      
      const foodServiceProjecoes = precosDetalhados
        .filter(p => p.categoriaNome.toLowerCase().includes('food service'))
        .reduce((sum, p) => sum + (p.faturamentoSemanal * 4.33), 0);
      
      const revendaMatchDRE = Math.abs(dreCalculationResult.receitaRevendaPadrao - revendaProjecoes) < 10;
      const foodServiceMatchDRE = Math.abs(dreCalculationResult.receitaFoodService - foodServiceProjecoes) < 10;
      
      if (!revendaMatchDRE) {
        detalhes.push(`Revenda Padrão - DRE: R$ ${dreCalculationResult.receitaRevendaPadrao.toFixed(2)} vs Projeções: R$ ${revendaProjecoes.toFixed(2)}`);
      }
      
      if (!foodServiceMatchDRE) {
        detalhes.push(`Food Service - DRE: R$ ${dreCalculationResult.receitaFoodService.toFixed(2)} vs Projeções: R$ ${foodServiceProjecoes.toFixed(2)}`);
      }
      
      const dadosConsistentes = faturamentoMatch && revendaMatchDRE && foodServiceMatchDRE;
      
      setValidationResults({
        faturamentoMatch,
        dadosConsistentes,
        detalhes
      });
    }
  }, [dreData, dreCalculationResult, faturamentoMensal, precosDetalhados, disponivel]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cálculo Detalhado da DRE Base
          </CardTitle>
          <CardDescription>
            Auditoria completa dos cálculos realizados para compor os valores da DRE Base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erro na auditoria DRE: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!dreData || !dreCalculationResult) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Dados da DRE não disponíveis para auditoria
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Cálculo Detalhado da DRE Base
        </CardTitle>
        <CardDescription>
          Auditoria completa dos cálculos realizados para compor os valores da DRE Base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status geral */}
        <div className="flex items-center gap-2">
          {validationResults.dadosConsistentes ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <Badge variant="default" className="bg-green-100 text-green-800">
                Dados consistentes com projeções
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                Verificar inconsistências
              </Badge>
            </>
          )}
        </div>

        {/* Receita Operacional */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">📊 Receita Operacional</h3>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(dreCalculationResult.totalReceita)}
            </span>
          </div>
          
          <div className="ml-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">📈 Composição da Receita</span>
            </div>
            
            <div className="ml-4 bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">■ Cálculo:</span>
                  <div className="ml-2">
                    <div>Revenda Padrão: {formatCurrency(dreCalculationResult.receitaRevendaPadrao)}</div>
                    <div>Food Service: {formatCurrency(dreCalculationResult.receitaFoodService)}</div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Total: {formatCurrency(dreCalculationResult.totalReceita)}</span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-600">🔧</span>
                  <span className="font-medium">Fonte dos dados:</span>
                </div>
                <div className="ml-6 text-sm text-gray-600">
                  <div>Bloco: "Faturamento Mensal" → Valor calculado dinamicamente</div>
                  <div>Bloco: "Faturamento por Categoria de Produto"</div>
                  <div>• Revenda Padrão: {formatCurrency(dreCalculationResult.receitaRevendaPadrao)}</div>
                  <div>• Food Service: {formatCurrency(dreCalculationResult.receitaFoodService)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm font-medium">Valor final apresentado:</span>
            </div>
            <div className="ml-6 text-lg font-bold text-green-600">
              {formatCurrency(dreCalculationResult.totalReceita)}
            </div>
          </div>
        </div>

        {/* Custos de Insumos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">💰 Custo de Insumos</h3>
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(dreCalculationResult.custosInsumos)}
            </span>
          </div>
          
          <div className="ml-4 bg-red-50 p-3 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Revenda Padrão:</span>
                <div className="ml-2">{formatCurrency(dreCalculationResult.custosInsumosRevendaPadrao)}</div>
              </div>
              <div>
                <span className="text-gray-600">Food Service:</span>
                <div className="ml-2">{formatCurrency(dreCalculationResult.custosInsumosFoodService)}</div>
              </div>
            </div>
            
            <div className="text-sm font-medium text-red-600">
              Custo Total de Insumos: {formatCurrency(dreCalculationResult.custosInsumos)}
            </div>
          </div>
        </div>

        {/* Inconsistências */}
        {validationResults.detalhes.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-yellow-800">
              ⚠️ Inconsistências detectadas nos cálculos:
            </h4>
            <div className="space-y-1">
              {validationResults.detalhes.map((detalhe, index) => (
                <div key={index} className="text-xs text-yellow-700 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {detalhe}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo dos dados */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-sm mb-3">📋 Resumo dos Dados:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Receita Total:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.totalRevenue)}</span>
            </div>
            <div>
              <span className="text-gray-600">Custos Totais:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.totalCosts)}</span>
            </div>
            <div>
              <span className="text-gray-600">Resultado Op.:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.operationalResult)}</span>
            </div>
            <div>
              <span className="text-gray-600">Margem Op.:</span>
              <span className="ml-2 font-medium">{dreData.operationalMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
