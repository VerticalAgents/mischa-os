import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Users, RefreshCw, Eye, EyeOff, Shield, Pencil, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomRoles } from '@/hooks/useCustomRoles';

interface StaffAccount {
  id: string;
  staff_user_id: string;
  nome: string | null;
  role: string;
  ativo: boolean;
  created_at: string;
  email?: string;
  custom_role_id?: string | null;
  login_email?: string | null;
  senha_acesso?: string | null;
}

export default function FuncionariosTab() {
  const { user } = useAuth();
  const { roles: customRoles, loading: rolesLoading } = useCustomRoles();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', password: '', custom_role_id: '' });
  const [editForm, setEditForm] = useState({ nome: '', custom_role_id: '', nova_senha: '' });
  const [adminProfile, setAdminProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);

  const fetchAdminProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();
    setAdminProfile(data);
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const staffIds = (data || []).map(s => s.staff_user_id);
      let emailMap = new Map<string, string>();

      if (staffIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', staffIds);
        profiles?.forEach(p => {
          if (p.email) emailMap.set(p.id, p.email);
        });
      }

      setStaff((data || []).map(s => ({
        ...s,
        email: s.login_email || emailMap.get(s.staff_user_id) || '-',
      })));
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAdminProfile();
  }, [user]);

  const handleCreate = async () => {
    if (!form.nome || !form.email || !form.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setCreating(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-staff-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            nome: form.nome,
            custom_role_id: form.custom_role_id || null,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar funcionário');
      }

      toast.success(`Funcionário "${form.nome}" criado com sucesso!`);
      setForm({ nome: '', email: '', password: '', custom_role_id: '' });
      setDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar funcionário');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (staffId: string, currentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_accounts')
        .update({ ativo: !currentlyActive })
        .eq('id', staffId);
      if (error) throw error;
      toast.success(currentlyActive ? 'Funcionário desativado' : 'Funcionário reativado');
      fetchStaff();
    } catch (error) {
      toast.error('Erro ao atualizar funcionário');
    }
  };

  const openEditDialog = (s: StaffAccount) => {
    setEditingStaff(s);
    setEditForm({ nome: s.nome || '', custom_role_id: s.custom_role_id || '', nova_senha: '' });
    setShowEditPassword(false);
    setEditDialogOpen(true);
  };

  const openViewDialog = (s: StaffAccount) => {
    setViewingStaff(s);
    setShowViewPassword(false);
    setViewDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingStaff) return;
    if (!editForm.nome) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (editForm.nova_senha && editForm.nova_senha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    try {
      // Update staff_accounts
      const { error } = await supabase
        .from('staff_accounts')
        .update({
          nome: editForm.nome,
          custom_role_id: editForm.custom_role_id || null,
        })
        .eq('id', editingStaff.id);
      if (error) throw error;

      // Update password if provided
      if (editForm.nova_senha) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          toast.error('Sessão expirada');
          return;
        }
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const pwResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/update-staff-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              staff_account_id: editingStaff.id,
              new_password: editForm.nova_senha,
            }),
          }
        );
        const pwResult = await pwResponse.json();
        if (!pwResponse.ok) {
          throw new Error(pwResult.error || 'Erro ao atualizar senha');
        }
      }

      toast.success('Funcionário atualizado!');
      setEditDialogOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      toast.error('Erro ao atualizar funcionário');
    }
  };

  const handleCopyCredentials = (s: StaffAccount) => {
    const loginEmail = s.login_email || s.email || '-';
    const senha = s.senha_acesso || '(não disponível)';
    const text = `🔐 Dados de Acesso\n\nNome: ${s.nome || '-'}\nLogin: ${loginEmail}\nSenha: ${senha}\nFunção: ${getRoleName(s)}`;
    navigator.clipboard.writeText(text);
    toast.success('Credenciais copiadas para a área de transferência!');
  };

  const getRoleName = (s: StaffAccount) => {
    if (s.custom_role_id) {
      const cr = customRoles.find(r => r.id === s.custom_role_id);
      return cr ? cr.name : 'Tipo removido';
    }
    return 'Não definido';
  };

  const getRoleColor = (s: StaffAccount) => {
    if (s.custom_role_id) {
      const cr = customRoles.find(r => r.id === s.custom_role_id);
      return cr?.color || '#6B7280';
    }
    return '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando funcionários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipe da Empresa
            </CardTitle>
            <CardDescription>
              Gerencie sua equipe e os acessos ao sistema.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      placeholder="Nome do funcionário"
                      value={form.nome}
                      onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de acesso</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha de acesso</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={form.password}
                        onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Acesso</Label>
                    {customRoles.length > 0 ? (
                      <Select
                        value={form.custom_role_id}
                        onValueChange={(val) => setForm(f => ({ ...f, custom_role_id: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo de acesso" />
                        </SelectTrigger>
                        <SelectContent>
                          {customRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                        Nenhum tipo de acesso criado. Crie na aba "Tipos de Acesso" primeiro.
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? 'Criando...' : 'Criar Funcionário'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%]">Nome</TableHead>
                  <TableHead className="w-[24%]">Email</TableHead>
                  <TableHead className="w-[18%]">Função</TableHead>
                  <TableHead className="w-[12%]">Cadastro</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[14%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Admin/Owner row */}
                {user && (
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium truncate">
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{adminProfile?.full_name || user.email || 'Proprietário'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate">
                      {adminProfile?.email || user.email}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] truncate max-w-full">
                        Proprietário
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell>
                      <Badge variant="default">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      Acesso total
                    </TableCell>
                  </TableRow>
                )}
                {staff.length === 0 && !user ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum funcionário cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium truncate">{s.nome || 'Sem nome'}</TableCell>
                      <TableCell className="text-muted-foreground truncate">{s.email}</TableCell>
                      <TableCell>
                        <Badge className="text-[11px] truncate max-w-full" style={{ backgroundColor: getRoleColor(s), color: '#fff' }}>
                          {getRoleName(s)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(s.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.ativo ? 'default' : 'secondary'}>
                          {s.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            title="Visualizar credenciais"
                            onClick={() => openViewDialog(s)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            title="Editar funcionário"
                            onClick={() => openEditDialog(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => handleDeactivate(s.id, s.ativo)}
                          >
                            {s.ativo ? 'Desativar' : 'Reativar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Credentials Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados de Acesso</DialogTitle>
          </DialogHeader>
          {viewingStaff && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Nome</Label>
                <p className="text-sm font-medium">{viewingStaff.nome || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email de login</Label>
                <p className="text-sm font-medium">{viewingStaff.login_email || viewingStaff.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Senha</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium font-mono">
                    {viewingStaff.senha_acesso
                      ? (showViewPassword ? viewingStaff.senha_acesso : '••••••••')
                      : '(não disponível)'}
                  </p>
                  {viewingStaff.senha_acesso && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => setShowViewPassword(!showViewPassword)}
                    >
                      {showViewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Função</Label>
                <div>
                  <Badge className="text-[11px]" style={{ backgroundColor: getRoleColor(viewingStaff), color: '#fff' }}>
                    {getRoleName(viewingStaff)}
                  </Badge>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleCopyCredentials(viewingStaff)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar credenciais para enviar
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          {editingStaff && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  value={editForm.nome}
                  onChange={(e) => setEditForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email de login</Label>
                <p className="text-sm font-medium bg-muted px-3 py-2 rounded-md">
                  {editingStaff.login_email || editingStaff.email || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Senha</Label>
                <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
                  <p className="text-sm font-medium font-mono flex-1">
                    {editingStaff.senha_acesso
                      ? (showEditPassword ? editingStaff.senha_acesso : '••••••••')
                      : '(não disponível)'}
                  </p>
                  {editingStaff.senha_acesso && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Acesso</Label>
                {customRoles.length > 0 ? (
                  <Select
                    value={editForm.custom_role_id}
                    onValueChange={(val) => setEditForm(f => ({ ...f, custom_role_id: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      {customRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                            {role.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                    Nenhum tipo de acesso criado. Crie na aba "Tipos de Acesso" primeiro.
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
