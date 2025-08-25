import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseProdutos, ProdutoCompleto, ComponenteProduto } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";

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
  const [novoComponenteQuantidade, setNovoComponenteQuantidade] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [editingComponenteId, setEditingComponenteId] = useState<string | null>(null);
  const [editingQuantidade, setEditingQuantidade] = useState<number>(0);

  const { toast } = useToast();
  const { atualizarProduto, removerComponenteProduto, adicionarComponenteProduto, carregarProdutoCompleto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias, getSubcategoriasPorCategoria } = useSupabaseSubcategoriasProduto();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const { obterRendimentoPorProduto } = useRendimentosReceitaProduto();

  const receitasOptions = useMemo(() => receitas, [receitas]);
  const insumosOptions = useMemo(() => insumos, [insumos]);

  const subcategoriasFiltradas = useMemo(() => {
    if (!categoriaId) return [];
    console.log('🔄 Filtrando subcategorias para categoria:', categoriaId);
    const subcategoriasCategoria = getSubcategoriasPorCategoria(categoriaId);
    console.log('📋 Subcategorias encontradas:', subcategoriasCategoria);
    return subcategoriasCategoria;
  }, [categoriaId, getSubcategoriasPorCategoria]);

  useEffect(() => {
    if (!produto || !isOpen) return;

    console.log('🔄 Carregando dados do produto no modal:', produto);
    
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setAtivo(produto.ativo);
    setUnidadesProducao(produto.unidades_producao);
    setPesoUnitario(produto.peso_unitario || undefined);
    setPrecoVenda(produto.preco_venda || undefined);
    setCategoriaId(produto.categoria_id || undefined);
    setSubcategoriaId(produto.subcategoria_id || undefined);
    
    const carregarComponentes = async () => {
      try {
        const produtoCompleto = await carregarProdutoCompleto(produto.id);
        if (produtoCompleto?.componentes) {
          setComponentes(produtoCompleto.componentes);
        } else {
          setComponentes([]);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar componentes:', error);
        setComponentes([]);
      }
    };

    carregarComponentes();
    
    setNovoComponenteTipo('receita');
    setNovoComponenteItemId("");
    setNovoComponenteQuantidade(100);
    setEditingComponenteId(null);
  }, [produto, isOpen]);

  useEffect(() => {
    if (categoriaId && subcategoriaId) {
      const subcategoriaValida = subcategoriasFiltradas.find(sub => sub.id === subcategoriaId);
      if (!subcategoriaValida) {
        console.log('⚠️ Subcategoria não válida para categoria selecionada, limpando...');
        setSubcategoriaId(undefined);
      }
    }
  }, [categoriaId, subcategoriasFiltradas, subcategoriaId]);

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
    setNovoComponenteQuantidade(100);
    setEditingComponenteId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTipoChange = useCallback((value: 'receita' | 'insumo') => {
    console.log('🔄 Mudando tipo para:', value);
    setNovoComponenteTipo(value);
    setNovoComponenteItemId("");
    setNovoComponenteQuantidade(value === 'receita' ? 100 : 1);
  }, []);

  const handleItemChange = useCallback((value: string) => {
    console.log('🔄 Selecionando item:', value);
    setNovoComponenteItemId(value);
  }, []);

  const handleCategoriaChange = (value: string) => {
    const newCategoriaId = value ? parseInt(value) : undefined;
    console.log('🔄 Mudando categoria para:', newCategoriaId);
    setCategoriaId(newCategoriaId);
    // Limpar subcategoria ao mudar categoria
    setSubcategoriaId(undefined);
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

      const produtoCompleto = await carregarProdutoCompleto(produto.id);
      if (produtoCompleto?.componentes) {
        setComponentes(produtoCompleto.componentes);
      }

      setNovoComponenteItemId("");
      setNovoComponenteQuantidade(novoComponenteTipo === 'receita' ? 100 : 1);
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

        const produtoCompleto = await carregarProdutoCompleto(produto.id);
        if (produtoCompleto?.componentes) {
          setComponentes(produtoCompleto.componentes);
        }
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

  const handleEditarQuantidade = (componenteId: string, quantidadeAtual: number) => {
    setEditingComponenteId(componenteId);
    setEditingQuantidade(quantidadeAtual);
  };

  const handleSalvarQuantidade = async () => {
    if (!produto || !editingComponenteId || editingQuantidade <= 0) return;

    try {
      await removerComponenteProduto(editingComponenteId);
      
      const componenteEditando = componentes.find(c => c.id === editingComponenteId);
      if (!componenteEditando) return;

      await adicionarComponenteProduto(produto.id, componenteEditando.item_id, componenteEditando.tipo, editingQuantidade);

      const produtoCompleto = await carregarProdutoCompleto(produto.id);
      if (produtoCompleto?.componentes) {
        setComponentes(produtoCompleto.componentes);
      }

      setEditingComponenteId(null);
      setEditingQuantidade(0);

      toast({
        title: "Quantidade atualizada",
        description: "Quantidade do componente atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    }
  };

  const handleCancelarEdicao = () => {
    setEditingComponenteId(null);
    setEditingQuantidade(0);
  };

  const calcularCustoTotal = () => {
    return componentes.reduce((total, comp) => total + comp.custo_item, 0);
  };

  const calcularCustoUnitario = () => {
    if (!produto) return 0;
    
    const custoTotal = calcularCustoTotal();
    
    // Buscar o rendimento específico do produto na aba rendimentos
    const rendimentoProduto = obterRendimentoPorProduto(produto.id);
    
    if (rendimentoProduto && rendimentoProduto.rendimento > 0) {
      console.log(`🔍 Usando rendimento específico para produto ${produto.nome}: ${rendimentoProduto.rendimento} unidades`);
      return custoTotal / rendimentoProduto.rendimento;
    }
    
    // Fallback para unidades_producao se não houver rendimento específico
    console.log(`⚠️ Rendimento específico não encontrado para produto ${produto.nome}, usando unidades_producao: ${unidadesProducao}`);
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
                      onValueChange={handleCategoriaChange}
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
                    {categoriaId && subcategoriasFiltradas.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Subcategorias disponíveis: {subcategoriasFiltradas.map(sub => sub.nome).join(', ')}
                      </div>
                    )}
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
                      {produto && obterRendimentoPorProduto(produto.id) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Baseado em {obterRendimentoPorProduto(produto.id)?.rendimento} unidades (rendimento)
                        </div>
                      )}
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
                        <Select 
                          value={novoComponenteTipo} 
                          onValueChange={handleTipoChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[100]">
                            <SelectItem value="receita">Receita</SelectItem>
                            <SelectItem value="insumo">Insumo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Item</Label>
                        <Select 
                          value={novoComponenteItemId} 
                          onValueChange={handleItemChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="z-[100] max-h-60">
                            {novoComponenteTipo === 'receita' 
                              ? receitasOptions.map(receita => (
                                  <SelectItem key={receita.id} value={receita.id}>
                                    {receita.nome} (Rend: {receita.rendimento}g)
                                  </SelectItem>
                                ))
                              : insumosOptions.map(insumo => (
                                  <SelectItem key={insumo.id} value={insumo.id}>
                                    {insumo.nome}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Quantidade {novoComponenteTipo === 'receita' ? '(g)' : '(un)'}
                        </Label>
                        <Input
                          type="number"
                          step={novoComponenteTipo === 'receita' ? "1" : "0.001"}
                          min="0"
                          value={novoComponenteQuantidade}
                          onChange={(e) => setNovoComponenteQuantidade(parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button 
                          onClick={handleAdicionarComponente} 
                          className="w-full"
                          disabled={!novoComponenteItemId || novoComponenteQuantidade <= 0}
                        >
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
                              <TableHead>Ações</TableHead>
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
                                <TableCell>
                                  {editingComponenteId === componente.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        step={componente.tipo === 'receita' ? "1" : "0.001"}
                                        min="0"
                                        value={editingQuantidade}
                                        onChange={(e) => setEditingQuantidade(parseFloat(e.target.value) || 0)}
                                        className="w-20"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleSalvarQuantidade}
                                        disabled={editingQuantidade <= 0}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelarEdicao}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span>
                                        {componente.quantidade} {componente.tipo === 'receita' ? 'g' : 'un'}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditarQuantidade(componente.id, componente.quantidade)}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {componente.tipo === 'receita' ? '-' : `R$ ${componente.custo_item.toFixed(2)}`}
                                </TableCell>
                                <TableCell>R$ {componente.custo_item.toFixed(2)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoverComponente(componente.id)}
                                    disabled={editingComponenteId === componente.id}
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
