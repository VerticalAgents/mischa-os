
import { ReactNode } from "react";
import { 
  BarChart3, Users, Tag, Clipboard, 
  ShoppingBag, Settings, Layers, Truck, FileText,
  Cpu
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
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Precificação",
    path: "/precificacao",
    icon: <Tag className="h-5 w-5" />,
  },
  {
    label: "Agendamento",
    path: "/agendamento",
    icon: <Clipboard className="h-5 w-5" />,
  },
  {
    label: "Expedição",
    path: "/expedicao",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    label: "Estoque",
    path: "/estoque",
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    label: "PCP",
    path: "/pcp",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    label: "Projeções",
    path: "/projecoes",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Agentes de IA",
    path: "/agentes-ia",
    icon: <Cpu className="h-5 w-5" />,
  },
];

export const secondaryMenuItems: MenuItem[] = [
  {
    label: "Configurações",
    path: "/configuracoes",
    icon: <Settings className="h-5 w-5" />,
  },
];
