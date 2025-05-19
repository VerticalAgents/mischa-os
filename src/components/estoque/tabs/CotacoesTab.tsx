
import React, { useState } from "react";
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
import { Plus, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { Cotacao } from "@/types/insumos";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

const mockCotacoes: Cotacao[] = [
  {
    id: 1,
    titulo: "Cotação de Insumos para Bolo de Chocolate",
    dataCriacao: new Date(),
    dataValidade: new Date(2024, 6, 30),
    status: "Aberta",
    itens: [
      { id: 1, insumoId: 101, quantidade: 5 },
      { id: 2, insumoId: 102, quantidade: 2 },
    ],
    propostas: [],
  },
  {
    id: 2,
    titulo: "Cotação de Embalagens para Brownies",
    dataCriacao: new Date(),
    dataValidade: new Date(2024, 7, 15),
    status: "Aguardando Propostas",
    itens: [
      { id: 3, insumoId: 201, quantidade: 100 },
      { id: 4, insumoId: 202, quantidade: 50 },
    ],
    propostas: [],
  },
  {
    id: 3,
    titulo: "Cotação de Materiais de Limpeza",
    dataCriacao: new Date(),
    dataValidade: new Date(2024, 7, 10),
    status: "Finalizada",
    itens: [
      { id: 5, insumoId: 301, quantidade: 1 },
      { id: 6, insumoId: 302, quantidade: 2 },
    ],
    propostas: [],
  },
];

export default function CotacoesTab() {
  const { toast } = useToast();
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(mockCotacoes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCotacao, setCurrentCotacao] = useState<Cotacao>({
    id: 0,
    titulo: "",
    dataCriacao: new Date(),
    dataValidade: new Date(),
    status: "Aberta",
    itens: [],
    propostas: [],
  });
  const [selectedStatus, setSelectedStatus] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  const statuses = ["Aberta", "Aguardando Propostas", "Finalizada", "Cancelada"];

  const filteredCotacoes = cotacoes.filter((cotacao) => {
    const searchTermFilter = cotacao.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const statusFilter = selectedStatus ? cotacao.status === selectedStatus : true;
    const dateFilter = date ? format(cotacao.dataCriacao, 'dd/MM/yyyy', { locale: ptBR }) === format(date, 'dd/MM/yyyy', { locale: ptBR }) : true;

    return searchTermFilter && statusFilter && dateFilter;
  });

  const handleAddNew = () => {
    setCurrentCotacao({
      id: 0,
      titulo: "",
      dataCriacao: new Date(),
      dataValidade: new Date(),
      status: "Aberta",
      itens: [],
      propostas: [],
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (cotacao: Cotacao) => {
    setCurrentCotacao(cotacao);
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentCotacao.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título da cotação é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (currentCotacao.id === 0) {
      // Adicionar nova cotação
      const newId = cotacoes.length > 0 ? Math.max(...cotacoes.map((c) => c.id)) + 1 : 1;
      const novaCotacao = { ...currentCotacao, id: newId };
      setCotacoes([...cotacoes, novaCotacao]);
      toast({
        title: "Cotação adicionada",
        description: "Cotação adicionada com sucesso.",
      });
    } else {
      // Editar cotação existente
      setCotacoes(
        cotacoes.map((cotacao) =>
          cotacao.id === currentCotacao.id ? currentCotacao : cotacao
        )
      );
      toast({
        title: "Cotação atualizada",
        description: "Cotação atualizada com sucesso.",
      });
    }

    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = (cotacaoId: number) => {
    setCotacoes(cotacoes.filter((cotacao) => cotacao.id !== cotacaoId));
    toast({
      title: "Cotação excluída",
      description: "Cotação excluída com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cotações</h2>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar cotação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecionar data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova cotação
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead>Data Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCotacoes.length > 0 ? (
            filteredCotacoes.map((cotacao) => (
              <TableRow key={cotacao.id}>
                <TableCell>{cotacao.titulo}</TableCell>
                <TableCell>{format(cotacao.dataCriacao, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>{format(cotacao.dataValidade, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                <TableCell>{cotacao.status}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cotacao)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(cotacao.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Nenhuma cotação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal para Adicionar/Editar Cotação */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={() => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddDialogOpen ? "Nova Cotação" : "Editar Cotação"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {isAddDialogOpen ? "criar" : "editar"} a cotação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="titulo" className="text-right">
                Título
              </label>
              <Input
                id="titulo"
                value={currentCotacao.titulo}
                onChange={(e) =>
                  setCurrentCotacao({ ...currentCotacao, titulo: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="dataCriacao" className="text-right">
                Data Criação
              </label>
              <Input
                id="dataCriacao"
                value={format(currentCotacao.dataCriacao, "dd/MM/yyyy", { locale: ptBR })}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="dataValidade" className="text-right">
                Data Validade
              </label>
              <Input
                id="dataValidade"
                value={format(currentCotacao.dataValidade, "dd/MM/yyyy", { locale: ptBR })}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">
                Status
              </label>
              <Select
                value={currentCotacao.status}
                onValueChange={(value) =>
                  setCurrentCotacao({ ...currentCotacao, status: value as Cotacao["status"] })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
