import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory, Save, ShoppingCart } from 'lucide-react';
import { useRolePermissions, ALL_ROUTES } from '@/hooks/useRolePermissions';

type AppRole = 'admin' | 'producao' | 'user';

const ROLE_PROFILES: { id: AppRole; name: string; description: string; icon: React.ReactNode; badgeClass: string }[] = [
  {
    id: 'producao',
    name: 'Gerente de Produção',
    description: 'Acesso às áreas de produção, estoque e agendamento.',
    icon: <Factory className="h-5 w-5" />,
    badgeClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  // Futuro:
  // {
  //   id: 'representante',
  //   name: 'Representante Comercial',
  //   description: 'Acesso às áreas de clientes e gestão comercial.',
  //   icon: <ShoppingCart className="h-5 w-5" />,
  //   badgeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  // },
];

// Group routes by their group property
const routeGroups = ALL_ROUTES.reduce<Record<string, typeof ALL_ROUTES[number][]>>((acc, route) => {
  if (!acc[route.group]) acc[route.group] = [];
  acc[route.group].push(route);
  return acc;
}, {});

function RolePermissionsEditor({ roleId, roleName }: { roleId: 'admin' | 'producao' | 'user'; roleName: string }) {
  const { permissions, loading, saving, togglePermission, savePermissions } = useRolePermissions(roleId);

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
                        <Switch
                          checked={canAccess}
                          onCheckedChange={() => togglePermission(route.key, 'can_access')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={canEdit}
                          disabled={!canAccess}
                          onCheckedChange={() => togglePermission(route.key, 'can_edit')}
                        />
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

export default function TiposAcessoTab() {
  const [activeRole, setActiveRole] = useState<'admin' | 'producao' | 'user'>(ROLE_PROFILES[0]?.id as any || 'producao');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tipos de Acesso</h2>
        <p className="text-sm text-muted-foreground">
          Configure quais páginas cada tipo de funcionário pode acessar e editar.
        </p>
      </div>

      {ROLE_PROFILES.length === 1 ? (
        // Single role — no tabs needed
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              {ROLE_PROFILES[0].icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{ROLE_PROFILES[0].name}</div>
              <div className="text-sm text-muted-foreground">{ROLE_PROFILES[0].description}</div>
            </div>
            <Badge className={ROLE_PROFILES[0].badgeClass}>{ROLE_PROFILES[0].name}</Badge>
          </div>
          <RolePermissionsEditor roleId={ROLE_PROFILES[0].id} roleName={ROLE_PROFILES[0].name} />
        </div>
      ) : (
        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as AppRole)}>
          <TabsList>
            {ROLE_PROFILES.map(profile => (
              <TabsTrigger key={profile.id} value={profile.id} className="flex items-center gap-2">
                {profile.icon}
                {profile.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {ROLE_PROFILES.map(profile => (
            <TabsContent key={profile.id} value={profile.id}>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {profile.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">{profile.description}</div>
                  </div>
                  <Badge className={profile.badgeClass}>{profile.name}</Badge>
                </div>
                <RolePermissionsEditor roleId={profile.id} roleName={profile.name} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
