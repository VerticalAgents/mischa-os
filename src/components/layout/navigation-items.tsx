
import { ReactNode } from "react";
import { 
  BarChart3, Users, Tag, Clipboard, 
  ShoppingBag, Settings, Layers, Truck, FileText,
  Cpu, PackageCheck, DollarSign, LineChart, Receipt,
  BarChart, Building, HelpingHand, UserCircle, TrendingUp, Calculator, Home, BookOpen, MapPin,
  Shield, RefreshCw, CalendarClock
} from "lucide-react";

export type MenuItem = {
  label: string;
  path: string;
  icon: ReactNode;
};

export type MenuGroup = {
  title: string;
  items: MenuItem[];
  variant: 'operational' | 'tactical' | 'strategic' | 'system' | 'main' | 'admin';
};

export const menuGroups: MenuGroup[] = [
  {
    title: "Principal",
    variant: "main",
    items: [
      {
        label: "Início",
        path: "/home",
        icon: <Home className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Operacional",
    variant: "operational",
    items: [
      {
        label: "Agendamento",
        path: "/agendamento",
        icon: <Clipboard className="h-4 w-4" />,
      },
      {
        label: "Expedição",
        path: "/expedicao",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        label: "Estoque",
        path: "/estoque/insumos?tab=produtos",
        icon: <PackageCheck className="h-4 w-4" />,
      },
      {
        label: "PCP",
        path: "/pcp",
        icon: <Layers className="h-4 w-4" />,
      },
      {
        label: "Controle de Trocas",
        path: "/controle-trocas",
        icon: <RefreshCw className="h-4 w-4" />,
      },
      {
        label: "Reagendamentos",
        path: "/reagendamentos",
        icon: <CalendarClock className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Tático",
    variant: "tactical",
    items: [
      {
        label: "Clientes",
        path: "/clientes",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Mapas",
        path: "/mapas",
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: "Precificação",
        path: "/precificacao",
        icon: <Tag className="h-4 w-4" />,
      },
      {
        label: "Gestão Comercial",
        path: "/gestao-comercial",
        icon: <ShoppingBag className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Estratégico",
    variant: "strategic",
    items: [
      {
        label: "Dashboard & Analytics",
        path: "/dashboard-analytics",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        label: "Insights PDV",
        path: "/analise-giro",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        label: "Financeiro",
        path: "/gestao-financeira",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        label: "Agentes de IA",
        path: "/agentes-ia",
        icon: <Cpu className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Sistema",
    variant: "system",
    items: [
      {
        label: "Manual",
        path: "/manual",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        label: "Configurações",
        path: "/configuracoes",
        icon: <Settings className="h-4 w-4" />,
      },
    ]
  },
  {
    title: "Administração",
    variant: "admin",
    items: [
      {
        label: "Segurança",
        path: "/seguranca",
        icon: <Shield className="h-4 w-4" />,
      },
    ]
  }
];

// Maintain this for backward compatibility if needed elsewhere
export const mainMenuItems: MenuItem[] = menuGroups.flatMap(group => group.items);

// We're removing secondaryMenuItems to avoid duplication of "Configurações"
// Instead, we'll consolidate to only use the one in the "Sistema" group
export const secondaryMenuItems: MenuItem[] = []; 

// For gestão-comercial sub-navigation
export const gestaoComercialItems = [
  {
    label: "Funil de Leads",
    path: "/gestao-comercial/funil-leads",
    icon: <UserCircle className="h-4 w-4" />,
  },
  {
    label: "Distribuidores",
    path: "/gestao-comercial/distribuidores",
    icon: <Building className="h-4 w-4" />,
  },
  {
    label: "Parceiros",
    path: "/gestao-comercial/parceiros",
    icon: <HelpingHand className="h-4 w-4" />,
  },
];

// For gestão-financeira sub-navigation
export const gestaoFinanceiraItems = [
  {
    label: "Projeções",
    path: "/projecoes",
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    label: "Custos",
    path: "/custos",
    icon: <Receipt className="h-4 w-4" />,
  },
  {
    label: "Projeção de Resultados por PDV",
    path: "/gestao-financeira/projecao-resultados-pdv",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    label: "Ponto de Equilíbrio",
    path: "/gestao-financeira/ponto-equilibrio",
    icon: <Calculator className="h-4 w-4" />,
  }
];
