
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, AlertTriangle, Settings } from "lucide-react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import EditarInsumoModal from "./EditarInsumoModal";

export default function EstoqueInsumosTab() {
  const { insumos, loading, calcularCustoUnitario } = useSupabaseInsumos();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInsumo, setSelectedInsumo] = useState<any>(null);
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const [editarInsumoOpen, setEditarInsumoOpen] = useState(false);

  // Filtrar insumos com base no termo de pesquisa
  const filteredInsumos = useMemo(() => {
    if (!searchTerm.trim()) return insumos;
    
    const term = searchTerm.toLowerCase();
    return insumos.filter(insumo => 
      insumo.nome.toLowerCase().includes(term) ||
      insumo.categoria.toLowerCase().includes(term)
    );
  }, [insumos, searchTerm]);

  const handleMovimentacao = (insumo: any) => {
    setSelectedInsumo(insumo);
    setMovimentacaoOpen(true);
  };

  const handleEditarInsumo = (insumo: any) => {
    setSelectedInsumo(insumo);
    setEditarInsumoOpen(true);
  };

  const formatarUnidade = (valor: number, unidade: string) => {
    return `${valor.toLocaleString('pt-BR')} ${unidade}`;
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusEstoque = (atual: number = 0, minimo: number = 0) => {
    if (atual <= 0) return { label: "Sem estoque", variant: "destructive" as const };
    if (atual <= minimo) return { label: "Baixo", variant: "destructive" as const };
    if (atual <= minimo * 1.5) return { label: "Médio", variant: "secondary" as const };
    return { label: "Alto", variant: "default" as const };
  };

  if (loading) {
    return <div className="p-4">Carregando insumos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header com pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredInsumos.length} insumo(s) encontrados
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInsumos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredInsumos.filter(i => (i.estoque_atual || 0) <= (i.estoque_minimo || 0)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredInsumos.filter(i => (i.estoque_atual || 0) <= 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque - Insumos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custo Médio</TableHead>
                <TableHead>Custo Unitário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsumos.map((insumo) => {
                const status = getStatusEstoque(insumo.estoque_atual, insumo.estoque_minimo);
                const custoUnitario = calcularCustoUnitario(insumo);
                
                return (
                  <TableRow key={insumo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{insumo.nome}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarInsumo(insumo)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{insumo.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatarUnidade(insumo.estoque_atual || 0, insumo.unidade_medida)}
                    </TableCell>
                    <TableCell>
                      {formatarUnidade(insumo.estoque_minimo || 0, insumo.unidade_medida)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                        {status.variant === "destructive" && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatarMoeda(insumo.custo_medio)}</TableCell>
                    <TableCell>{formatarMoeda(custoUnitario)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMovimentacao(insumo)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Movimentar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <MovimentacaoEstoqueModal
        open={movimentacaoOpen}
        onOpenChange={setMovimentacaoOpen}
        insumo={selectedInsumo}
      />

      <EditarInsumoModal
        open={editarInsumoOpen}
        onOpenChange={setEditarInsumoOpen}
        insumo={selectedInsumo}
      />
    </div>
  );
}
