
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProdutosPorCategoria } from "@/hooks/useProdutosPorCategoria";
import { toast } from "@/hooks/use-toast";

interface ItemPedido {
  produto: string;
  quantidade: number;
}

interface ProdutoQuantidadeSelectorProps {
  value: ItemPedido[];
  onChange: (itens: ItemPedido[]) => void;
  clienteId: string;
  quantidadeTotal: number;
}

export default function ProdutoQuantidadeSelector({
  value,
  onChange,
  clienteId,
  quantidadeTotal
}: ProdutoQuantidadeSelectorProps) {
  const [showDebug, setShowDebug] = useState(false);
  
  const { 
    produtosFiltrados, 
    categoriasCliente, 
    loading, 
    error,
    carregado,
    carregarDados,
    recarregar
  } = useProdutosPorCategoria(clienteId);

  // Carrega dados automaticamente quando o clienteId muda ou quando o componente é montado
  useEffect(() => {
    if (clienteId) {
      console.log('🔄 Auto-carregando produtos para cliente:', clienteId);
      carregarDados(true); // Force reload para sempre buscar dados atualizados
    }
  }, [clienteId, carregarDados]);

  const adicionarProduto = () => {
    if (produtosFiltrados.length > 0) {
      const novoProduto = produtosFiltrados[0].nome;
      // Remove the restriction that prevents adding multiple products
      onChange([...value, { produto: novoProduto, quantidade: 1 }]);
    }
  };

  const removerProduto = (index: number) => {
    const novosItens = value.filter((_, i) => i !== index);
    onChange(novosItens);
  };

  const atualizarQuantidade = (index: number, quantidade: number) => {
    const novosItens = [...value];
    novosItens[index].quantidade = Math.max(0, quantidade);
    onChange(novosItens);
  };

  const atualizarProduto = (index: number, novoProduto: string) => {
    const novosItens = [...value];
    novosItens[index].produto = novoProduto;
    onChange(novosItens);
  };

  const handleRecarregar = () => {
    recarregar();
    toast({
      title: "Lista atualizada",
      description: "Produtos recarregados com sucesso"
    });
  };

  const handleTentarNovamente = () => {
    carregarDados(true);
  };

  const quantidadeDistribuida = value.reduce((sum, item) => sum + item.quantidade, 0);
  const isValidTotal = quantidadeDistribuida === quantidadeTotal;

  if (loading) {
    return (
      <div className="space-y-4">
        <Label className="text-sm font-medium">Produtos e Quantidades</Label>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm">Carregando produtos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Produtos e Quantidades</Label>
        <div className="flex items-center gap-2">
          {carregado && !error && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecarregar}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar Lista
            </Button>
          )}
          <Collapsible open={showDebug} onOpenChange={setShowDebug}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Ver passo a passo
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      <Collapsible open={showDebug} onOpenChange={setShowDebug}>
        <CollapsibleContent>
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Auditoria do Processo</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>1. Cliente identificado:</strong> {clienteId}
              </div>
              <div>
                <strong>2. Categorias habilitadas:</strong>{' '}
                {categoriasCliente.length > 0 ? (
                  categoriasCliente.map(cat => (
                    <Badge key={cat} variant="secondary" className="ml-1 text-xs">{cat}</Badge>
                  ))
                ) : (
                  <span className="text-red-500">Nenhuma categoria encontrada</span>
                )}
              </div>
              <div>
                <strong>3. Produtos disponíveis:</strong>{' '}
                {produtosFiltrados.length} produtos encontrados
                {produtosFiltrados.slice(0, 3).map(produto => (
                  <Badge key={produto.id} variant="outline" className="ml-1 text-xs">
                    {produto.nome}
                  </Badge>
                ))}
                {produtosFiltrados.length > 3 && (
                  <span className="text-muted-foreground">...</span>
                )}
              </div>
              <div>
                <strong>4. Validação de quantidade:</strong>{' '}
                <span className={isValidTotal ? "text-green-600" : "text-red-500"}>
                  {quantidadeDistribuida} / {quantidadeTotal}
                  {isValidTotal ? " ✓" : " ✗"}
                </span>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>❌ {error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTentarNovamente}
              className="ml-2"
            >
              🔁 Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && produtosFiltrados.length === 0 && carregado && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Nenhum produto disponível para as categorias deste cliente.
            Verifique se o cliente possui categorias habilitadas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={`${index}-${item.produto}`} className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor={`produto-${index}`} className="text-xs">Produto</Label>
              <Select
                value={item.produto}
                onValueChange={(valor) => atualizarProduto(index, valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtosFiltrados.map((produto) => (
                    <SelectItem key={produto.id} value={produto.nome}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label htmlFor={`quantidade-${index}`} className="text-xs">Qtd</Label>
              <Input
                id={`quantidade-${index}`}
                type="number"
                value={item.quantidade}
                onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value) || 0)}
                min="0"
                className="text-center"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removerProduto(index)}
              className="mt-5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={adicionarProduto}
          disabled={produtosFiltrados.length === 0 || Boolean(error)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Produto
        </Button>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Total distribuído: </span>
          <span className={isValidTotal ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
            {quantidadeDistribuida} / {quantidadeTotal}
          </span>
        </div>
      </div>

      {!isValidTotal && quantidadeTotal > 0 && (
        <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            ❌ A soma das quantidades ({quantidadeDistribuida}) deve ser igual ao total do pedido ({quantidadeTotal}).
            Diferença: {Math.abs(quantidadeDistribuida - quantidadeTotal)} unidades.
          </p>
        </div>
      )}
    </div>
  );
}
