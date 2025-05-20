
import { useState } from "react";
import { useInsumosStore } from "@/hooks/useInsumosStore";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilePlus, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Cotacao, PropostaFornecedor } from "@/types/insumos";

// Form schema for creating cotações
const cotacaoSchema = z.object({
  titulo: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  dataValidade: z.date().optional(),
});

// Form schema for adding items
const itemSchema = z.object({
  insumoId: z.number().min(1, { message: "Selecione um insumo" }),
  quantidade: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
});

// Form schema for adding proposta
const propostaSchema = z.object({
  fornecedorId: z.number().min(1, { message: "Selecione um fornecedor" }),
  prazoEntrega: z.number().min(1, { message: "Prazo deve ser maior que zero" }),
  frete: z.number().min(0, { message: "Frete não pode ser negativo" }),
  formaPagamento: z.string().min(1, { message: "Forma de pagamento é obrigatória" }),
  observacoes: z.string().optional(),
});

export default function CotacoesTab() {
  const {
    insumos,
    fornecedores,
    cotacoes,
    criarCotacao,
    adicionarItemCotacao,
    adicionarPropostaFornecedor,
    escolherPropostaVencedora,
    atualizarStatusCotacao,
    gerarPedidoCompraDeCotacao,
  } = useInsumosStore();

  // States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isPropostaDialogOpen, setIsPropostaDialogOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<number | null>(null);
  const [detailMode, setDetailMode] = useState<"items" | "proposals" | null>(null);

  // Forms
  const cotacaoForm = useForm<z.infer<typeof cotacaoSchema>>({
    resolver: zodResolver(cotacaoSchema),
    defaultValues: {
      titulo: "",
    },
  });

  const itemForm = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      insumoId: 0,
      quantidade: 1,
    },
  });

  const propostaForm = useForm<z.infer<typeof propostaSchema>>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      fornecedorId: 0,
      prazoEntrega: 5,
      frete: 0,
      formaPagamento: "À vista",
      observacoes: "",
    },
  });

  // Handlers
  const handleCreateCotacao = (data: z.infer<typeof cotacaoSchema>) => {
    const newCotacaoId = criarCotacao({
      titulo: data.titulo,
      status: "Aberta",
      itens: [],
      dataValidade: data.dataValidade,
    });

    setIsCreateDialogOpen(false);
    setSelectedCotacao(newCotacaoId);
    setDetailMode("items");
  };

  const handleAddItem = (data: z.infer<typeof itemSchema>) => {
    if (selectedCotacao) {
      adicionarItemCotacao(selectedCotacao, {
        insumoId: data.insumoId,
        quantidade: data.quantidade,
      });
      setIsItemDialogOpen(false);
      itemForm.reset();
    }
  };

  const handleAddProposta = (data: z.infer<typeof propostaSchema>) => {
    if (selectedCotacao) {
      const cotacao = cotacoes.find((c) => c.id === selectedCotacao);
      if (!cotacao) return;

      const propostaItems = cotacao.itens.map((item) => ({
        itemId: item.id,
        precoUnitario: parseFloat(
          (document.getElementById(`price-${item.id}`) as HTMLInputElement).value
        ),
      }));

      adicionarPropostaFornecedor({
        cotacaoId: selectedCotacao,
        fornecedorId: data.fornecedorId,
        itens: propostaItems,
        prazoEntrega: data.prazoEntrega,
        frete: data.frete,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      });

      setIsPropostaDialogOpen(false);
      propostaForm.reset();
    }
  };

  const handleSelectWinner = (cotacaoId: number, propostaId: number) => {
    escolherPropostaVencedora(cotacaoId, propostaId);
  };

  const handleGeneratePurchaseOrder = (cotacaoId: number) => {
    gerarPedidoCompraDeCotacao(cotacaoId);
  };

  // Helper functions
  const getStatusColor = (status: Cotacao["status"]) => {
    switch (status) {
      case "Aberta":
        return "bg-blue-100 text-blue-800";
      case "Aguardando Propostas":
        return "bg-yellow-100 text-yellow-800";
      case "Finalizada":
        return "bg-green-100 text-green-800";
      case "Cancelada":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInsumoById = (id: number) => {
    return insumos.find((i) => i.id === id);
  };

  const getFornecedorById = (id: number) => {
    return fornecedores.find((f) => f.id === id);
  };

  const calculateTotalProposta = (proposta: PropostaFornecedor, cotacaoId: number) => {
    const cotacao = cotacoes.find((c) => c.id === cotacaoId);
    if (!cotacao) return 0;

    let total = proposta.frete || 0;
    cotacao.itens.forEach((item) => {
      const propostaItem = proposta.itens.find((i) => i.itemId === item.id);
      if (propostaItem) {
        total += item.quantidade * propostaItem.precoUnitario;
      }
    });

    return total;
  };

  // Render functions
  const renderCotacaoList = () => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cotações</CardTitle>
            <CardDescription>
              Gerencie suas cotações de compra de insumos
            </CardDescription>
          </div>
          <Button onClick={() => {
            cotacaoForm.reset();
            setIsCreateDialogOpen(true);
          }}>
            <FilePlus className="h-4 w-4 mr-2" /> Nova Cotação
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Propostas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    Nenhuma cotação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                cotacoes.map((cotacao) => (
                  <TableRow key={cotacao.id}>
                    <TableCell>{cotacao.id}</TableCell>
                    <TableCell className="font-medium">{cotacao.titulo}</TableCell>
                    <TableCell>
                      {format(new Date(cotacao.dataCriacao), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {cotacao.dataValidade
                        ? format(new Date(cotacao.dataValidade), "dd/MM/yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(cotacao.status)}>
                        {cotacao.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{cotacao.itens.length}</TableCell>
                    <TableCell>{cotacao.propostas.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCotacao(cotacao.id);
                            setDetailMode("items");
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {cotacao.status === "Finalizada" && !cotacao.propostaVencedoraId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCotacao(cotacao.id);
                              setDetailMode("proposals");
                            }}
                          >
                            Escolher Proposta
                          </Button>
                        )}
                        {cotacao.propostaVencedoraId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePurchaseOrder(cotacao.id)}
                          >
                            Gerar Pedido
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderCotacaoDetail = () => {
    if (!selectedCotacao) return null;

    const cotacao = cotacoes.find((c) => c.id === selectedCotacao);
    if (!cotacao) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCotacao(null);
                setDetailMode(null);
              }}
            >
              Voltar para lista
            </Button>
            <h2 className="text-2xl font-bold mt-4">{cotacao.titulo}</h2>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={getStatusColor(cotacao.status)}>
                {cotacao.status}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Criada em: {format(new Date(cotacao.dataCriacao), "dd/MM/yyyy")}
              </p>
              {cotacao.dataValidade && (
                <p className="text-sm text-muted-foreground">
                  Válida até: {format(new Date(cotacao.dataValidade), "dd/MM/yyyy")}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {cotacao.status === "Aberta" && (
              <>
                <Button
                  onClick={() => {
                    itemForm.reset();
                    setIsItemDialogOpen(true);
                  }}
                >
                  Adicionar Item
                </Button>
                {cotacao.itens.length > 0 && (
                  <Button
                    onClick={() => atualizarStatusCotacao(cotacao.id, "Aguardando Propostas")}
                  >
                    Solicitar Propostas
                  </Button>
                )}
              </>
            )}
            {cotacao.status === "Aguardando Propostas" && (
              <Button
                onClick={() => {
                  propostaForm.reset();
                  setIsPropostaDialogOpen(true);
                }}
              >
                Adicionar Proposta
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens da Cotação</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotacao.itens.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-muted-foreground"
                      >
                        Nenhum item adicionado à cotação
                      </TableCell>
                    </TableRow>
                  ) : (
                    cotacao.itens.map((item) => {
                      const insumo = getInsumoById(item.insumoId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {insumo?.nome || "Insumo não encontrado"}
                          </TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell>{insumo?.unidadeMedida}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(detailMode === "proposals" ||
            cotacao.status === "Aguardando Propostas" ||
            cotacao.status === "Finalizada") &&
            cotacao.propostas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Propostas Recebidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Prazo (dias)</TableHead>
                        <TableHead>Frete (R$)</TableHead>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead className="text-right">Valor Total (R$)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cotacao.propostas.map((proposta) => {
                        const fornecedor = getFornecedorById(proposta.fornecedorId);
                        const totalValue = calculateTotalProposta(proposta, cotacao.id);
                        const isWinner = cotacao.propostaVencedoraId === proposta.id;

                        return (
                          <TableRow key={proposta.id}>
                            <TableCell className="font-medium">
                              {fornecedor?.nome || "Fornecedor não encontrado"}
                              {isWinner && (
                                <Badge className="ml-2 bg-green-100 text-green-800">
                                  Vencedora
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{proposta.prazoEntrega}</TableCell>
                            <TableCell>
                              {proposta.frete.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>{proposta.formaPagamento}</TableCell>
                            <TableCell className="text-right">
                              {totalValue.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {cotacao.status === "Finalizada" &&
                                !cotacao.propostaVencedoraId && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSelectWinner(cotacao.id, proposta.id)
                                    }
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Escolher
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    );
  };

  // Dialog components
  const renderCreateCotacaoDialog = () => {
    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Cotação</DialogTitle>
            <DialogDescription>
              Crie uma nova cotação para compra de insumos
            </DialogDescription>
          </DialogHeader>
          <Form {...cotacaoForm}>
            <form onSubmit={cotacaoForm.handleSubmit(handleCreateCotacao)} className="space-y-4">
              <FormField
                control={cotacaoForm.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cotação de Insumos - Junho/2025" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* Mais campos se necessário */}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Cotação</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  const renderAddItemDialog = () => {
    return (
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>
            <DialogDescription>
              Adicione um novo item à cotação
            </DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="insumoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insumo</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      >
                        <option value="0">Selecione um insumo</option>
                        {insumos.map((insumo) => (
                          <option key={insumo.id} value={insumo.id}>
                            {insumo.nome} ({insumo.unidadeMedida})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Item</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  const renderAddPropostaDialog = () => {
    if (!selectedCotacao) return null;

    const cotacao = cotacoes.find((c) => c.id === selectedCotacao);
    if (!cotacao) return null;

    return (
      <Dialog open={isPropostaDialogOpen} onOpenChange={setIsPropostaDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Proposta</DialogTitle>
            <DialogDescription>
              Registre uma nova proposta de fornecedor
            </DialogDescription>
          </DialogHeader>
          <Form {...propostaForm}>
            <form
              onSubmit={propostaForm.handleSubmit(handleAddProposta)}
              className="space-y-4"
            >
              <FormField
                control={propostaForm.control}
                name="fornecedorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        value={field.value}
                      >
                        <option value="0">Selecione um fornecedor</option>
                        {fornecedores.map((fornecedor) => (
                          <option key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="border p-4 rounded-md">
                <h3 className="font-bold mb-2">Preços por Item</h3>
                <div className="space-y-2">
                  {cotacao.itens.map((item) => {
                    const insumo = getInsumoById(item.insumoId);
                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="flex-1">
                          {insumo?.nome || "Insumo não encontrado"} ({item.quantidade} {insumo?.unidadeMedida})
                        </div>
                        <div className="w-32">
                          <Input
                            id={`price-${item.id}`}
                            type="number"
                            step="0.01"
                            placeholder="Preço unitário"
                            required
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={propostaForm.control}
                  name="prazoEntrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Entrega (dias)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={propostaForm.control}
                  name="frete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frete (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={propostaForm.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: À vista, 30 dias, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={propostaForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input placeholder="Observações adicionais" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPropostaDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Proposta</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {selectedCotacao ? renderCotacaoDetail() : renderCotacaoList()}
      {renderCreateCotacaoDialog()}
      {renderAddItemDialog()}
      {renderAddPropostaDialog()}
    </div>
  );
}
