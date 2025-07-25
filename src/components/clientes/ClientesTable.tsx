
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle 
} from "lucide-react";
import { Cliente } from "@/types";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/common/StatusBadge";

interface ColumnOption {
  id: string;
  label: string;
  canToggle: boolean;
}

interface ClientesTableProps {
  clientes: Cliente[];
  visibleColumns: string[];
  columnOptions: ColumnOption[];
  onSelectCliente: (id: string) => void;
  onDeleteCliente: (id: string) => void;
  selectedClientes: string[];
  onToggleClienteSelection: (id: string) => void;
  onSelectAllClientes: () => void;
  showSelectionControls: boolean;
}

export default function ClientesTable({
  clientes,
  visibleColumns,
  columnOptions,
  onSelectCliente,
  onDeleteCliente,
  selectedClientes,
  onToggleClienteSelection,
  onSelectAllClientes,
  showSelectionControls,
}: ClientesTableProps) {
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);

  const isColumnVisible = (columnId: string) => {
    return visibleColumns.includes(columnId);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'success';
      case 'Inativo':
        return 'destructive';
      case 'A ativar':
        return 'warning';
      case 'Standby':
        return 'secondary';
      case 'Em análise':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAgendamentoStatusVariant = (status: string) => {
    switch (status) {
      case 'Agendado':
        return 'success';
      case 'Pendente':
        return 'warning';
      case 'Não Agendado':
        return 'secondary';
      case 'Atrasado':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const hasInconsistentData = (cliente: Cliente) => {
    // Verificar se há inconsistência entre ativo e status_cliente
    return (
      (cliente.ativo === false && cliente.statusCliente === 'Ativo') ||
      (cliente.ativo === true && cliente.statusCliente === 'Inativo')
    );
  };

  const renderClienteRow = (cliente: Cliente) => {
    const isInconsistent = hasInconsistentData(cliente);
    
    return (
      <TableRow 
        key={cliente.id}
        className={`hover:bg-muted/50 ${isInconsistent ? 'bg-yellow-50 border-yellow-200' : ''}`}
      >
        {showSelectionControls && (
          <TableCell className="w-12">
            <Checkbox
              checked={selectedClientes.includes(cliente.id)}
              onCheckedChange={() => onToggleClienteSelection(cliente.id)}
            />
          </TableCell>
        )}
        
        {isColumnVisible("nome") && (
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              {cliente.nome}
              {isInconsistent && (
                <AlertTriangle 
                  className="h-4 w-4 text-yellow-500" 
                  title="Dados inconsistentes: verifique status do cliente"
                />
              )}
            </div>
          </TableCell>
        )}
        
        {isColumnVisible("giroSemanal") && (
          <TableCell>
            <div className="text-center">
              <div className="font-medium">{cliente.giroMedioSemanal}</div>
              {cliente.metaGiroSemanal > 0 && (
                <div className="text-xs text-muted-foreground">
                  Meta: {cliente.metaGiroSemanal}
                </div>
              )}
            </div>
          </TableCell>
        )}
        
        {isColumnVisible("cnpjCpf") && (
          <TableCell className="text-muted-foreground">
            {cliente.cnpjCpf || '-'}
          </TableCell>
        )}
        
        {isColumnVisible("enderecoEntrega") && (
          <TableCell className="max-w-[200px] truncate">
            {cliente.enderecoEntrega || '-'}
          </TableCell>
        )}
        
        {isColumnVisible("contato") && (
          <TableCell>
            <div className="space-y-1">
              {cliente.contatoNome && (
                <div className="font-medium text-sm">{cliente.contatoNome}</div>
              )}
              {cliente.contatoTelefone && (
                <div className="text-xs text-muted-foreground">
                  {cliente.contatoTelefone}
                </div>
              )}
              {cliente.contatoEmail && (
                <div className="text-xs text-muted-foreground">
                  {cliente.contatoEmail}
                </div>
              )}
            </div>
          </TableCell>
        )}
        
        {isColumnVisible("quantidadePadrao") && (
          <TableCell className="text-center">
            {cliente.quantidadePadrao}
          </TableCell>
        )}
        
        {isColumnVisible("periodicidade") && (
          <TableCell className="text-center">
            {cliente.periodicidadePadrao}d
          </TableCell>
        )}
        
        {isColumnVisible("status") && (
          <TableCell>
            <StatusBadge 
              status={cliente.statusCliente} 
              variant={getStatusVariant(cliente.statusCliente)}
            />
          </TableCell>
        )}
        
        {isColumnVisible("statusAgendamento") && (
          <TableCell>
            <StatusBadge 
              status={cliente.statusAgendamento || 'Não Agendado'} 
              variant={getAgendamentoStatusVariant(cliente.statusAgendamento || 'Não Agendado')}
            />
          </TableCell>
        )}
        
        {isColumnVisible("proximaDataReposicao") && (
          <TableCell>
            {cliente.proximaDataReposicao ? (
              <div className="text-center">
                {formatDate(cliente.proximaDataReposicao)}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </TableCell>
        )}
        
        {isColumnVisible("acoes") && (
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectCliente(cliente.id)}
                title="Visualizar detalhes"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingClienteId(cliente.id)}
                title="Editar cliente"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteCliente(cliente.id)}
                title="Excluir cliente"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelectionControls && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClientes.length === clientes.length && clientes.length > 0}
                  onCheckedChange={onSelectAllClientes}
                />
              </TableHead>
            )}
            
            {isColumnVisible("nome") && (
              <TableHead>Cliente</TableHead>
            )}
            
            {isColumnVisible("giroSemanal") && (
              <TableHead className="text-center">Giro Semanal</TableHead>
            )}
            
            {isColumnVisible("cnpjCpf") && (
              <TableHead>CNPJ/CPF</TableHead>
            )}
            
            {isColumnVisible("enderecoEntrega") && (
              <TableHead>Endereço</TableHead>
            )}
            
            {isColumnVisible("contato") && (
              <TableHead>Contato</TableHead>
            )}
            
            {isColumnVisible("quantidadePadrao") && (
              <TableHead className="text-center">Qtde. Padrão</TableHead>
            )}
            
            {isColumnVisible("periodicidade") && (
              <TableHead className="text-center">Periodicidade</TableHead>
            )}
            
            {isColumnVisible("status") && (
              <TableHead>Status</TableHead>
            )}
            
            {isColumnVisible("statusAgendamento") && (
              <TableHead>Status Agendamento</TableHead>
            )}
            
            {isColumnVisible("proximaDataReposicao") && (
              <TableHead className="text-center">Próxima Reposição</TableHead>
            )}
            
            {isColumnVisible("acoes") && (
              <TableHead className="text-center">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {clientes.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={visibleColumns.length + (showSelectionControls ? 1 : 0)} 
                className="text-center py-8 text-muted-foreground"
              >
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          ) : (
            clientes.map(renderClienteRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
