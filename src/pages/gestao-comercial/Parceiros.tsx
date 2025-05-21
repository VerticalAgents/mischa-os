
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Eye, Calendar, Instagram, Globe } from "lucide-react";
import { format } from "date-fns";

// Types
type TipoParceiro = "influenciador" | "evento" | "empresa" | "outro";

interface Parceiro {
  id: string;
  nome: string;
  tipo: TipoParceiro;
  canalPrincipal: string;
  dataInicio: Date;
  dataFim?: Date;
  acordo: string;
  status: "ativo" | "encerrado";
  observacoes: string;
}

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoParceiro | "">("");
  const [statusFilter, setStatusFilter] = useState<"" | "ativo" | "encerrado">("");

  // Initialize parceiros with mock data
  useEffect(() => {
    const mockData: Parceiro[] = [
      {
        id: "1",
        nome: "@confeitaria_gourmet",
        tipo: "influenciador",
        canalPrincipal: "Instagram",
        dataInicio: new Date("2024-01-15"),
        dataFim: new Date("2024-07-15"),
        acordo: "2 posts por mês + stories, 10 produtos/mês",
        status: "ativo",
        observacoes: "70K seguidores, público feminino",
      },
      {
        id: "2",
        nome: "Festival Gastronômico POA",
        tipo: "evento",
        canalPrincipal: "Evento Presencial",
        dataInicio: new Date("2024-06-10"),
        dataFim: new Date("2024-06-12"),
        acordo: "Estande patrocinado + 500 amostras",
        status: "ativo",
        observacoes: "Público estimado: 10.000 pessoas",
      },
      {
        id: "3",
        nome: "Restaurante Sabor Natural",
        tipo: "empresa",
        canalPrincipal: "B2B",
        dataInicio: new Date("2023-09-01"),
        dataFim: new Date("2024-02-29"),
        acordo: "Fornecimento exclusivo de sobremesas, logo em cardápio",
        status: "encerrado",
        observacoes: "Não renovado devido a mudança de gestão do restaurante",
      }
    ];
    
    setParceiros(mockData);
  }, []);

  const filteredParceiros = parceiros.filter(parceiro => {
    const matchesSearch = parceiro.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "" || parceiro.tipo === tipoFilter;
    const matchesStatus = statusFilter === "" || parceiro.status === statusFilter;
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const getTipoLabel = (tipo: TipoParceiro): string => {
    const labels = {
      influenciador: "Influenciador",
      evento: "Evento",
      empresa: "Empresa",
      outro: "Outro"
    };
    return labels[tipo];
  };

  const getCanalIcon = (canal: string) => {
    if (canal.toLowerCase().includes("instagram")) return <Instagram className="h-4 w-4 mr-1" />;
    if (canal.toLowerCase().includes("evento")) return <Calendar className="h-4 w-4 mr-1" />;
    return <Globe className="h-4 w-4 mr-1" />;
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiros..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 rounded-md border"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoParceiro | "")}
          >
            <option value="">Todos os tipos</option>
            <option value="influenciador">Influenciadores</option>
            <option value="evento">Eventos</option>
            <option value="empresa">Empresas</option>
            <option value="outro">Outros</option>
          </select>
          <select 
            className="px-3 py-2 rounded-md border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "ativo" | "encerrado")}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="encerrado">Encerrados</option>
          </select>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Acordo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParceiros.map((parceiro) => (
                <TableRow key={parceiro.id}>
                  <TableCell className="font-medium">{parceiro.nome}</TableCell>
                  <TableCell>{getTipoLabel(parceiro.tipo)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getCanalIcon(parceiro.canalPrincipal)}
                      <span>{parceiro.canalPrincipal}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>
                        {format(parceiro.dataInicio, "dd/MM/yyyy")} - 
                        {parceiro.dataFim ? format(parceiro.dataFim, "dd/MM/yyyy") : "Atual"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={parceiro.acordo}>
                    {parceiro.acordo}
                  </TableCell>
                  <TableCell>
                    <Badge variant={parceiro.status === "ativo" ? "default" : "outline"}>
                      {parceiro.status === "ativo" ? "Ativo" : "Encerrado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
