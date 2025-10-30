import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { DollarSign, TrendingUp, Receipt, Target } from "lucide-react";

export default function GestaoFinanceira() {
  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader 
        title="Gestão Financeira" 
        description="Visão completa da saúde financeira da empresa" 
      />

      <div className="space-y-6 mt-6">
        {/* Indicadores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em projeções
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Lucro Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Margem: 0%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Custos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground mt-1">
                Fixos + Variáveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Margem Líquida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Após impostos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visão Geral */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Receitas
              </CardTitle>
              <CardDescription>
                Análise de faturamento e vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Faturamento Previsto</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ticket Médio</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Clientes Ativos</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Despesas
              </CardTitle>
              <CardDescription>
                Controle de custos e despesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custos Fixos</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custos Variáveis</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo de Insumos</span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder para desenvolvimento futuro */}
        <Card>
          <CardHeader>
            <CardTitle>Em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta é a nova versão da Gestão Financeira. 
              A versão anterior está disponível como "Financeiro OLD" para referência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidades planejadas:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>• Dashboard financeiro completo</li>
              <li>• Integração com dados reais de faturamento</li>
              <li>• Análise de margens e rentabilidade</li>
              <li>• Controle de fluxo de caixa</li>
              <li>• Projeções e cenários financeiros</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
