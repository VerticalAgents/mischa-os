import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useDREData } from "@/hooks/useDREData";
import { useProjectionStore } from "@/hooks/useProjectionStore";

export function DREAuditoria() {
  const { data: dreData, isLoading, error } = useDREData();
  const { baseDRE } = useProjectionStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando auditoria da DRE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados para auditoria: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const currentDRE = dreData || baseDRE;

  if (!currentDRE) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Nenhum dado de DRE disponível para auditoria.
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Auditoria da DRE Base - Dados sincronizados com a "Projeção de Resultados por PDV"
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral da DRE</CardTitle>
          <CardDescription>
            Análise dos principais componentes da DRE Base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Receita Total</div>
              <div className="text-2xl font-bold">{formatCurrency(currentDRE.totalRevenue)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Resultado Operacional</div>
              <div className="text-2xl font-bold">{formatCurrency(currentDRE.operationalResult)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">EBITDA</div>
              <div className="text-2xl font-bold">{formatCurrency(currentDRE.ebitda)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos Detalhados</CardTitle>
          <CardDescription>
            Análise detalhada dos custos fixos e variáveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Custos Fixos Totais</div>
              <div className="text-xl font-bold">{formatCurrency(currentDRE.totalFixedCosts)}</div>
              <ul className="mt-2 space-y-1">
                {currentDRE.fixedCosts.map((cost, index) => (
                  <li key={index} className="text-sm">
                    {cost.name}: {formatCurrency(cost.value)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Custos Administrativos Totais</div>
              <div className="text-xl font-bold">{formatCurrency(currentDRE.totalAdministrativeCosts)}</div>
              <ul className="mt-2 space-y-1">
                {currentDRE.administrativeCosts.map((cost, index) => (
                  <li key={index} className="text-sm">
                    {cost.name}: {formatCurrency(cost.value)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown Detalhado</CardTitle>
          <CardDescription>
            Informações detalhadas sobre o faturamento e custos por categoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentDRE.detailedBreakdown ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Faturamento Revenda Padrão</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.revendaPadraoFaturamento)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Faturamento Food Service</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.foodServiceFaturamento)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Insumos Revenda</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.totalInsumosRevenda)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Insumos Food Service</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.totalInsumosFoodService)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Logística</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.totalLogistica)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Aquisição de Clientes</div>
                <div className="text-xl font-bold">{formatCurrency(currentDRE.detailedBreakdown.aquisicaoClientes)}</div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhum detalhamento disponível para esta DRE.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Funcionam os Fatores de Crescimento</CardTitle>
          <CardDescription>
            Entenda o impacto dos ajustes nos cenários alternativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-base">1. Crescimento de Faturamento</h4>
            <p className="text-sm text-muted-foreground">
              Quando você aplica um fator de crescimento no faturamento (Revenda Padrão ou Food Service):
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li><strong>Percentual</strong>: Aumenta o faturamento em X% sobre o valor base</li>
              <li><strong>Absoluto</strong>: Define um novo valor total de faturamento</li>
              <li><strong>Custos de Insumos</strong>: Crescem proporcionalmente ao faturamento (mesma % de margem)</li>
              <li><strong>Custos Administrativos (%)</strong>: Mantêm o mesmo percentual sobre o novo faturamento</li>
              <li><strong>Custos Fixos</strong>: Permanecem constantes (não crescem com faturamento)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-base">2. Crescimento de PDVs</h4>
            <p className="text-sm text-muted-foreground">
              Quando você ajusta o número de PDVs ativos:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Cada PDV adicional/removido afeta o faturamento proporcionalmente</li>
              <li>O impacto é distribuído entre Revenda Padrão e Food Service conforme a proporção atual</li>
              <li>Custos de insumos crescem junto com o faturamento (mantendo margens)</li>
              <li>Custos administrativos percentuais se ajustam automaticamente ao novo faturamento</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-base">3. Exemplo Prático</h4>
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
              <p className="font-semibold">Cenário: Aumento de 10% no faturamento de Revenda Padrão</p>
              <div className="space-y-1 ml-2">
                <p>• Faturamento Revenda: R$ 100.000 → R$ 110.000 (+10%)</p>
                <p>• Custos Insumos Revenda: R$ 50.000 → R$ 55.000 (+10%)</p>
                <p>• Logística (10% do faturamento total): Ajusta proporcionalmente</p>
                <p>• Impostos (5% do faturamento total): Ajusta proporcionalmente</p>
                <p>• Taxa Boleto: Ajusta proporcionalmente</p>
                <p>• Custos Fixos: R$ 20.000 → R$ 20.000 (sem alteração)</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-base">4. Fórmulas de Cálculo</h4>
            <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
              <div>
                <p className="font-semibold mb-1">Faturamento com Crescimento %:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">Novo Faturamento = Faturamento Base × (1 + Percentual/100)</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Custos de Insumos:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">Novos Insumos = Insumos Base × (Novo Faturamento / Faturamento Base)</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Custos Administrativos %:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">Novo Custo % = (Custo Base / Faturamento Base) × Novo Faturamento</code>
              </div>
              <div>
                <p className="font-semibold mb-1">EBITDA:</p>
                <code className="text-xs bg-background px-2 py-1 rounded">EBITDA = Resultado Operacional + Depreciação Mensal</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
