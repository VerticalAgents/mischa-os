
import { useState } from "react";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash } from "lucide-react";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  unidades_producao: z.number().int().positive("Unidades de produção deve ser positivo"),
  peso_unitario: z.number().min(0, "Peso não pode ser negativo").optional(),
  preco_venda: z.number().min(0, "Preço não pode ser negativo").optional(),
});

const componenteSchema = z.object({
  item_id: z.string().min(1, "Item é obrigatório"),
  tipo: z.enum(["receita", "insumo"]),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;
type ComponenteFormValues = z.infer<typeof componenteSchema>;

export default function ProdutosTab() {
  const { produtos, loading, adicionarProduto, adicionarComponenteProduto, removerComponenteProduto, atualizarProduto, removerProduto } = useSupabaseProdutos();
  const { insumos } = useSupabaseInsumos();
  const { receitas } = useSupabaseReceitas();
  
  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [isComponenteDialogOpen, setIsComponenteDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"receita" | "insumo">("insumo");
  
  const produtoForm = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      unidades_producao: 1,
      peso_unitario: 0,
      preco_venda: 0,
    }
  });

  const componenteForm = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteSchema),
    defaultValues: {
      item_id: "",
      tipo: "insumo",
      quantidade: 0,
    }
  });

  const onSubmitProduto = async (values: ProdutoFormValues) => {
    // Garantir que todos os campos obrigatórios estão presentes
    const produtoData = {
      nome: values.nome,
      descricao: values.descricao || "",
      unidades_producao: values.unidades_producao,
      peso_unitario: values.peso_unitario,
      preco_venda: values.preco_venda,
      ativo: true,
    };
    
    const sucesso = await adicionarProduto(produtoData);
    if (sucesso) {
      setIsProdutoDialogOpen(false);
      produtoForm.reset();
    }
  };

  const onSubmitComponente = async (values: ComponenteFormValues) => {
    if (!selectedProduto) return;
    
    const sucesso = await adicionarComponenteProduto(selectedProduto, values.item_id, values.tipo, values.quantidade);
    if (sucesso) {
      setIsComponenteDialogOpen(false);
      componenteForm.reset();
    }
  };

  const handleDeleteProduto = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o produto "${nome}"?`)) {
      await removerProduto(id);
    }
  };

  const handleDeleteComponente = async (componenteId: string) => {
    if (confirm("Tem certeza que deseja remover este componente do produto?")) {
      await removerComponenteProduto(componenteId);
    }
  };

  const getItensDisponiveis = () => {
    return selectedTipo === "insumo" ? insumos : receitas;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Produtos Finais</h2>
          <p className="text-muted-foreground">Gerenciamento de produtos finais com cálculo de custos</p>
        </div>
        <Button onClick={() => setIsProdutoDialogOpen(true)} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="space-y-6">
        {produtos.map(produto => (
          <div key={produto.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{produto.nome}</h3>
                {produto.descricao && (
                  <p className="text-muted-foreground text-sm">{produto.descricao}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Produção: {produto.unidades_producao} unidade(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProduto(produto.id);
                    setIsComponenteDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Componente
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduto(produto.id, produto.nome)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Custo Total:</span> R$ {produto.custo_total.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Custo Unitário:</span> R$ {produto.custo_unitario.toFixed(4)}
              </div>
              <div>
                <span className="font-medium">Preço Venda:</span> R$ {produto.preco_venda?.toFixed(2) || "0.00"}
              </div>
              <div>
                <span className="font-medium">Margem:</span> {produto.margem_lucro.toFixed(1)}%
              </div>
            </div>

            {produto.componentes.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produto.componentes.map(componente => (
                    <TableRow key={componente.id}>
                      <TableCell>{componente.nome_item}</TableCell>
                      <TableCell className="capitalize">{componente.tipo}</TableCell>
                      <TableCell className="text-right">
                        {componente.quantidade}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {componente.custo_item.toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteComponente(componente.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ))}

        {produtos.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum produto cadastrado. Clique em "Novo Produto" para começar.
          </div>
        )}
      </div>

      {/* Dialog para Novo Produto */}
      <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Produto Final</DialogTitle>
            <DialogDescription>
              Crie um novo produto final que utilizará insumos e/ou receitas.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...produtoForm}>
            <form onSubmit={produtoForm.handleSubmit(onSubmitProduto)} className="space-y-4">
              <FormField
                control={produtoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Chocolate 70% Cacau" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={produtoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={produtoForm.control}
                  name="unidades_producao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidades Produção</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          step="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={produtoForm.control}
                  name="peso_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso Unitário (g)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={produtoForm.control}
                  name="preco_venda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Venda (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsProdutoDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Produto</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Componente */}
      <Dialog open={isComponenteDialogOpen} onOpenChange={setIsComponenteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Componente ao Produto</DialogTitle>
            <DialogDescription>
              Selecione um insumo ou receita e defina a quantidade necessária.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...componenteForm}>
            <form onSubmit={componenteForm.handleSubmit(onSubmitComponente)} className="space-y-4">
              <FormField
                control={componenteForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Componente</FormLabel>
                    <Select 
                      onValueChange={(value: "receita" | "insumo") => {
                        field.onChange(value);
                        setSelectedTipo(value);
                        componenteForm.setValue("item_id", "");
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="insumo">Insumo</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={componenteForm.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedTipo === "insumo" ? "Insumo" : "Receita"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione ${selectedTipo === "insumo" ? "um insumo" : "uma receita"}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getItensDisponiveis().map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={componenteForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsComponenteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Componente</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
