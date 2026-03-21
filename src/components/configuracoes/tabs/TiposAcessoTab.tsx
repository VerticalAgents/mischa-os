import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Factory, ShoppingCart, Shield, Home, Package, ClipboardList, Calendar } from 'lucide-react';

interface AccessProfile {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
  routes: { name: string; path: string; icon: React.ReactNode }[];
}

const accessProfiles: AccessProfile[] = [
  {
    id: 'producao',
    name: 'Gerente de Produção',
    description: 'Acesso às áreas de produção, estoque e agendamento. Ideal para funcionários que gerenciam o chão de fábrica e logística de entregas.',
    icon: <Factory className="h-5 w-5" />,
    badgeColor: 'bg-blue-500 hover:bg-blue-600 text-white',
    routes: [
      { name: 'Home', path: '/home', icon: <Home className="h-4 w-4" /> },
      { name: 'PCP', path: '/pcp', icon: <ClipboardList className="h-4 w-4" /> },
      { name: 'Estoque', path: '/estoque', icon: <Package className="h-4 w-4" /> },
      { name: 'Estoque Insumos', path: '/estoque-insumos', icon: <Package className="h-4 w-4" /> },
      { name: 'Agendamento', path: '/agendamento', icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  // Futuro: Representante Comercial
  // {
  //   id: 'representante',
  //   name: 'Representante Comercial',
  //   description: 'Acesso às áreas de clientes, pedidos e agenda comercial.',
  //   icon: <ShoppingCart className="h-5 w-5" />,
  //   badgeColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  //   routes: [...],
  // },
];

export default function TiposAcessoTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tipos de Acesso</h2>
        <p className="text-sm text-muted-foreground">
          Perfis de acesso disponíveis para funcionários cadastrados na sua empresa.
        </p>
      </div>

      {accessProfiles.map((profile) => (
        <Card key={profile.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  {profile.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{profile.name}</CardTitle>
                  <CardDescription className="mt-1">{profile.description}</CardDescription>
                </div>
              </div>
              <Badge className={profile.badgeColor}>{profile.name}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <span className="text-sm font-medium text-muted-foreground mb-2 block">Páginas com acesso:</span>
              <div className="flex flex-wrap gap-2">
                {profile.routes.map((route) => (
                  <div
                    key={route.path}
                    className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
                  >
                    {route.icon}
                    <span>{route.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {accessProfiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum tipo de acesso configurado.
        </div>
      )}
    </div>
  );
}
