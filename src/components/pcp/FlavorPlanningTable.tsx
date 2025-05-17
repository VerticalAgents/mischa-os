
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlavorPlan {
  idSabor: number;
  nomeSabor: string;
  totalUnidadesAgendadas: number;
  formasNecessarias: number;
  estoqueAtual?: number;
  saldo?: number;
  status?: string;
}

interface FlavorPlanningTableProps {
  saboresAtivos: FlavorPlan[];
  saboresInativos: FlavorPlan[];
  estoqueAtual: Record<number, number>;
  atualizarEstoqueAtual: (idSabor: number, quantidade: number) => void;
  getTotalUnidadesAgendadas: () => number;
  getTotalFormasNecessarias: () => number;
}

export default function FlavorPlanningTable({
  saboresAtivos,
  saboresInativos,
  estoqueAtual,
  atualizarEstoqueAtual,
  getTotalUnidadesAgendadas,
  getTotalFormasNecessarias
}: FlavorPlanningTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planejamento por Sabor</CardTitle>
          <CardDescription>
            Sabores ativos e com produção planejada
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Estoque
          </Button>
          <Select value="all" onValueChange={() => {}}>
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os sabores</SelectItem>
              <SelectItem value="active">Sabores ativos</SelectItem>
              <SelectItem value="surplus">Com sobra</SelectItem>
              <SelectItem value="deficit">Com déficit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sabor</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Formas</TableHead>
              <TableHead className="text-right">% do Total</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Sobra/Déficit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {saboresAtivos.length > 0 ? (
              saboresAtivos.map(item => (
                <TableRow key={item.idSabor}>
                  <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                  <TableCell className="text-right">{item.totalUnidadesAgendadas}</TableCell>
                  <TableCell className="text-right">{item.formasNecessarias}</TableCell>
                  <TableCell className="text-right">
                    {Math.round((item.totalUnidadesAgendadas / getTotalUnidadesAgendadas()) * 100)}%
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={estoqueAtual[item.idSabor] || 0}
                      onChange={(e) => atualizarEstoqueAtual(item.idSabor, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-right ml-auto"
                    />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${item.saldo && item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.saldo && item.saldo > 0 ? '+' : ''}{item.saldo}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Clique em "Calcular Produção" para ver o planejamento
                </TableCell>
              </TableRow>
            )}
            {saboresAtivos.length > 0 && (
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{getTotalUnidadesAgendadas()}</TableCell>
                <TableCell className="text-right">{getTotalFormasNecessarias()}</TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {saboresInativos.length > 0 && (
          <>
            <h3 className="font-medium text-sm mt-8 mb-2">Sabores inativos (sem produção nos últimos 30 dias)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sabor</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saboresInativos.map(item => (
                  <TableRow key={item.idSabor}>
                    <TableCell className="font-medium text-muted-foreground">{item.nomeSabor}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={estoqueAtual[item.idSabor] || 0}
                        onChange={(e) => atualizarEstoqueAtual(item.idSabor, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-right ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">Inativo</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
