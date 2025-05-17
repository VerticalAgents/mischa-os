
import { format, isToday } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Sabor } from "@/types";

interface DailyNeed {
  data: Date;
  diaSemana: string;
  totalUnidades: number;
  formasNecessarias: number;
  saboresArray: {
    idSabor: number;
    nomeSabor: string;
    quantidade: number;
  }[];
}

interface DailyNeedsTabProps {
  necessidadeDiaria: DailyNeed[];
  sabores: Sabor[];
  mostrarPedidosPrevistos: boolean;
  setMostrarPedidosPrevistos: (mostrar: boolean) => void;
}

export default function DailyNeedsTab({
  necessidadeDiaria,
  sabores,
  mostrarPedidosPrevistos,
  setMostrarPedidosPrevistos
}: DailyNeedsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Necessidade Diária por Data</CardTitle>
          <CardDescription>
            Distribuição de unidades por dia e sabor
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="contabilizarPrevisao"
              checked={mostrarPedidosPrevistos}
              onCheckedChange={setMostrarPedidosPrevistos}
            />
            <label htmlFor="contabilizarPrevisao" className="text-sm">
              Contabilizar previsão
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Formas</TableHead>
                {sabores.filter(s => s.ativo).map(sabor => (
                  <TableHead key={sabor.id} className="text-right">{sabor.nome.substring(0, 1)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {necessidadeDiaria.map((dia, index) => (
                <TableRow key={index} className={isToday(dia.data) ? 'bg-primary/10' : ''}>
                  <TableCell>{format(dia.data, "dd/MM")}</TableCell>
                  <TableCell>{dia.diaSemana}</TableCell>
                  <TableCell className="text-right font-medium">{dia.totalUnidades}</TableCell>
                  <TableCell className="text-right">{dia.formasNecessarias}</TableCell>
                  {sabores.filter(s => s.ativo).map(sabor => {
                    const saborDia = dia.saboresArray.find(s => s.idSabor === sabor.id);
                    return (
                      <TableCell key={sabor.id} className="text-right">
                        {saborDia ? saborDia.quantidade : 0}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={2}>Total no período</TableCell>
                <TableCell className="text-right">
                  {necessidadeDiaria.reduce((sum, dia) => sum + dia.totalUnidades, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {necessidadeDiaria.reduce((sum, dia) => sum + dia.formasNecessarias, 0)}
                </TableCell>
                {sabores.filter(s => s.ativo).map(sabor => (
                  <TableCell key={sabor.id} className="text-right">
                    {necessidadeDiaria.reduce((sum, dia) => {
                      const saborDia = dia.saboresArray.find(s => s.idSabor === sabor.id);
                      return sum + (saborDia ? saborDia.quantidade : 0);
                    }, 0)}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
