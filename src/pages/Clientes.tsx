
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { StatusCliente } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/common/StatusBadge";
import ClienteFormDialog from "@/components/clientes/ClienteFormDialog";

export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { filtros, setFiltroTermo, setFiltroStatus, getClientesFiltrados } = useClienteStore();
  
  const clientes = getClientesFiltrados();

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie os pontos de venda dos seus produtos"
        action={{
          label: "Novo Cliente",
          onClick: handleOpenForm,
        }}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CNPJ/CPF..."
            className="pl-8"
            value={filtros.termo}
            onChange={(e) => setFiltroTermo(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={filtros.status}
          onChange={(e) => setFiltroStatus(e.target.value as StatusCliente | 'Todos')}
        >
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Em análise">Em análise</option>
          <option value="Inativo">Inativo</option>
          <option value="A ativar">A ativar</option>
          <option value="Standby">Standby</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Qtde. Padrão</TableHead>
                <TableHead>Period. (dias)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cnpjCpf || "-"}</TableCell>
                    <TableCell>
                      {cliente.contatoNome || "-"}
                      {cliente.contatoTelefone && <div className="text-xs text-muted-foreground">{cliente.contatoTelefone}</div>}
                    </TableCell>
                    <TableCell>{cliente.quantidadePadrao}</TableCell>
                    <TableCell>{cliente.periodicidadePadrao}</TableCell>
                    <TableCell>
                      <StatusBadge status={cliente.statusCliente} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Implementar ação para visualizar/editar
                          console.log("Visualizar/editar cliente:", cliente.id);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClienteFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </>
  );
}
