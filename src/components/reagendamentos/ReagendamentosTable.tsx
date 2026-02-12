import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ReagendamentoEntreSemanas } from "@/hooks/useReagendamentosEntreSemanas";

interface ReagendamentosTableProps {
  reagendamentos: ReagendamentoEntreSemanas[];
}

export default function ReagendamentosTable({ reagendamentos }: ReagendamentosTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return reagendamentos;
    const term = searchTerm.toLowerCase();
    return reagendamentos.filter((r) =>
      (r.cliente_nome || '').toLowerCase().includes(term)
    );
  }, [reagendamentos, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Original</TableHead>
            <TableHead>Nova Data</TableHead>
            <TableHead>Semanas</TableHead>
            <TableHead>Data do Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum reagendamento entre semanas registrado.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.cliente_nome}</TableCell>
                <TableCell>
                  <Badge variant={r.tipo === 'adiamento' ? 'destructive' : 'default'}>
                    {r.tipo === 'adiamento' ? 'Adiamento' : 'Adiantamento'}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(r.data_original), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(r.data_nova), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={r.semanas_adiadas >= 3 ? "destructive" : r.semanas_adiadas >= 2 ? "secondary" : "outline"}>
                    {r.semanas_adiadas} semana{r.semanas_adiadas !== 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
