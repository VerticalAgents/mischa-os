
import { ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RetrospectiveItem {
  idSabor: number;
  nomeSabor: string;
  totalUnidades: number;
  formasNecessarias: number;
  percentualTotal: number;
  crescimento: number;
}

interface RetrospectiveTabProps {
  retrospectiva: RetrospectiveItem[];
}

export default function RetrospectiveTab({ retrospectiva }: RetrospectiveTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Retrospectiva dos Últimos 30 Dias</CardTitle>
          <CardDescription>
            Produção histórica e variação percentual
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-8">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar
          </Button>
          <Select defaultValue="units" onValueChange={() => {}}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="units">Unidades</SelectItem>
              <SelectItem value="growth">Crescimento</SelectItem>
              <SelectItem value="percentage">Percentual</SelectItem>
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
              <TableHead className="text-right">Crescimento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {retrospectiva.map((item) => (
              <TableRow key={item.idSabor}>
                <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                <TableCell className="text-right">{item.totalUnidades}</TableCell>
                <TableCell className="text-right">{item.formasNecessarias}</TableCell>
                <TableCell className="text-right">
                  {item.percentualTotal.toFixed(1)}%
                </TableCell>
                <TableCell className={`text-right font-medium ${item.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.crescimento > 0 ? '+' : ''}{item.crescimento.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {retrospectiva.reduce((sum, item) => sum + item.totalUnidades, 0)}
              </TableCell>
              <TableCell className="text-right">
                {retrospectiva.reduce((sum, item) => sum + item.formasNecessarias, 0)}
              </TableCell>
              <TableCell className="text-right">100%</TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
