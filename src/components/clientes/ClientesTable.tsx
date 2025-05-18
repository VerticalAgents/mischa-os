
import { ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente, StatusCliente } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/common/StatusBadge";
import { ColumnOption } from "./ClientesFilters";

interface ClientesTableProps {
  clientes: Cliente[];
  visibleColumns: string[];
  columnOptions: ColumnOption[];
  onSelectCliente: (id: number) => void;
}

export default function ClientesTable({
  clientes,
  visibleColumns,
  columnOptions,
  onSelectCliente
}: ClientesTableProps) {
  // Helper para formatar a periodicidade em texto
  const formatPeriodicidade = (dias: number): string => {
    if (dias % 7 === 0) {
      const semanas = dias / 7;
      return semanas === 1 ? "1 semana" : `${semanas} semanas`;
    } else if (dias === 3) {
      return "3x semana";
    } else {
      return `${dias} dias`;
    }
  };

  // Calcular o giro semanal com base na quantidade padrão e periodicidade
  const calcularGiroSemanal = (qtdPadrao: number, periodicidadeDias: number): number => {
    // Para periodicidade em dias, converter para semanas
    if (periodicidadeDias === 3) {
      // Caso especial: 3x por semana
      return qtdPadrao * 3;
    }

    // Para outros casos, calcular giro semanal
    const periodicidadeSemanas = periodicidadeDias / 7;
    return Math.round(qtdPadrao / periodicidadeSemanas);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columnOptions.map(column => visibleColumns.includes(column.id) && (
                <TableHead key={column.id}>{column.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map(cliente => {
                const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
                
                return (
                  <TableRow 
                    key={cliente.id} 
                    className="cursor-pointer" 
                    onClick={() => onSelectCliente(cliente.id)}
                  >
                    {visibleColumns.includes("nome") && (
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                    )}
                    
                    {visibleColumns.includes("cnpjCpf") && (
                      <TableCell>{cliente.cnpjCpf || "-"}</TableCell>
                    )}
                    
                    {visibleColumns.includes("enderecoEntrega") && (
                      <TableCell className="max-w-[200px] truncate">
                        {cliente.enderecoEntrega || "-"}
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("contato") && (
                      <TableCell>
                        {cliente.contatoNome || "-"}
                        {cliente.contatoTelefone && (
                          <div className="text-xs text-muted-foreground">{cliente.contatoTelefone}</div>
                        )}
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("quantidadePadrao") && (
                      <TableCell>{cliente.quantidadePadrao}</TableCell>
                    )}
                    
                    {visibleColumns.includes("periodicidade") && (
                      <TableCell>{formatPeriodicidade(cliente.periodicidadePadrao)}</TableCell>
                    )}
                    
                    {visibleColumns.includes("giroSemanal") && (
                      <TableCell>
                        <Badge variant="outline" className="font-semibold bg-gray-800">
                          {giroSemanal}
                        </Badge>
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("status") && (
                      <TableCell>
                        <StatusBadge status={cliente.statusCliente} />
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("statusAgendamento") && (
                      <TableCell>
                        <Badge variant={
                          cliente.statusAgendamento === "Agendado" ? "default" : 
                          cliente.statusAgendamento === "Pendente" ? "secondary" : "outline"
                        }>
                          {cliente.statusAgendamento || "Não Agendado"}
                        </Badge>
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("proximaDataReposicao") && (
                      <TableCell>
                        {cliente.proximaDataReposicao ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{format(cliente.proximaDataReposicao, "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                    )}
                    
                    {visibleColumns.includes("acoes") && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCliente(cliente.id);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">Ver detalhes</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
