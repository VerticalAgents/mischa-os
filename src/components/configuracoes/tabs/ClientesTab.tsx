
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck, DollarSign } from "lucide-react";

import RepresentantesList from "../listas/RepresentantesList";
import RotasEntregaList from "../listas/RotasEntregaList";
import CategoriasEstabelecimentoList from "../listas/CategoriasEstabelecimentoList";
import TiposLogisticaList from "../listas/TiposLogisticaList";
import FormasPagamentoList from "../listas/FormasPagamentoList";

export default function ClientesTab() {
  const [activeLista, setActiveLista] = useState("representantes");
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4" />
          <CardTitle>Parâmetros do Cliente</CardTitle>
        </div>
        <CardDescription>
          Configure os parâmetros utilizados no cadastro de clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="representantes" 
          value={activeLista} 
          onValueChange={setActiveLista}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-6 gap-2">
            <TabsTrigger value="representantes">Representantes</TabsTrigger>
            <TabsTrigger value="rotas">Rotas de Entrega</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="logistica">Tipos de Logística</TabsTrigger>
            <TabsTrigger value="pagamento">Formas de Pagamento</TabsTrigger>
            <TabsTrigger value="financeiro">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>Financeiro</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="representantes">
            <RepresentantesList />
          </TabsContent>
          
          <TabsContent value="rotas">
            <RotasEntregaList />
          </TabsContent>
          
          <TabsContent value="categorias">
            <CategoriasEstabelecimentoList />
          </TabsContent>
          
          <TabsContent value="logistica">
            <TiposLogisticaList />
          </TabsContent>
          
          <TabsContent value="pagamento">
            <FormasPagamentoList />
          </TabsContent>

          <TabsContent value="financeiro">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">Parâmetros Financeiros</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Configure os parâmetros financeiros relacionados aos clientes
                  </p>
                  
                  {/* Add financial parameters here */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Taxa de Descontos</label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Defina a taxa padrão de desconto para clientes
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Prazo de Pagamento</label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Defina o prazo padrão para pagamento
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valor Mínimo de Pedido</label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Configure o valor mínimo para pedidos
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Taxa de Entrega</label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Configure a taxa de entrega padrão
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
