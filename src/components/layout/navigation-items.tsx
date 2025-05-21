
import { ReactNode } from "react";
import { 
  BarChart3, Users, Tag, Clipboard, 
  ShoppingBag, Settings, Layers, Truck, FileText,
  Cpu, PackageCheck
} from "lucide-react";

export type MenuItem = {
  label: string;
  path: string;
  icon: ReactNode;
};

export const mainMenuItems: MenuItem[] = [
  {
    label: "Dashboard & Analytics",
    path: "/",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Precificação",
    path: "/precificacao",
    icon: <Tag className="h-4 w-4" />,
  },
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
    path: "/estoque",
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    label: "PCP",
    path: "/pcp",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    label: "Projeções",
    path: "/projecoes",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: "Agentes de IA",
    path: "/agentes-ia",
    icon: <Cpu className="h-4 w-4" />,
  },
];

export const secondaryMenuItems: MenuItem[] = [
  {
    label: "Configurações",
    path: "/configuracoes",
    icon: <Settings className="h-4 w-4" />,
  },
];
