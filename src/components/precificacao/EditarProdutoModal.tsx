import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProdutos, ProdutoCompleto, ComponenteProduto } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";

interface EditarProdutoModalProps {
  produto: ProdutoCompleto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditarProdutoModal({ produto, isOpen, onClose, onSuccess }: EditarProdutoModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [unidadesProducao, setUnidadesProducao] = useState(1);
  const [pesoUnitario, setPesoUnitario] = useState<number | undefined>();
  const [precoVenda, setPrecoVenda] = useState<number | undefined>();
  const [categoriaId, setCategoriaId] = useState<number | undefined>();
  const [subcategoriaId, setSubcategoriaId] = useState<number | undefined>();
  const [componentes, setComponentes] = useState<ComponenteProduto[]>([]);
  const [novoComponenteTipo, setNovoComponenteTipo] = useState<'receita' | 'insumo'>('receita');
  const [novoComponenteItemId, setNovoComponenteItemId] = useState("");
  const [novoComponenteQuantidade, setNovoComponenteQuantidade] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { atualizarProduto, removerComponenteProduto, adicionarComponenteProduto, carregarProdutoCompleto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias, getSubcategoriasPorCategoria } = useSupabaseSubcategoriasProduto();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();

  // Filtrar subcategorias pela categoria selecionada usando a função do hook
  const subcategoriasFiltradas = categoriaId ? getSubcategoriasPorCategoria(categoriaId) : [];

  // Resetar subcategoria quando categoria mudar
  useEffect(() => {
    if (categoriaId && subcategoriaId) {
      const subcategoriaValida = subcategoriasFiltradas.find(sub => sub.id === subcategoriaId);
      if (!subcategoriaValida) {
        setSubcategoriaId(undefined);
      }
    }
  }, [categoriaId, subcategoriasFiltradas, subcategoriaId]);

  // Carregar dados do produto e componentes
  useEffect(() => {
    const carregarDadosProduto = async () => {
      if (isOpen && produto) {
        console.log('Carregando dados do produto:', produto);
        setNome(produto.nome);
        setDescricao(produto.descricao || "");
        setAtivo(produto.ativo);
        setUnidadesProducao(produto.unidades_producao);
        setPesoUnitario(produto.peso_unitario || undefined);
        setPrecoVenda(produto.preco_venda || undefined);
        setCategoriaId(produto.categoria_id || undefined);
        setSubcategoriaId(produto.subcategoria_id || undefined);
        
        // Carregar produto completo com componentes
        const produtoCompleto = await carregarProdutoCompleto(produto.id);
        
        if (produtoCompleto?.componentes) {
          // Os componentes já vêm com nomes e custos corretos do hook
          setComponentes(produtoCompleto.componentes);
        } else {
          setComponentes([]);
        }
        
        setNovoComponenteTipo('receita');
        setNovoComponenteItemId("");
        setNovoComponenteQuantidade(1);
      }
    };

    carregarDadosProduto();
  }, [isOpen, produto, carregarProdutoCompleto]);

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setAtivo(true);
    setUnidadesProducao(1);
    setPesoUnitario(undefined);
    setPrecoVenda(undefined);
    setCategoriaId(undefined);
    setSubcategoriaId(undefined);
    setComponentes([]);
    setNovoComponenteTipo('receita');
    setNovoComponenteItemId("");
    setNovoComponenteQuantidade(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSalvar = async () => {
    if (!produto || !nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do produto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const custoTotal = calcularCustoTotal();
      const custoUnitario = calcularCustoUnitario();
      const margemLucro = calcularMargemLucro();

      await atualizarProduto(produto.id, {
        nome,
        descricao,
        ativo,
        unidades_producao: unidadesProducao,
        peso_unitario: pesoUnitario,
        preco_venda: precoVenda,
        categoria_id: categoriaId,
        subcategoria_id: subcategoriaId,
        custo_total: custoTotal,
        custo_unitario: custoUnitario,
        margem_lucro: margemLucro,
      });

      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarComponente = async () => {
    if (!produto || !novoComponenteItemId || novoComponenteQuantidade <= 0) {
      toast({
        title: "Erro de validação",
        description: "Selecione um item e quantidade válida",
        variant: "destructive",
      });
      return;
    }

    try {
      await adicionarComponenteProduto(produto.id, novoComponenteItemId, novoComponenteTipo, novoComponenteQuantidade);

      toast({
        title: "Componente adicionado",
        description: "Componente adicionado com sucesso",
      });

      onSuccess();
      setNovoComponenteItemId("");
      setNovoComponenteQuantidade(1);
    } catch (error) {
      console.error('Erro ao adicionar componente:', error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o componente",
        variant: "destructive",
      });
    }
  };

  const handleRemoverComponente = async (componenteId: string) => {
    if (!produto) return;

    if (confirm("Tem certeza que deseja remover este componente?")) {
      try {
        await removerComponenteProduto(componenteId);
        
        toast({
          title: "Componente removido",
          description: "Componente removido com sucesso",
        });

        onSuccess();
      } catch (error) {
        console.error('Erro ao remover componente:', error);
        toast({
          title: "Erro ao remover",
          description: "Não foi possível remover o componente",
          variant: "destructive",
        });
      }
    }
  };

  const calcularCustoTotal = () => {
    return componentes.reduce((total, comp) => total + (comp.custo_item * comp.quantidade), 0);
  };

  const calcularCustoUnitario = () => {
    const custoTotal = calcularCustoTotal();
    return unidadesProducao > 0 ? custoTotal / unidadesProducao : 0;
  };

  const calcularMargemLucro = () => {
    const custoUnit = calcularCustoUnitario();
    if (precoVenda && custoUnit > 0) {
      return ((precoVenda - custoUnit) / precoVenda) * 100;
    }
    return 0;
  };

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Editar Produto: {produto.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          <Tabs defaultValue="dados" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
              <TabsTrigger value="componentes">Componentes</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto min-h-0">
              <TabsContent value="dados" className="space-y-4 mt-4 px-1 h-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidades">Unidades/Produção</Label>
                    <Input
                      id="unidades"
                      type="number"
                      min="1"
                      value={unidadesProducao}
                      onChange={(e) => setUnidadesProducao(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição do produto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select 
                      value={categoriaId?.toString() || ""} 
                      onValueChange={(value) => {
                        const newCategoriaId = value ? parseInt(value) : undefined;
                        setCategoriaId(newCategoriaId);
                        // Reset subcategoria when category changes
                        if (newCategoriaId !== categoriaId) {
                          setSubcategoriaId(undefined);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id.toString()}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategoria">Subcategoria</Label>
                    <Select 
                      value={subcategoriaId?.toString() || ""} 
                      onValueChange={(value) => setSubcategoriaId(value ? parseInt(value) : undefined)}
                      disabled={!categoriaId || subcategoriasFiltradas.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !categoriaId 
                            ? "Selecione uma categoria primeiro" 
                            : subcategoriasFiltradas.length === 0 
                              ? "Nenhuma subcategoria disponível" 
                              : "Selecione uma subcategoria"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoriasFiltradas.map(subcategoria => (
                          <SelectItem key={subcategoria.id} value={subcategoria.id.toString()}>
                            {subcategoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso Unitário (g)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      min="0"
                      value={pesoUnitario || ""}
                      onChange={(e) => setPesoUnitario(parseFloat(e.target.value) || undefined)}
                      placeholder="0.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço de Venda (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      value={precoVenda || ""}
                      onChange={(e) => setPrecoVenda(parseFloat(e.target.value) || undefined)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={ativo}
                    onCheckedChange={setAtivo}
                  />
                  <Label htmlFor="ativo">Produto ativo</Label>
                </div>

                {/* Resumo de custos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo de Custos</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Custo Total</Label>
                      <div className="text-lg font-semibold">R$ {calcularCustoTotal().toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Custo Unitário</Label>
                      <div className="text-lg font-semibold">R$ {calcularCustoUnitario().toFixed(2)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Margem de Lucro</Label>
                      <div className="text-lg font-semibold">
                        <Badge variant={calcularMargemLucro() > 20 ? "default" : calcularMargemLucro() > 10 ? "secondary" : "destructive"}>
                          {calcularMargemLucro().toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="componentes" className="space-y-4 mt-4 px-1 h-full">
                <Card>
                  <CardHeader>
                    <CardTitle>Adicionar Componente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={novoComponenteTipo} onValueChange={(value: 'receita' | 'insumo') => setNovoComponenteTipo(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receita">Receita</SelectItem>
                            <SelectItem value="insumo">Insumo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Item</Label>
                        <Select value={novoComponenteItemId} onValueChange={setNovoComponenteItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {novoComponenteTipo === 'receita' 
                              ? receitas.map(receita => (
                                  <SelectItem key={receita.id} value={receita.id}>
                                    {receita.nome}
                                  </SelectItem>
                                ))
                              : insumos.map(insumo => (
                                  <SelectItem key={insumo.id} value={insumo.id}>
                                    {insumo.nome}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={novoComponenteQuantidade}
                          onChange={(e) => setNovoComponenteQuantidade(parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button onClick={handleAdicionarComponente} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Componentes Atuais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {componentes.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Nenhum componente adicionado
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Custo Unit.</TableHead>
                              <TableHead>Custo Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {componentes.map((componente) => (
                              <TableRow key={componente.id}>
                                <TableCell>
                                  <Badge variant={componente.tipo === 'receita' ? 'default' : 'secondary'}>
                                    {componente.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell>{componente.nome_item}</TableCell>
                                <TableCell>{componente.quantidade}</TableCell>
                                <TableCell>R$ {componente.custo_item.toFixed(2)}</TableCell>
                                <TableCell>R$ {(componente.custo_item * componente.quantidade).toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoverComponente(componente.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
