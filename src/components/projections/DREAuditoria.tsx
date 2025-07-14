
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, BarChart3 } from "lucide-react";
import { useDREData } from '@/hooks/useDREData';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { useSupabaseCustosFixos } from '@/hooks/useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from '@/hooks/useSupabaseCustosVariaveis';

export function DREAuditoria() {
  const { dreData, dreCalculationResult, isLoading, error } = useDREData();
  const { faturamentoMensal, precosDetalhados } = useFaturamentoPrevisto();
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  
  const [validationResults, setValidationResults] = useState<{
    faturamentoMatch: boolean;
    custosFixosMatch: boolean;
    custosVariaveisMatch: boolean;
    calculosConsistentes: boolean;
    detalhes: string[];
  }>({
    faturamentoMatch: false,
    custosFixosMatch: false,
    custosVariaveisMatch: false,
    calculosConsistentes: false,
    detalhes: []
  });

  useEffect(() => {
    if (dreData && dreCalculationResult) {
      const detalhes: string[] = [];
      
      // Validar faturamento
      const faturamentoMatch = Math.abs(dreData.totalRevenue - faturamentoMensal) < 100;
      if (!faturamentoMatch) {
        detalhes.push(`Faturamento DRE: R$ ${dreData.totalRevenue.toFixed(2)} vs Projeção: R$ ${faturamentoMensal.toFixed(2)}`);
      }
      
      // Validar custos fixos
      const totalCustosFixosDB = custosFixos.reduce((sum, custo) => {
        const valor = custo.frequencia === 'mensal' ? custo.valor : custo.valor * 4.33;
        return sum + valor;
      }, 0);
      const custosFixosMatch = Math.abs(dreData.totalFixedCosts - totalCustosFixosDB) < 10;
      if (!custosFixosMatch) {
        detalhes.push(`Custos Fixos DRE: R$ ${dreData.totalFixedCosts.toFixed(2)} vs DB: R$ ${totalCustosFixosDB.toFixed(2)}`);
      }
      
      // Validar custos variáveis
      const totalCustosVariaveisDB = custosVariaveis.reduce((sum, custo) => {
        const valor = custo.frequencia === 'mensal' ? custo.valor : custo.valor * 4.33;
        return sum + valor;
      }, 0);
      const custosVariaveisMatch = Math.abs(dreData.totalAdministrativeCosts - totalCustosVariaveisDB) < 10;
      if (!custosVariaveisMatch) {
        detalhes.push(`Custos Adm. DRE: R$ ${dreData.totalAdministrativeCosts.toFixed(2)} vs DB: R$ ${totalCustosVariaveisDB.toFixed(2)}`);
      }
      
      // Validar consistência dos cálculos
      const margemCalculada = dreData.totalRevenue - dreData.totalCosts;
      const calculosConsistentes = Math.abs(margemCalculada - dreData.operationalResult) < 1;
      if (!calculosConsistentes) {
        detalhes.push(`Margem calculada: R$ ${margemCalculada.toFixed(2)} vs Resultado Op.: R$ ${dreData.operationalResult.toFixed(2)}`);
      }
      
      setValidationResults({
        faturamentoMatch,
        custosFixosMatch,
        custosVariaveisMatch,
        calculosConsistentes,
        detalhes
      });
    }
  }, [dreData, dreCalculationResult, faturamentoMensal, custosFixos, custosVariaveis]);

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
            Auditoria DRE
          </CardTitle>
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

  const allValidationsPass = validationResults.faturamentoMatch && 
                            validationResults.custosFixosMatch && 
                            validationResults.custosVariaveisMatch && 
                            validationResults.calculosConsistentes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Auditoria DRE
        </CardTitle>
        <CardDescription>
          Validação dos dados da DRE com as fontes originais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status geral */}
        <div className="flex items-center gap-2">
          {allValidationsPass ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <Badge variant="default" className="bg-green-100 text-green-800">
                Todos os dados consistentes
              </Badge>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              <Badge variant="destructive">
                Inconsistências detectadas
              </Badge>
            </>
          )}
        </div>

        {/* Validações individuais */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Faturamento vs Projeções</span>
            {validationResults.faturamentoMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Custos Fixos vs Database</span>
            {validationResults.custosFixosMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Custos Administrativos vs Database</span>
            {validationResults.custosVariaveisMatch ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Consistência dos Cálculos</span>
            {validationResults.calculosConsistentes ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Detalhes das inconsistências */}
        {validationResults.detalhes.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Detalhes das Inconsistências:</h4>
            <div className="space-y-1">
              {validationResults.detalhes.map((detalhe, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {detalhe}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo dos dados */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">Resumo dos Dados:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.totalRevenue)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Custos Totais:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.totalCosts)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resultado Op.:</span>
              <span className="ml-2 font-medium">{formatCurrency(dreData.operationalResult)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Margem Op.:</span>
              <span className="ml-2 font-medium">{dreData.operationalMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
