
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface ProductionIndicatorsProps {
  registrosProducao: any[];
  planejamentoProducao: any[];
}

export default function ProductionIndicators({
  registrosProducao,
  planejamentoProducao
}: ProductionIndicatorsProps) {
  const [productionData, setProductionData] = useState<any[]>([]);
  const [productionComparison, setProductionComparison] = useState<any[]>([]);
  
  // Calculate production indicators
  useEffect(() => {
    // This is a simplified example - in a real app you would process actual data
    // Example data for production chart
    const weeklyData = [
      { name: 'Seg', planejado: 120, realizado: 118 },
      { name: 'Ter', planejado: 150, realizado: 142 },
      { name: 'Qua', planejado: 130, realizado: 125 },
      { name: 'Qui', planejado: 140, realizado: 135 },
      { name: 'Sex', planejado: 180, realizado: 170 },
      { name: 'Sáb', planejado: 100, realizado: 90 },
      { name: 'Dom', planejado: 0, realizado: 0 },
    ];
    
    setProductionData(weeklyData);
    
    // Example data for production comparison table
    const comparisonData = [
      { produto: "Brownie Tradicional", planejado: 450, realizado: 435, diferenca: -3.3 },
      { produto: "Brownie Nutella", planejado: 200, realizado: 192, diferenca: -4.0 },
      { produto: "Brownie Doce de Leite", planejado: 150, realizado: 143, diferenca: -4.7 },
      { produto: "Brownie Oreo", planejado: 120, realizado: 112, diferenca: -6.7 }
    ];
    
    setProductionComparison(comparisonData);
  }, [registrosProducao, planejamentoProducao]);
  
  // Calculate overall completion percentage
  const totalPlanejado = productionComparison.reduce((sum, item) => sum + item.planejado, 0);
  const totalRealizado = productionComparison.reduce((sum, item) => sum + item.realizado, 0);
  const completionPercentage = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Produção Semanal
              </CardTitle>
              <CardDescription>Comparativo de produção diária (planejado vs realizado)</CardDescription>
            </div>
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/pcp" className="flex items-center">
                Ver PCP <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planejado" name="Planejado" fill="#8b5cf6" />
                <Bar dataKey="realizado" name="Realizado" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {completionPercentage >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                Performance de Produção
              </CardTitle>
              <CardDescription>
                {completionPercentage >= 90
                  ? "Produção dentro da meta planejada"
                  : "Produção abaixo do planejado"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Completude geral</div>
                  <div className="text-sm font-medium">{completionPercentage.toFixed(1)}%</div>
                </div>
                <Progress className="h-2 mt-2" value={completionPercentage} />
              </div>
              
              {productionComparison.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{item.produto}</div>
                    <div className="text-sm font-medium">
                      {((item.realizado / item.planejado) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Progress 
                    className="h-2 mt-2" 
                    value={(item.realizado / item.planejado) * 100} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Realizado: {item.realizado}</span>
                    <span>Meta: {item.planejado}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Planejado vs. Realizado</CardTitle>
            <CardDescription>Detalhamento por produto</CardDescription>
          </div>
          <Button variant="ghost" asChild className="text-xs">
            <Link to="/pcp" className="flex items-center">
              Ver planejamento <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Planejado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionComparison.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.produto}</TableCell>
                  <TableCell className="text-right">{item.planejado}</TableCell>
                  <TableCell className="text-right">{item.realizado}</TableCell>
                  <TableCell className={`text-right ${item.diferenca < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {item.diferenca > 0 ? '+' : ''}{item.diferenca}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
