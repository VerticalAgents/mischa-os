
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bug, CheckCircle } from "lucide-react";
import { useDREData } from "@/hooks/useDREData";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import { useSupabaseCustosFixos } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis } from "@/hooks/useSupabaseCustosVariaveis";
import { useClienteStore } from "@/hooks/useClienteStore";

export function DREDebugTab() {
  const { data: dreData, isLoading, error } = useDREData();
  const faturamentoPrevisto = useFaturamentoPrevisto();
  const { custosFixos, isLoading: custosFixosLoading, /* error handled in hook */ } = useSupabaseCustosFixos();
  const { custosVariaveis, isLoading: custosVariaveisLoading, /* error handled in hook */ } = useSupabaseCustosVariaveis();
  const { clientes } = useClienteStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dados de debug...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados de debug: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!dreData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado da DRE disponível para debug.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Bug className="h-4 w-4" />
        <AlertDescription>
          🐛 Debug DRE - Verificação de dados e cálculos (Sincronizado com Projeção de Resultados por PDV)
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Dados da DRE</CardTitle>
          <CardDescription>Informações gerais da DRE</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
              <p className="text-lg font-bold">R$ {dreData.totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custos Totais</p>
              <p className="text-lg font-bold">R$ {dreData.totalCosts.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lucro Bruto</p>
              <p className="text-lg font-bold">R$ {dreData.grossProfit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Margem Bruta</p>
              <p className="text-lg font-bold">{dreData.grossMargin.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento Previsto</CardTitle>
          <CardDescription>Dados detalhados do faturamento previsto</CardDescription>
        </CardHeader>
        <CardContent>
          {faturamentoPrevisto.isLoading ? (
            <p>Carregando dados de faturamento...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faturamento Semanal</p>
                <p className="text-lg font-bold">R$ {faturamentoPrevisto.faturamentoSemanal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faturamento Mensal</p>
                <p className="text-lg font-bold">R$ {faturamentoPrevisto.faturamentoMensal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponível</p>
                <p className="text-lg font-bold">{faturamentoPrevisto.disponivel ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preços Detalhados</p>
                <p className="text-lg font-bold">{faturamentoPrevisto.precosDetalhados?.length || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos Fixos</CardTitle>
          <CardDescription>Dados detalhados dos custos fixos</CardDescription>
        </CardHeader>
        <CardContent>
          {custosFixosLoading ? (
            <p>Carregando custos fixos...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Custos Fixos</p>
                <p className="text-lg font-bold">R$ {custosFixos?.reduce((sum, custo) => sum + custo.valor, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Custos Fixos</p>
                <p className="text-lg font-bold">{custosFixos?.length || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos Variáveis</CardTitle>
          <CardDescription>Dados detalhados dos custos variáveis</CardDescription>
        </CardHeader>
        <CardContent>
          {custosVariaveisLoading ? (
            <p>Carregando custos variáveis...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Custos Variáveis</p>
                <p className="text-lg font-bold">R$ {custosVariaveis?.reduce((sum, custo) => sum + custo.valor, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Custos Variáveis</p>
                <p className="text-lg font-bold">{custosVariaveis?.length || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>Dados dos clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Número de Clientes</p>
            <p className="text-lg font-bold">{clientes.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
