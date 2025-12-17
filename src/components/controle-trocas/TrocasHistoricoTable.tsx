import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTrocasStore, TrocaRegistro } from "@/hooks/useTrocasStore";
import { useMotivosTroca } from "@/hooks/useMotivosTroca";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";

export default function TrocasHistoricoTable() {
  const { trocas, loading, carregarTrocas } = useTrocasStore();
  const { motivos } = useMotivosTroca();
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState<string>("todos");

  useEffect(() => {
    carregarTrocas();
  }, [carregarTrocas]);

  const trocasFiltradas = trocas.filter(troca => {
    const matchCliente = !filtroCliente || 
      troca.cliente_nome?.toLowerCase().includes(filtroCliente.toLowerCase()) ||
      troca.produto_nome.toLowerCase().includes(filtroCliente.toLowerCase());
    
    const matchMotivo = filtroMotivo === "todos" || troca.motivo_nome === filtroMotivo;
    
    return matchCliente && matchMotivo;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico de Trocas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente ou produto..."
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroMotivo} onValueChange={setFiltroMotivo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os motivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os motivos</SelectItem>
              {motivos.map(motivo => (
                <SelectItem key={motivo.id} value={motivo.nome}>
                  {motivo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : trocasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma troca encontrada
                  </TableCell>
                </TableRow>
              ) : (
                trocasFiltradas.map((troca) => (
                  <TableRow key={troca.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(troca.data_troca), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{troca.cliente_nome || '-'}</TableCell>
                    <TableCell>{troca.produto_nome}</TableCell>
                    <TableCell className="text-center">{troca.quantidade}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded text-sm">
                        {troca.motivo_nome}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
