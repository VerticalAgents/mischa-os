
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, PackageCheck, AlertTriangle } from "lucide-react";

export default function Estoque() {
  const { produtos } = useProdutoStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [estoque, setEstoque] = useState<Record<number, number>>(() => {
    // Initialize with mock data or load from localStorage
    const savedEstoque = localStorage.getItem("produtosEstoque");
    return savedEstoque ? JSON.parse(savedEstoque) : 
      produtos.reduce((acc, produto) => {
        acc[produto.id] = Math.floor(Math.random() * 50); // Random initial stock for demo
        return acc;
      }, {} as Record<number, number>);
  });

  // Filter products based on search term
  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update stock quantity
  const updateEstoque = (produtoId: number, quantidade: number) => {
    setEstoque(prev => {
      const updated = { ...prev, [produtoId]: quantidade };
      localStorage.setItem("produtosEstoque", JSON.stringify(updated));
      return updated;
    });
  };

  // Get stock status for styling
  const getEstoqueStatus = (quantidade: number) => {
    if (quantidade <= 5) return "low";
    if (quantidade <= 15) return "medium";
    return "good";
  };

  return (
    <>
      <PageHeader 
        title="Estoque" 
        description="Gerencie as quantidades disponíveis em estoque de cada produto"
      />
      
      <div className="mt-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Controle de Estoque</h2>
            <p className="text-muted-foreground">Gerencie as quantidades disponíveis em estoque</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-[300px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{produtos.length}</div>
              <p className="text-xs text-muted-foreground">produtos cadastrados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(estoque).filter(qty => qty > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">produtos com unidades disponíveis</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Produtos com Baixo Estoque</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(estoque).filter(qty => qty <= 5 && qty > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">produtos com 5 unidades ou menos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Peso Unitário</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.length > 0 ? (
                  filteredProdutos.map(produto => {
                    const quantidade = estoque[produto.id] || 0;
                    const status = getEstoqueStatus(quantidade);
                    
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{produto.nome}</div>
                            {produto.descricao && (
                              <div className="text-sm text-muted-foreground">{produto.descricao}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{produto.pesoUnitario}g</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Badge 
                              className={`${
                                status === 'low' 
                                  ? 'bg-red-100 text-red-800' 
                                  : status === 'medium' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {quantidade} unidades
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateEstoque(produto.id, Math.max(0, quantidade - 1))}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={quantidade}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                  updateEstoque(produto.id, value);
                                }
                              }}
                              className="w-20 text-center"
                              min="0"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateEstoque(produto.id, quantidade + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      {searchTerm 
                        ? "Nenhum produto encontrado com o termo buscado" 
                        : "Nenhum produto cadastrado"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
