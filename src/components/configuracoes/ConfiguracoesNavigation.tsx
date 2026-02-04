
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  User, 
  Settings, 
  Bot, 
  Wallet, 
  Calculator, 
  Receipt, 
  CreditCard,
  Tags,
  Percent,
  Package,
  Users,
  Calendar,
  Factory,
  Link2
} from 'lucide-react';

interface ConfiguracoesNavigationProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
}

const configGroups = [
  {
    title: "Administração",
    tabs: [
      { id: "empresa", label: "Empresa", icon: Building2 },
      { id: "usuario", label: "Usuário", icon: User },
      { id: "sistema", label: "Sistema", icon: Settings },
      { id: "agentes-ia", label: "Agentes IA", icon: Bot },
    ]
  },
  {
    title: "Financeiro",
    tabs: [
      { id: "financeiro", label: "Parâmetros", icon: Wallet },
      { id: "precificacao", label: "Precificação", icon: Calculator },
      { id: "custos", label: "Custos", icon: Receipt },
      { id: "cartoes-credito", label: "Cartões de Crédito", icon: CreditCard },
    ]
  },
  {
    title: "Produtos & Estoque",
    tabs: [
      { id: "categorias-produto", label: "Categorias", icon: Tags },
      { id: "proporcoes", label: "Proporções", icon: Percent },
      { id: "parametros-estoque", label: "Estoque", icon: Package },
    ]
  },
  {
    title: "Operações",
    tabs: [
      { id: "clientes", label: "Comercial", icon: Users },
      { id: "agendamento", label: "Agendamento", icon: Calendar },
      { id: "producao", label: "Produção", icon: Factory },
    ]
  },
  {
    title: "Integrações",
    tabs: [
      { id: "gestaoclick", label: "GestaoClick", icon: Link2 },
    ]
  }
];

export default function ConfiguracoesNavigation({ 
  currentTab, 
  onTabChange 
}: ConfiguracoesNavigationProps) {
  return (
    <div className="w-64 border-r bg-muted/20 flex-shrink-0">
      <ScrollArea className="h-full">
        <nav className="p-4 space-y-6">
          {configGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const isActive = currentTab === tab.id;
                  const Icon = tab.icon;
                  
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9 px-2",
                        isActive && "bg-accent font-medium"
                      )}
                      onClick={() => onTabChange(tab.id)}
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

export { configGroups };
