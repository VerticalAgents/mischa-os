
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
  "/gestao-comercial": [
    { title: "Gestão Comercial", href: "/gestao-comercial" }
  ],
  "/gestao-comercial/funil-leads": [
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Funil de Leads", href: "/gestao-comercial/funil-leads", current: true }
  ],
  "/gestao-comercial/distribuidores": [
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Distribuidores", href: "/gestao-comercial/distribuidores", current: true }
  ],
  "/gestao-comercial/parceiros": [
    { title: "Gestão Comercial", href: "/gestao-comercial" },
    { title: "Parceiros", href: "/gestao-comercial/parceiros", current: true }
  ],
  "/gestao-financeira": [
    { title: "Gestão Financeira", href: "/gestao-financeira" }
  ],
  "/custos": [
    { title: "Gestão Financeira", href: "/gestao-financeira" },
    { title: "Custos", href: "/custos", current: true }
  ],
  "/projecoes": [
    { title: "Gestão Financeira", href: "/gestao-financeira" },
    { title: "Projeções", href: "/projecoes", current: true }
  ]
};

export default function BreadcrumbNavigation({ items: customItems }: BreadcrumbNavigationProps) {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Use either custom items or look up from the route map
  const items = customItems || routeMap[pathname] || [];
  
  // Don't render if there are no items or only one item (we're at the top level)
  if (items.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {item.current ? (
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.href}>{item.title}</Link>
              </BreadcrumbLink>
            )}
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
