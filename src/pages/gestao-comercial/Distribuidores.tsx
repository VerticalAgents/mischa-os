
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Eye, MapPin, Phone } from "lucide-react";

// Types
interface Distribuidor {
  id: string;
  nome: string;
  regiao: string;
  pdvsVinculados?: string[];
  contato: string;
  telefone: string;
  cnpj: string;
  status: "ativo" | "inativo";
  observacoes: string;
}

export default function Distribuidores() {
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ativo" | "inativo">("");

  // Mock data for initial render
  useState(() => {
    const mockData: Distribuidor[] = [
      {
        id: "1",
        nome: "Distribuição Sul",
        regiao: "Porto Alegre e Região",
        pdvsVinculados: ["Mercado A", "Supermercado B", "Mini Mercado C"],
        contato: "Roberto Silva",
        telefone: "(51) 98765-4321",
        cnpj: "12.345.678/0001-90",
        status: "ativo",
        observacoes: "Entrega em até 24h após pedido",
      },
      {
        id: "2",
        nome: "Distribuidora Norte",
        regiao: "Canoas, Esteio, Sapucaia",
        pdvsVinculados: ["Mercearia X", "Mercado Y"],
        contato: "Paula Moreira",
        telefone: "(51) 91234-5678",
        cnpj: "98.765.432/0001-10",
        status: "ativo",
        observacoes: "Prefere pedidos programados",
      },
      {
        id: "3",
        nome: "Distribuidora Central",
        regiao: "Centro de Porto Alegre",
        contato: "João Souza",
        telefone: "(51) 94321-8765",
        cnpj: "45.678.901/0001-23",
        status: "inativo",
        observacoes: "Contrato encerrado em janeiro/2024",
      }
    ];
    
    setDistribuidores(mockData);
  }, []);

  const filteredDistribuidores = distribuidores.filter(distribuidor => {
    const matchesSearch = distribuidor.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         distribuidor.regiao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || distribuidor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex gap-3">
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar distribuidores..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 rounded-md border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | "ativo" | "inativo")}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Distribuidor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PDVs</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDistribuidores.map((distribuidor) => (
                <TableRow key={distribuidor.id}>
                  <TableCell className="font-medium">{distribuidor.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span>{distribuidor.regiao}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{distribuidor.contato}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {distribuidor.telefone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{distribuidor.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant={distribuidor.status === "ativo" ? "default" : "outline"}>
                      {distribuidor.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {distribuidor.pdvsVinculados ? distribuidor.pdvsVinculados.length : 0}
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
