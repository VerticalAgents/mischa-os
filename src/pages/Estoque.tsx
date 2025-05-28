
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageCheck, Package, ArrowRight } from "lucide-react";

export default function Estoque() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader 
        title="Estoque" 
        description="Gerencie seus inventários de produtos e insumos."
        icon={<PackageCheck className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Produtos Acabados
            </CardTitle>
            <CardDescription>
              Estoque de produtos finais prontos para expedição (ex: brownies, kits, combos).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Gerencie as quantidades disponíveis em estoque de cada produto final.
              Configure alertas de estoque mínimo e acompanhe o histórico de movimentações.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/estoque/insumos?tab=produtos')} 
              className="w-full"
            >
              Acessar Produtos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-amber-200 hover:border-amber-400 transition-colors">
          <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Insumos
            </CardTitle>
            <CardDescription>
              Gestão completa de insumos usados na produção, incluindo estoque, cotações e pedidos de compra.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Gerencie o estoque de insumos, crie cotações, compare fornecedores 
              e mantenha o controle das compras em um único lugar.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/estoque/insumos?tab=insumos')} 
              variant="secondary"
              className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60"
            >
              Acessar Insumos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
