import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, AlertOctagon, Bell, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Cliente, Pedido } from "@/types";

interface AlertsRisksProps {
  clientes: Cliente[];
  pedidos: Pedido[];
  registrosProducao: any[];
  planejamentoProducao: any[];
}

export default function AlertsRisks({
  clientes,
  pedidos,
  registrosProducao,
  planejamentoProducao
}: AlertsRisksProps) {
  const [inactiveClients, setInactiveClients] = useState<Cliente[]>([]);
  const [lowVolumeProducts, setLowVolumeProducts] = useState<any[]>([]);
  const [missingProduction, setMissingProduction] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  
  useEffect(() => {
    // Find inactive clients (no orders in the last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const inactiveClientsList = clientes
      .filter(cliente => {
        // Find the latest order for this client
        const latestOrder = pedidos
          .filter(p => p.idCliente === cliente.id && p.statusPedido === "Entregue")
          .sort((a, b) => new Date(b.dataEfetivaEntrega || 0).getTime() - new Date(a.dataEfetivaEntrega || 0).getTime())[0];
        
        // Check if the client is active but hasn't had an order in the last 30 days
        return cliente.status_cliente === "Ativo" && 
               (!latestOrder || new Date(latestOrder.dataEfetivaEntrega || 0) < thirtyDaysAgo);
      })
      .slice(0, 5); // Limit to 5 clients
      
    setInactiveClients(inactiveClientsList);
    
    // Example data for other alerts (in a real app, these would be calculated from actual data)
    setLowVolumeProducts([
      { nome: "Brownie White", giroSemanal: 12, mediaGlobal: 30 },
      { nome: "Brownie Café", giroSemanal: 15, mediaGlobal: 30 },
      { nome: "Brownie Pistache", giroSemanal: 8, mediaGlobal: 30 }
    ]);
    
    setMissingProduction([
      { data: "2023-05-15", produto: "Brownie Tradicional", planejado: 120, realizado: 0 },
      { data: "2023-05-16", produto: "Brownie Nutella", planejado: 80, realizado: 0 }
    ]);
    
    setLowStockItems([
      { item: "Farinha", estoque: 5, minimo: 10 },
      { item: "Chocolate em Pó", estoque: 3, minimo: 8 },
      { item: "Nozes", estoque: 2, minimo: 5 }
    ]);
    
  }, [clientes, pedidos]);
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Clientes Inativos (30+ dias)
            </CardTitle>
            <CardDescription>PDVs ativos sem pedidos recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {inactiveClients.length > 0 ? (
              <ul className="space-y-2">
                {inactiveClients.map((client, index) => (
                  <li key={index} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{client.nome}</span>
                    <Badge variant="outline">
                      {client.categoria_estabelecimento_id === 1 ? 'Restaurante' : 
                       client.categoria_estabelecimento_id === 2 ? 'Bar' : 
                       client.categoria_estabelecimento_id === 3 ? 'Cafeteria' : 
                       client.categoria_estabelecimento_id === 4 ? 'Lanchonete' : 
                       client.categoria_estabelecimento_id === 5 ? 'Padaria' : 
                       client.categoria_estabelecimento_id === 6 ? 'Conveniência' : 'Outro'}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhum cliente inativo nos últimos 30 dias</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full text-xs">
              <Link to="/clientes" className="flex items-center justify-center">
                Gerenciar clientes <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-red-600" />
              Produção Não Realizada
            </CardTitle>
            <CardDescription>Planejamento de produção não cumprido</CardDescription>
          </CardHeader>
          <CardContent>
            {missingProduction.length > 0 ? (
              <ul className="space-y-2">
                {missingProduction.map((item, index) => (
                  <li key={index} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{item.produto}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.data).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">{item.planejado} unidades</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhuma produção atrasada</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full text-xs">
              <Link to="/pcp" className="flex items-center justify-center">
                Ir para PCP <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Produtos com Baixo Volume
            </CardTitle>
            <CardDescription>Produtos com volume abaixo da média</CardDescription>
          </CardHeader>
          <CardContent>
            {lowVolumeProducts.length > 0 ? (
              <ul className="space-y-2">
                {lowVolumeProducts.map((product, index) => (
                  <li key={index} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{product.nome}</span>
                    <div className="text-right">
                      <span className="font-bold">{product.giroSemanal}</span>
                      <span className="text-muted-foreground"> / {product.mediaGlobal}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhum produto com baixo volume</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full text-xs">
              <Link to="/precificacao" className="flex items-center justify-center">
                Ver produtos <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              Estoque Crítico
            </CardTitle>
            <CardDescription>Itens abaixo do estoque mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <ul className="space-y-2">
                {lowStockItems.map((item, index) => (
                  <li key={index} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{item.item}</span>
                    <div className="text-right">
                      <span className="font-bold text-red-500">{item.estoque}</span>
                      <span className="text-muted-foreground"> / min {item.minimo}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhum item com estoque crítico</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full text-xs">
              <Link to="/estoque" className="flex items-center justify-center">
                Gerenciar estoque <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Existem {inactiveClients.length} clientes inativos, {missingProduction.length} produções não realizadas,
          {lowVolumeProducts.length} produtos com baixo volume e {lowStockItems.length} itens com estoque crítico.
          Verifique as pendências para evitar impactos na operação.
        </AlertDescription>
      </Alert>
    </div>
  );
}
