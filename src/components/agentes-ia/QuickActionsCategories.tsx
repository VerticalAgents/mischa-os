import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Users, Calendar, DollarSign, Factory, Package, TrendingUp, 
  LayoutDashboard, UserMinus, TrendingDown, UserPlus, Clock, 
  ShoppingCart, Award, MapPin, FileText, PackageCheck, CalendarDays,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS_CATEGORIZED = {
  clientes: {
    label: "Clientes",
    icon: Users,
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
    actions: [
      { label: "Clientes inativos", icon: UserMinus, prompt: "Quais clientes não recebem entrega há mais de 14 dias?" },
      { label: "Clientes em queda", icon: TrendingDown, prompt: "Quais clientes estão com queda de giro acima de 20%?" },
      { label: "Clientes novos", icon: UserPlus, prompt: "Quais clientes foram cadastrados nos últimos 30 dias?" },
    ]
  },
  agendamentos: {
    label: "Agendamentos",
    icon: Calendar,
    color: "text-green-600 bg-green-50 border-green-200 hover:bg-green-100",
    actions: [
      { label: "Previsão semana", icon: CalendarDays, prompt: "Qual a previsão de reposição para os próximos 7 dias?" },
      { label: "Entregas atrasadas", icon: Clock, prompt: "Quais entregas estão atrasadas nos últimos 7 dias?" },
    ]
  },
  financeiro: {
    label: "Financeiro",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
    actions: [
      { label: "Faturamento semana", icon: DollarSign, prompt: "Qual o faturamento estimado da última semana?" },
    ]
  },
  producao: {
    label: "Produção",
    icon: Factory,
    color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
    actions: [
      { label: "Produção necessária", icon: Factory, prompt: "O que preciso produzir esta semana considerando estoque e agendamentos?" },
    ]
  },
  estoque: {
    label: "Estoque",
    icon: Package,
    color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
    actions: [
      { label: "Status estoque", icon: PackageCheck, prompt: "Quais produtos estão com estoque abaixo do mínimo ou precisam de produção urgente?" },
      { label: "Insumos p/ comprar", icon: ShoppingCart, prompt: "Quais insumos preciso comprar? Mostre apenas os críticos." },
    ]
  },
  comercial: {
    label: "Comercial",
    icon: TrendingUp,
    color: "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100",
    actions: [
      { label: "Ranking vendedores", icon: Award, prompt: "Qual o ranking de representantes por volume de vendas?" },
      { label: "Performance rotas", icon: MapPin, prompt: "Como está a performance de cada rota de entrega?" },
    ]
  },
  geral: {
    label: "Geral",
    icon: LayoutDashboard,
    color: "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100",
    actions: [
      { label: "Resumo do dia", icon: FileText, prompt: "Me dê um resumo executivo do dia: entregas pendentes, produção necessária e alertas importantes." },
    ]
  }
};

interface QuickActionsCategoriesProps {
  onSelectAction: (prompt: string) => void;
}

export function QuickActionsCategories({ onSelectAction }: QuickActionsCategoriesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  const handleActionClick = (prompt: string) => {
    onSelectAction(prompt);
    setExpandedCategory(null);
  };

  return (
    <div className="space-y-3">
      {/* Grid de categorias */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {Object.entries(QUICK_ACTIONS_CATEGORIZED).map(([key, category]) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === key;
          
          return (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200",
                category.color,
                isExpanded && "ring-2 ring-offset-1 ring-primary/50"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate w-full text-center">
                {category.label}
              </span>
              <span className="text-[10px] opacity-70">
                {category.actions.length} {category.actions.length === 1 ? 'ação' : 'ações'}
              </span>
              <ChevronDown 
                className={cn(
                  "h-3 w-3 mt-1 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Ações expandidas */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
              {QUICK_ACTIONS_CATEGORIZED[expandedCategory as keyof typeof QUICK_ACTIONS_CATEGORIZED].actions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleActionClick(action.prompt)}
                  >
                    <ActionIcon className="h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
