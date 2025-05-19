
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageCheck, Package, ArrowRight } from "lucide-react";

export default function Estoque() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'landing' | 'produtos' | 'insumos'>('landing');

  if (activeView === 'produtos') {
    return <EstoqueProdutos onBack={() => setActiveView('landing')} />;
  }

  if (activeView === 'insumos') {
    return <EstoqueInsumos onBack={() => setActiveView('landing')} />;
  }

  return (
    <>
      <PageHeader 
        title="Estoque" 
        description="Gerencie seus inventários de produtos e insumos."
        icon={<PackageCheck className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8">
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Produtos Acabados
            </CardTitle>
            <CardDescription>
              Estoque de produtos finais prontos para expedição (ex: brownies, kits, combos).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Gerencie as quantidades disponíveis em estoque de cada produto final.
              Configure alertas de estoque mínimo e acompanhe o histórico de movimentações.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveView('produtos')} 
              className="w-full"
            >
              Acessar Produtos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-amber-200 hover:border-amber-400 transition-colors">
          <CardHeader className="bg-amber-50 dark:bg-amber-900/20">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Insumos
            </CardTitle>
            <CardDescription>
              Gestão completa de insumos usados na produção, incluindo estoque, cotações e pedidos de compra.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Gerencie o estoque de insumos, crie cotações, compare fornecedores 
              e mantenha o controle das compras em um único lugar.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveView('insumos')} 
              variant="secondary"
              className="w-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60"
            >
              Acessar Insumos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

function EstoqueProdutos({ onBack }: { onBack: () => void }) {
  // Import the original Estoque component functionality
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
        title="Estoque de Produtos" 
        description="Gerencie as quantidades disponíveis em estoque de cada produto"
        icon={<PackageCheck className="h-5 w-5" />}
        backLink="/estoque"
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

// This is a placeholder, we'll create the real component in another file
function EstoqueInsumos({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  
  // Redirect to the insumos page
  React.useEffect(() => {
    navigate('/estoque/insumos');
  }, [navigate]);
  
  return null;
}

// Missing imports
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Boxes, AlertTriangle } from "lucide-react";
import React from "react";
