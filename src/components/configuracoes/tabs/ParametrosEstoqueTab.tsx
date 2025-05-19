
import { useState } from "react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function ParametrosEstoqueTab() {
  const { toast } = useToast();
  const { categoriasInsumo, adicionarCategoriaInsumo, atualizarCategoriaInsumo, removerCategoriaInsumo } = useConfigStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const [currentCategoria, setCurrentCategoria] = useState<{
    id?: number;
    nome: string;
    descricao: string;
    ativo: boolean;
  }>({
    nome: "",
    descricao: "",
    ativo: true
  });

  // Filtrar categorias com base no termo de busca
  const filteredCategorias = categoriasInsumo.filter(
    (categoria) => categoria.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funções de manipulação de formulários
  const handleAddNew = () => {
    setCurrentCategoria({ nome: "", descricao: "", ativo: true });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (categoria) => {
    setCurrentCategoria({
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      ativo: categoria.ativo
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (categoria) => {
    setCurrentCategoria(categoria);
    setIsDeleteAlertOpen(true);
  };

  const confirmAdd = () => {
    if (!currentCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    adicionarCategoriaInsumo({
      nome: currentCategoria.nome,
      descricao: currentCategoria.descricao,
      ativo: currentCategoria.ativo
    });

    toast({
      title: "Categoria adicionada",
      description: `A categoria "${currentCategoria.nome}" foi adicionada com sucesso.`
    });

    setIsAddDialogOpen(false);
  };

  const confirmEdit = () => {
    if (!currentCategoria.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (currentCategoria.id) {
      atualizarCategoriaInsumo(currentCategoria.id, {
        nome: currentCategoria.nome,
        descricao: currentCategoria.descricao,
        ativo: currentCategoria.ativo
      });

      toast({
        title: "Categoria atualizada",
        description: `A categoria "${currentCategoria.nome}" foi atualizada com sucesso.`
      });

      setIsEditDialogOpen(false);
    }
  };

  const confirmDelete = () => {
    if (currentCategoria.id) {
      // Verificar se categoria tem itens vinculados
      const categoria = categoriasInsumo.find(c => c.id === currentCategoria.id);
      if (categoria?.quantidadeItensVinculados && categoria.quantidadeItensVinculados > 0) {
        toast({
          title: "Não foi possível excluir",
          description: `A categoria possui ${categoria.quantidadeItensVinculados} itens vinculados e não pode ser removida.`,
          variant: "destructive"
        });
        setIsDeleteAlertOpen(false);
        return;
      }

      removerCategoriaInsumo(currentCategoria.id);
      
      toast({
        title: "Categoria removida",
        description: `A categoria "${currentCategoria.nome}" foi removida com sucesso.`
      });
      
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categorias de Insumos</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-[300px]"
          />
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova categoria
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Itens Vinculados</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCategorias.length > 0 ? (
            filteredCategorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell className="font-medium">{categoria.nome}</TableCell>
                <TableCell>{categoria.descricao}</TableCell>
                <TableCell className="text-center">
                  {categoria.ativo ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Ativo</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {categoria.quantidadeItensVinculados || 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(categoria)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(categoria)}
                      disabled={categoria.quantidadeItensVinculados && categoria.quantidadeItensVinculados > 0}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                {searchTerm 
                  ? "Nenhuma categoria encontrada com o termo buscado" 
                  : "Nenhuma categoria cadastrada"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal para Adicionar Categoria */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria de Insumo</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria para classificar seus insumos, embalagens e outros materiais.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">Nome</label>
              <Input 
                id="nome" 
                value={currentCategoria.nome} 
                onChange={(e) => setCurrentCategoria({...currentCategoria, nome: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-medium">Descrição</label>
              <Textarea 
                id="descricao" 
                value={currentCategoria.descricao} 
                onChange={(e) => setCurrentCategoria({...currentCategoria, descricao: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="ativo" className="text-sm font-medium">Ativo</label>
              <Switch 
                id="ativo" 
                checked={currentCategoria.ativo} 
                onCheckedChange={(checked) => setCurrentCategoria({...currentCategoria, ativo: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmAdd}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para Editar Categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-nome" className="text-sm font-medium">Nome</label>
              <Input 
                id="edit-nome" 
                value={currentCategoria.nome} 
                onChange={(e) => setCurrentCategoria({...currentCategoria, nome: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-descricao" className="text-sm font-medium">Descrição</label>
              <Textarea 
                id="edit-descricao" 
                value={currentCategoria.descricao} 
                onChange={(e) => setCurrentCategoria({...currentCategoria, descricao: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="edit-ativo" className="text-sm font-medium">Ativo</label>
              <Switch 
                id="edit-ativo" 
                checked={currentCategoria.ativo} 
                onCheckedChange={(checked) => setCurrentCategoria({...currentCategoria, ativo: checked})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmEdit}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alerta de Confirmação para Exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir a categoria "{currentCategoria.nome}"?
              {currentCategoria.quantidadeItensVinculados && currentCategoria.quantidadeItensVinculados > 0 && (
                <div className="mt-2 flex items-center text-amber-600">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Esta categoria possui {currentCategoria.quantidadeItensVinculados} itens vinculados e não pode ser removida.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={currentCategoria.quantidadeItensVinculados && currentCategoria.quantidadeItensVinculados > 0}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
