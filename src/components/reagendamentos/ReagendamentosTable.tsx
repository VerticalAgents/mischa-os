import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReagendamentoEntreSemanas } from "@/hooks/useReagendamentosEntreSemanas";

interface ReagendamentosTableProps {
  reagendamentos: ReagendamentoEntreSemanas[];
  onExcluir: (id: string) => Promise<void>;
}

export default function ReagendamentosTable({ reagendamentos, onExcluir }: ReagendamentosTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return reagendamentos;
    const term = searchTerm.toLowerCase();
    return reagendamentos.filter((r) =>
      (r.cliente_nome || '').toLowerCase().includes(term)
    );
  }, [reagendamentos, searchTerm]);

  const handleExcluir = async (id: string) => {
    try {
      await onExcluir(id);
      toast.success("Registro excluído com sucesso.");
    } catch {
      toast.error("Erro ao excluir registro.");
    }
  };

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
            <TableHead className="w-[60px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir registro</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este registro de reagendamento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleExcluir(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
