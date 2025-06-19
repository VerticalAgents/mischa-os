
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Eye } from "lucide-react";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useClientesCategorias } from "@/hooks/useClientesCategorias";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [categoriasCliente, setCategoriasCliente] = useState<number[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    clienteId: '',
    categorias: [] as number[],
    produtos: [] as any[],
    quantidadeTotal: 0,
    quantidadeDistribuida: 0
  });

  const { produtos } = useProdutoStore();
  const { carregarCategoriasCliente } = useClientesCategorias();

  // Carregar categorias do cliente
  useEffect(() => {
    const carregarCategorias = async () => {
      if (clienteId) {
        try {
          console.log('🔄 Carregando categorias para cliente:', clienteId);
          const categorias = await carregarCategoriasCliente(clienteId);
          console.log('✅ Categorias carregadas:', categorias);
          setCategoriasCliente(categorias);
        } catch (error) {
          console.error('❌ Erro ao carregar categorias:', error);
          setCategoriasCliente([]);
        }
      }
    };

    carregarCategorias();
  }, [clienteId, carregarCategoriasCliente]);

  // Filtrar produtos baseado nas categorias
  useEffect(() => {
    if (categoriasCliente.length > 0) {
      const produtosFiltrados = produtos.filter(produto => 
        categoriasCliente.includes(produto.categoriaId)
      );
      console.log('📦 Produtos filtrados:', produtosFiltrados.map(p => p.nome));
      setProdutosFiltrados(produtosFiltrados);
    } else {
      setProdutosFiltrados([]);
    }
  }, [produtos, categoriasCliente]);

  // Atualizar informações de debug
  useEffect(() => {
    const quantidadeDistribuida = value.reduce((sum, item) => sum + item.quantidade, 0);
    setDebugInfo({
      clienteId,
      categorias: categoriasCliente,
      produtos: produtosFiltrados,
      quantidadeTotal,
      quantidadeDistribuida
    });
  }, [clienteId, categoriasCliente, produtosFiltrados, quantidadeTotal, value]);

  const adicionarProduto = () => {
    if (produtosFiltrados.length > 0) {
      const novoProduto = produtosFiltrados[0].nome;
      if (!value.some(item => item.produto === novoProduto)) {
        onChange([...value, { produto: novoProduto, quantidade: 1 }]);
      }
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

  const quantidadeDistribuida = value.reduce((sum, item) => sum + item.quantidade, 0);
  const isValidTotal = quantidadeDistribuida === quantidadeTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Produtos e Quantidades</Label>
        <Collapsible open={showDebug} onOpenChange={setShowDebug}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Ver passo a passo
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Auditoria do Processo</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div>
                  <strong>1. Cliente identificado:</strong> {debugInfo.clienteId}
                </div>
                <div>
                  <strong>2. Categorias habilitadas:</strong>{' '}
                  {debugInfo.categorias.length > 0 ? (
                    debugInfo.categorias.map(cat => (
                      <Badge key={cat} variant="secondary" className="ml-1 text-xs">{cat}</Badge>
                    ))
                  ) : (
                    <span className="text-red-500">Nenhuma categoria encontrada</span>
                  )}
                </div>
                <div>
                  <strong>3. Produtos disponíveis:</strong>{' '}
                  {debugInfo.produtos.length} produtos encontrados
                  {debugInfo.produtos.slice(0, 3).map(produto => (
                    <Badge key={produto.id} variant="outline" className="ml-1 text-xs">
                      {produto.nome}
                    </Badge>
                  ))}
                  {debugInfo.produtos.length > 3 && (
                    <span className="text-muted-foreground">...</span>
                  )}
                </div>
                <div>
                  <strong>4. Validação de quantidade:</strong>{' '}
                  <span className={isValidTotal ? "text-green-600" : "text-red-500"}>
                    {debugInfo.quantidadeDistribuida} / {debugInfo.quantidadeTotal}
                    {isValidTotal ? " ✓" : " ✗"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Nenhum produto disponível para as categorias deste cliente.
            Verifique se o cliente possui categorias habilitadas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
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
          disabled={produtosFiltrados.length === 0}
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
