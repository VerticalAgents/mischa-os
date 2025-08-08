
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Boxes, PackageCheck, AlertTriangle, ExternalLink, Plus, Minus } from "lucide-react";
import MovimentacaoEstoqueModal from "@/components/estoque/MovimentacaoEstoqueModal";

export default function EstoqueTab() {
  const { produtos } = useProdutoStore();
  const { adicionarMovimentacao, obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [unidadesPorForma, setUnidadesPorForma] = useState(6);
  const [saldos, setSaldos] = useState<Record<number, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{id: string, nome: string} | null>(null);

  // Carregar saldos dos produtos
  const carregarSaldos = async () => {
    const novosSaldos: Record<number, number> = {};
    for (const produto of produtos) {
      const saldo = await obterSaldoProduto(produto.id.toString());
      novosSaldos[produto.id] = saldo;
    }
    setSaldos(novosSaldos);
  };

  useEffect(() => {
    if (produtos.length > 0) {
      carregarSaldos();
    }
  }, [produtos]);

  // Filter products based on search term
  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar movimentação via botões rápidos
  const adicionarMovimentacaoRapida = async (produtoId: number, quantidade: number, tipo: 'entrada' | 'saida') => {
    const sucesso = await adicionarMovimentacao({
      produto_id: produtoId.toString(),
      tipo,
      quantidade: Math.abs(quantidade),
      data_movimentacao: new Date().toISOString(),
      observacao: `${tipo} rápida de ${Math.abs(quantidade)} unidades`
    });

    if (sucesso) {
      await carregarSaldos(); // Recarregar saldos após movimentação
    }
  };

  // Fazer ajuste via campo de entrada
  const fazerAjuste = async (produtoId: number, novoSaldo: number) => {
    const saldoAtual = saldos[produtoId] || 0;
    const delta = novoSaldo - saldoAtual;
    
    if (delta === 0) return; // Nenhuma mudança necessária

    const tipo = delta > 0 ? 'ajuste' : 'saida';
    const quantidade = Math.abs(delta);
    
    const sucesso = await adicionarMovimentacao({
      produto_id: produtoId.toString(),
      tipo,
      quantidade,
      data_movimentacao: new Date().toISOString(),
      observacao: `Ajuste manual de ${saldoAtual} para ${novoSaldo}`
    });

    if (sucesso) {
      await carregarSaldos(); // Recarregar saldos após ajuste
    }
  };

  // Get stock status for styling
  const getEstoqueStatus = (quantidade: number) => {
    if (quantidade <= 5) return "low";
    if (quantidade <= 15) return "medium";
    return "good";
  };

  const handleOpenModal = (produto: any) => {
    setSelectedProduct({ id: produto.id.toString(), nome: produto.nome });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    carregarSaldos(); // Recarregar após fechar modal
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Estoque de Produtos</h2>
          <p className="text-muted-foreground">Gerencie as quantidades disponíveis em estoque</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">Unidades por forma:</label>
            <Input
              type="number"
              value={unidadesPorForma}
              onChange={(e) => setUnidadesPorForma(Math.max(1, parseInt(e.target.value) || 1))}
              className="max-w-[100px]"
              min="1"
            />
          </div>
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[300px]"
          />
          <Button variant="outline" asChild>
            <Link to="/estoque">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver página completa
            </Link>
          </Button>
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
              {Object.values(saldos).filter(qty => qty > 0).length}
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
              {Object.values(saldos).filter(qty => qty <= 5 && qty > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">produtos com 5 unidades ou menos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque</CardTitle>
          <CardDescription>Gerencie as quantidades de cada produto disponível em estoque</CardDescription>
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
                  const quantidade = saldos[produto.id] || 0;
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
                            title={`Remover ${unidadesPorForma} unidades`}
                            onClick={() => adicionarMovimentacaoRapida(produto.id, -unidadesPorForma, 'saida')}
                          >
                            --
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => adicionarMovimentacaoRapida(produto.id, -1, 'saida')}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={quantidade}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                fazerAjuste(produto.id, value);
                              }
                            }}
                            className="w-20 text-center"
                            min="0"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => adicionarMovimentacaoRapida(produto.id, 1, 'entrada')}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title={`Adicionar ${unidadesPorForma} unidades`}
                            onClick={() => adicionarMovimentacaoRapida(produto.id, unidadesPorForma, 'entrada')}
                          >
                            ++
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenModal(produto)}
                          >
                            Movimentar
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

      {selectedProduct && (
        <MovimentacaoEstoqueModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          itemId={selectedProduct.id}
          itemNome={selectedProduct.nome}
          tipoItem="produto"
          onSuccess={handleCloseModal}
        />
      )}
    </div>
  );
}
