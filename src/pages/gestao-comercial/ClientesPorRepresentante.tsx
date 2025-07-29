
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, User, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { Cliente } from "@/types";

export default function ClientesPorRepresentante() {
  const { clientes, loading: clientesLoading, carregarClientes } = useClienteStore();
  const { representantes, loading: representantesLoading, carregarRepresentantes } = useSupabaseRepresentantes();
  
  const [representanteSelecionado, setRepresentanteSelecionado] = useState<string>("todos");
  const [filtroNome, setFiltroNome] = useState("");

  useEffect(() => {
    carregarClientes();
    carregarRepresentantes();
  }, []);

  // Filtrar clientes por representante e nome
  const clientesFiltrados = clientes.filter((cliente: Cliente) => {
    const matchRepresentante = representanteSelecionado === "todos" || 
      cliente.representanteId?.toString() === representanteSelecionado;
    
    const matchNome = filtroNome === "" || 
      cliente.nome.toLowerCase().includes(filtroNome.toLowerCase());

    return matchRepresentante && matchNome;
  });

  // Agrupar clientes por representante
  const clientesPorRepresentante = representantes.reduce((acc, rep) => {
    const clientesDoRep = clientes.filter(cliente => cliente.representanteId === rep.id);
    acc[rep.id] = {
      representante: rep,
      clientes: clientesDoRep,
      totalClientes: clientesDoRep.length,
      clientesAtivos: clientesDoRep.filter(c => c.statusCliente === 'Ativo').length,
      giroTotal: clientesDoRep.reduce((sum, c) => sum + (c.giroMedioSemanal || 0), 0)
    };
    return acc;
  }, {} as any);

  // Clientes sem representante
  const clientesSemRepresentante = clientes.filter(cliente => !cliente.representanteId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800';
      case 'Em análise': return 'bg-yellow-100 text-yellow-800';
      case 'Inativo': return 'bg-red-100 text-red-800';
      case 'A ativar': return 'bg-blue-100 text-blue-800';
      case 'Standby': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (clientesLoading || representantesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo por Representante */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {representantes.map((rep) => {
          const dados = clientesPorRepresentante[rep.id];
          return (
            <Card key={rep.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {rep.nome}
                </CardTitle>
                <CardDescription className="text-sm">
                  {rep.email && (
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" />
                      {rep.email}
                    </div>
                  )}
                  {rep.telefone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {rep.telefone}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Clientes:</span>
                    <span className="font-medium">{dados?.totalClientes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Clientes Ativos:</span>
                    <span className="font-medium text-green-600">{dados?.clientesAtivos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Giro Semanal Total:</span>
                    <span className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {dados?.giroTotal || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Select value={representanteSelecionado} onValueChange={setRepresentanteSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um representante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Representantes</SelectItem>
                  <SelectItem value="sem-representante">Sem Representante</SelectItem>
                  {representantes.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>
                      {rep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={filtroNome}
                  onChange={(e) => setFiltroNome(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Clientes {representanteSelecionado === "todos" ? "- Todos" : 
                     representanteSelecionado === "sem-representante" ? "- Sem Representante" :
                     `- ${representantes.find(r => r.id.toString() === representanteSelecionado)?.nome}`}
          </CardTitle>
          <CardDescription>
            {representanteSelecionado === "sem-representante" ? 
              `${clientesSemRepresentante.length} clientes sem representante atribuído` :
              `${clientesFiltrados.length} clientes encontrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Giro Semanal</TableHead>
                <TableHead className="text-right">Meta Semanal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(representanteSelecionado === "sem-representante" ? clientesSemRepresentante : clientesFiltrados)
                .map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{cliente.nome}</div>
                      {cliente.cnpjCpf && (
                        <div className="text-sm text-muted-foreground">{cliente.cnpjCpf}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {cliente.contatoNome && (
                        <div className="text-sm">{cliente.contatoNome}</div>
                      )}
                      {cliente.contatoTelefone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.contatoTelefone}
                        </div>
                      )}
                      {cliente.contatoEmail && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.contatoEmail}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cliente.enderecoEntrega ? (
                      <div className="text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {cliente.enderecoEntrega}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(cliente.statusCliente)}>
                      {cliente.statusCliente}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {cliente.giroMedioSemanal || 0}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {cliente.metaGiroSemanal || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(representanteSelecionado === "sem-representante" ? clientesSemRepresentante : clientesFiltrados).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {representanteSelecionado === "sem-representante" 
                ? "Não há clientes sem representante atribuído"
                : "Nenhum cliente encontrado com os filtros selecionados"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
