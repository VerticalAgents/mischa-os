import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Save, Pencil, Trash2, Users } from 'lucide-react';
import { useCustomRoles, type CustomRole } from '@/hooks/useCustomRoles';
import { useCustomRolePermissions, ALL_ROUTES } from '@/hooks/useRolePermissions';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const routeGroups = ALL_ROUTES.reduce<Record<string, typeof ALL_ROUTES[number][]>>((acc, route) => {
  if (!acc[route.group]) acc[route.group] = [];
  acc[route.group].push(route);
  return acc;
}, {});

function RolePermissionsEditor({ roleId }: { roleId: string }) {
  const { permissions, loading, saving, togglePermission, savePermissions } = useCustomRolePermissions(roleId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando permissões...</span>
        </div>
      </div>
    );
  }

  const permMap = new Map(permissions.map(p => [p.route_key, p]));
  const accessCount = permissions.filter(p => p.can_access).length;
  const editCount = permissions.filter(p => p.can_edit).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{accessCount} páginas com acesso</span>
          <span>{editCount} com edição</span>
        </div>
        <Button onClick={savePermissions} disabled={saving} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>

      {Object.entries(routeGroups).map(([group, routes]) => (
        <Card key={group}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {group}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Página</TableHead>
                  <TableHead className="text-center w-[30%]">Pode Acessar</TableHead>
                  <TableHead className="text-center w-[30%]">Pode Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map(route => {
                  const perm = permMap.get(route.key);
                  const canAccess = perm?.can_access ?? false;
                  const canEdit = perm?.can_edit ?? false;
                  return (
                    <TableRow key={route.key}>
                      <TableCell className="font-medium">{route.label}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={canAccess} onCheckedChange={() => togglePermission(route.key, 'can_access')} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={canEdit} disabled={!canAccess} onCheckedChange={() => togglePermission(route.key, 'can_edit')} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RoleFormDialog({
  open, onOpenChange, onSubmit, initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (name: string, description: string, color: string) => Promise<boolean>;
  initial?: CustomRole;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit(name.trim(), description.trim(), color);
    setSubmitting(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Tipo de Acesso' : 'Novo Tipo de Acesso'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Altere as informações do tipo de acesso.' : 'Crie um novo perfil de acesso para seus funcionários.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Nome</Label>
            <Input id="role-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Representante Comercial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Descrição</Label>
            <Textarea id="role-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que este perfil faz..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? 'Salvando...' : initial ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TiposAcessoTab() {
  const { roles, loading, createRole, updateRole, deleteRole } = useCustomRoles();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Auto-select first role
  if (!selectedRoleId && roles.length > 0 && !loading) {
    setSelectedRoleId(roles[0].id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tipos de Acesso</h2>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie perfis de acesso para seus funcionários.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">Nenhum tipo de acesso</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro perfil de acesso para definir permissões.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Tipo de Acesso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Role cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedRoleId === role.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: role.color }}>
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{role.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={e => { e.stopPropagation(); setEditingRole(role); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={e => { e.stopPropagation(); setDeletingRole(role); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permissions editor for selected role */}
          {selectedRole && (
            <div className="pt-2">
              <div className="flex items-center gap-3 mb-4 p-3 border rounded-lg bg-muted/30">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: selectedRole.color }}>
                  {selectedRole.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedRole.name}</div>
                  {selectedRole.description && (
                    <div className="text-sm text-muted-foreground">{selectedRole.description}</div>
                  )}
                </div>
                <Badge style={{ backgroundColor: selectedRole.color, color: 'white' }}>
                  {selectedRole.name}
                </Badge>
              </div>
              <RolePermissionsEditor roleId={selectedRole.id} />
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <RoleFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={createRole}
      />

      {/* Edit Dialog */}
      {editingRole && (
        <RoleFormDialog
          open={!!editingRole}
          onOpenChange={o => { if (!o) setEditingRole(null); }}
          onSubmit={(name, desc, color) => updateRole(editingRole.id, name, desc, color)}
          initial={editingRole}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRole} onOpenChange={o => { if (!o) setDeletingRole(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de acesso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingRole?.name}</strong>? Todas as permissões associadas serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingRole) {
                  await deleteRole(deletingRole.id);
                  if (selectedRoleId === deletingRole.id) setSelectedRoleId(null);
                  setDeletingRole(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
