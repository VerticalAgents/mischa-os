
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

interface BreadcrumbPathItem {
  title: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbPathItem[];
}

// Map of routes to breadcrumb paths
const routeMap: { [key: string]: BreadcrumbPathItem[] } = {
  "/": [
    { title: "Início", href: "/" }
  ],
  "/gestao-comercial": [
    { title: "Início", href: "/" },
    { title: "Gestão Comercial", href: "/gestao-comercial", current: true }
  ],
  "/gestao-comercial/funil-leads": [
    { title: "Início", href: "/" },
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Funil de Leads", href: "/gestao-comercial/funil-leads", current: true }
  ],
  "/gestao-comercial/distribuidores": [
    { title: "Início", href: "/" },
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Distribuidores", href: "/gestao-comercial/distribuidores", current: true }
  ],
  "/gestao-comercial/parceiros": [
    { title: "Início", href: "/" },
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Parceiros", href: "/gestao-comercial/parceiros", current: true }
  ],
  "/gestao-financeira": [
    { title: "Início", href: "/" },
    { title: "Gestão Financeira", href: "/gestao-financeira", current: true }
  ],
  "/custos": [
    { title: "Início", href: "/" },
    { title: "Gestão Financeira", href: "/gestao-financeira" },
    { title: "Custos", href: "/custos", current: true }
  ],
  "/projecoes": [
    { title: "Início", href: "/" },
    { title: "Gestão Financeira", href: "/gestao-financeira" },
    { title: "Projeções", href: "/projecoes", current: true }
  ],
  "/clientes": [
    { title: "Início", href: "/" },
    { title: "Clientes", href: "/clientes", current: true }
  ],
  "/precificacao": [
    { title: "Início", href: "/" },
    { title: "Precificação", href: "/precificacao", current: true }
  ],
  "/agendamento": [
    { title: "Início", href: "/" },
    { title: "Agendamento", href: "/agendamento", current: true }
  ],
  "/expedicao": [
    { title: "Início", href: "/" },
    { title: "Expedição", href: "/expedicao", current: true }
  ],
  "/estoque": [
    { title: "Início", href: "/" },
    { title: "Estoque", href: "/estoque", current: true }
  ],
  "/pcp": [
    { title: "Início", href: "/" },
    { title: "PCP", href: "/pcp", current: true }
  ],
  "/agentes-ia": [
    { title: "Início", href: "/" },
    { title: "Agentes de IA", href: "/agentes-ia", current: true }
  ],
  "/configuracoes": [
    { title: "Início", href: "/" },
    { title: "Configurações", href: "/configuracoes", current: true }
  ],
};

export default function BreadcrumbNavigation({ items: customItems }: BreadcrumbNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Use either custom items or look up from the route map
  const items = customItems || routeMap[pathname] || [];
  
  // If no items found in the map, create default breadcrumb with current path
  const defaultItems = items.length === 0 ? [
    { title: "Início", href: "/" },
    { title: pathname.split('/').filter(Boolean).pop() || "Página Atual", href: pathname, current: true }
  ] : items;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {defaultItems.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {item.current ? (
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.href}>{index === 0 ? <Home className="h-4 w-4" /> : item.title}</Link>
              </BreadcrumbLink>
            )}
            {index < defaultItems.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
