
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Edit, Trash2, Plus, KeyRound, ShieldOff, ShieldCheck } from "lucide-react";
import { useSupabaseRepresentantes } from "@/hooks/useSupabaseRepresentantes";
import { useRepresentanteAccounts } from "@/hooks/useRepresentanteAccounts";
import CriarAcessoRepresentanteDialog from "./CriarAcessoRepresentanteDialog";
import EditarAcessoRepresentanteDialog from "./EditarAcessoRepresentanteDialog";

interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  ativo: boolean;
}

export default function RepresentantesList() {
  const { 
    representantes, 
    loading, 
    adicionarRepresentante, 
    atualizarRepresentante, 
    removerRepresentante 
  } = useSupabaseRepresentantes();
  const { accounts, carregar: carregarAccounts, revogar, reativar } = useRepresentanteAccounts();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Representante | null>(null);
  const [acessoTarget, setAcessoTarget] = useState<Representante | null>(null);
  const [editarAcessoTarget, setEditarAcessoTarget] = useState<{
    accountId: string;
    representanteNome: string;
    emailAtual: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: ""
  });

  const handleAdd = async () => {
    if (!formData.nome.trim()) return;
    
    const success = await adicionarRepresentante(formData);
    if (success) {
      setFormData({ nome: "", email: "", telefone: "", cpf: "" });
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.nome.trim() || !editingItem) return;
    
    const success = await atualizarRepresentante(editingItem.id, formData);
    if (success) {
      setFormData({ nome: "", email: "", telefone: "", cpf: "" });
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este representante?")) {
      await removerRepresentante(id);
    }
  };

  const openEditModal = (item: Representante) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      email: item.email || "",
      telefone: item.telefone || "",
      cpf: item.cpf || ""
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div>Carregando representantes...</div>;
  }

  const accountByRepId = new Map(accounts.map((a) => [a.representante_id, a]));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Representantes Comerciais</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Representante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Representante</DialogTitle>
              <DialogDescription>
                Adicione um novo representante comercial ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do representante"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Acesso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {representantes.map((representante) => (
            <TableRow key={representante.id}>
              <TableCell className="font-medium">{representante.nome}</TableCell>
              <TableCell>{representante.cpf || "-"}</TableCell>
              <TableCell>{representante.email || "-"}</TableCell>
              <TableCell>{representante.telefone || "-"}</TableCell>
              <TableCell>
                <Badge variant={representante.ativo ? "default" : "secondary"}>
                  {representante.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const acc = accountByRepId.get(representante.id);
                  if (!acc) {
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAcessoTarget(representante)}
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                        Criar acesso
                      </Button>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <Badge variant={acc.ativo ? "default" : "secondary"}>
                        {acc.ativo ? "Ativo" : "Revogado"}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {acc.login_email}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditarAcessoTarget({
                            accountId: acc.id,
                            representanteNome: representante.nome,
                            emailAtual: acc.login_email,
                          })
                        }
                        title="Editar acesso (email/senha)"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {acc.ativo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revogar(acc.id)}
                          title="Revogar acesso"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reativar(acc.id)}
                          title="Reativar acesso"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(representante)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(representante.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Representante</DialogTitle>
            <DialogDescription>
              Edite as informações do representante comercial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do representante"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {acessoTarget && (
        <CriarAcessoRepresentanteDialog
          open={!!acessoTarget}
          onOpenChange={(o) => !o && setAcessoTarget(null)}
          representanteId={acessoTarget.id}
          representanteNome={acessoTarget.nome}
          emailSugerido={acessoTarget.email}
          onSuccess={() => {
            carregarAccounts();
            setAcessoTarget(null);
          }}
        />
      )}

      {editarAcessoTarget && (
        <EditarAcessoRepresentanteDialog
          open={!!editarAcessoTarget}
          onOpenChange={(o) => !o && setEditarAcessoTarget(null)}
          accountId={editarAcessoTarget.accountId}
          representanteNome={editarAcessoTarget.representanteNome}
          emailAtual={editarAcessoTarget.emailAtual}
          onSuccess={() => {
            carregarAccounts();
            setEditarAcessoTarget(null);
          }}
        />
      )}
    </div>
  );
}
