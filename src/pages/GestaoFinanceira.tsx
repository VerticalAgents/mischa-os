
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Receipt, DollarSign, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function GestaoFinanceira() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Financeira"
        description="Visão geral da gestão financeira e DREs da empresa"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              Projeções
            </CardTitle>
            <CardDescription>
              Cenários e análises financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Simule diferentes cenários de crescimento e explore o impacto financeiro de suas decisões.
            </p>
            <Button onClick={() => navigate("/projecoes")} className="w-full">
              Acessar Projeções
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Receipt className="mr-2 h-5 w-5" />
              Custos
            </CardTitle>
            <CardDescription>
              Controle detalhado de custos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie todos os custos da operação, categorizados por tipo, frequência e área.
            </p>
            <Button onClick={() => navigate("/custos")} className="w-full">
              Gerenciar Custos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Histórico de DREs
            </CardTitle>
            <CardDescription>
              Demonstrativos de resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Acesse o histórico de demonstrativos de resultados e acompanhe a evolução financeira.
            </p>
            <Button variant="outline" className="w-full">
              Em breve
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Resumo financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 85.430</div>
              <p className="text-xs text-green-600 flex items-center">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 56.789</div>
              <p className="text-xs text-amber-600 flex items-center">
                +5% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Margem Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">33.5%</div>
              <p className="text-xs text-green-600 flex items-center">
                +2.1% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ponto de Equilíbrio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 47.320</div>
              <p className="text-xs text-muted-foreground">
                Receita mínima mensal necessária
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
