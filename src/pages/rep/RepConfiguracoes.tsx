import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Map } from "lucide-react";
import { useSupabaseRotasEntrega } from "@/hooks/useSupabaseRotasEntrega";

export default function RepConfiguracoes() {
  const {
    rotasEntrega,
    loading,
    adicionarRotaEntrega,
    atualizarRotaEntrega,
    removerRotaEntrega,
  } = useSupabaseRotasEntrega();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });

  const reset = () => setFormData({ nome: "", descricao: "" });

  const handleAdd = async () => {
    if (!formData.nome.trim()) return;
    const ok = await adicionarRotaEntrega(formData);
    if (ok) {
      reset();
      setIsAddOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.nome.trim() || !editing) return;
    const ok = await atualizarRotaEntrega(editing.id, formData);
    if (ok) {
      reset();
      setEditing(null);
      setIsEditOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Remover esta rota de entrega?")) {
      await removerRotaEntrega(id);
    }
  };

  const openEdit = (rota: any) => {
    setEditing(rota);
    setFormData({ nome: rota.nome, descricao: rota.descricao || "" });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas preferências e cadastros pessoais.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Minhas Rotas de Entrega</CardTitle>
                  <CardDescription>
                    Cadastre as rotas que você usa para organizar seus clientes.
                    Elas ficam disponíveis ao cadastrar um cliente que não seja
                    de retirada.
                  </CardDescription>
                </div>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Rota
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Rota de Entrega</DialogTitle>
                    <DialogDescription>
                      Dê um nome curto que faça sentido para a sua organização.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        placeholder="Ex: Zona Norte"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={formData.descricao}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descricao: e.target.value,
                          })
                        }
                        placeholder="Detalhes opcionais"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAdd}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando rotas...</p>
            ) : rotasEntrega.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">
                  Você ainda não cadastrou nenhuma rota.
                </p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setIsAddOpen(true)}
                >
                  Cadastrar minha primeira rota
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rotasEntrega.map((rota) => (
                    <TableRow key={rota.id}>
                      <TableCell className="font-medium">{rota.nome}</TableCell>
                      <TableCell>{rota.descricao || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={rota.ativo ? "default" : "secondary"}>
                          {rota.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(rota)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(rota.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Rota de Entrega</DialogTitle>
              <DialogDescription>
                Atualize as informações da rota.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}