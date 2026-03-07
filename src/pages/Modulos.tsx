
import { 
  Users, Clipboard, Truck, PackageCheck, Layers, RefreshCw, CalendarClock,
  Tag, DollarSign, BarChart3, TrendingUp, MapPin, ShoppingBag, Cpu,
  ArrowRight, Settings, ChevronDown, ChevronUp, Sparkles, Receipt, Download
} from "lucide-react";
import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TierKey = 'essential' | 'operations' | 'intelligence' | 'cross';

interface ModuleInfo {
  name: string;
  icon: ReactNode;
  description: string;
  tier: TierKey;
  dependencies: string[];
}

const modules: ModuleInfo[] = [
  { name: "Clientes", icon: <Users className="h-5 w-5" />, description: "Cadastro e gestão de clientes e PDVs", tier: "essential", dependencies: [] },
  { name: "Produtos", icon: <Settings className="h-5 w-5" />, description: "Configuração de produtos, categorias e receitas", tier: "essential", dependencies: [] },
  { name: "Agendamento", icon: <Clipboard className="h-5 w-5" />, description: "Agenda de reposições e pedidos por cliente", tier: "essential", dependencies: ["Clientes", "Produtos"] },
  { name: "Expedição", icon: <Truck className="h-5 w-5" />, description: "Controle de entregas, rotas e confirmações", tier: "essential", dependencies: ["Agendamento"] },
  { name: "Estoque", icon: <PackageCheck className="h-5 w-5" />, description: "Gestão de estoque de produtos e insumos", tier: "operations", dependencies: ["Produtos"] },
  { name: "PCP", icon: <Layers className="h-5 w-5" />, description: "Planejamento e controle de produção", tier: "operations", dependencies: ["Agendamento", "Estoque"] },
  { name: "Controle de Trocas", icon: <RefreshCw className="h-5 w-5" />, description: "Registro e acompanhamento de trocas/devoluções", tier: "operations", dependencies: ["Expedição", "Clientes"] },
  { name: "Reagendamentos", icon: <CalendarClock className="h-5 w-5" />, description: "Gestão de adiamentos entre semanas", tier: "operations", dependencies: ["Agendamento"] },
  { name: "Precificação", icon: <Tag className="h-5 w-5" />, description: "Formação de preço e margens por produto/cliente", tier: "intelligence", dependencies: ["Produtos", "Estoque"] },
  { name: "Financeiro", icon: <DollarSign className="h-5 w-5" />, description: "Custos, projeções, ponto de equilíbrio e DRE", tier: "intelligence", dependencies: ["Expedição", "Clientes"] },
  { name: "Dashboard & Analytics", icon: <BarChart3 className="h-5 w-5" />, description: "Visão consolidada de KPIs e métricas do negócio", tier: "intelligence", dependencies: ["Todos os módulos"] },
  { name: "Insights PDV", icon: <TrendingUp className="h-5 w-5" />, description: "Análise de giro, performance e alertas por PDV", tier: "intelligence", dependencies: ["Expedição", "Clientes"] },
  { name: "Mapas", icon: <MapPin className="h-5 w-5" />, description: "Visualização geográfica de clientes e rotas", tier: "intelligence", dependencies: ["Clientes"] },
  { name: "Gestão Comercial", icon: <ShoppingBag className="h-5 w-5" />, description: "Funil de leads, distribuidores e parceiros", tier: "intelligence", dependencies: ["Clientes"] },
];

const tierConfig: Record<TierKey, { label: string; subtitle: string; color: string; bgColor: string; borderColor: string; badgeClass: string }> = {
  essential: {
    label: "Essencial",
    subtitle: "Para quem está começando",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  operations: {
    label: "Operações",
    subtitle: "Para quem já tem volume",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  intelligence: {
    label: "Gestão & Inteligência",
    subtitle: "Para quem quer escalar",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  cross: {
    label: "Cross-Module",
    subtitle: "Disponível em todos os tiers",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
};

const upsellExamples = [
  {
    from: "Tier 1",
    message: "Você tem 3 clientes com queda de giro nas últimas semanas. Com o módulo de Insights PDV você teria alertas automáticos.",
    targetModule: "Insights PDV",
    targetTier: "Tier 3",
  },
  {
    from: "Tier 1",
    message: "Baseado nas suas entregas, estimo que seu custo por entrega é R$ 12,40. O módulo Financeiro te daria essa visão completa.",
    targetModule: "Financeiro",
    targetTier: "Tier 3",
  },
  {
    from: "Tier 2",
    message: "Seu estoque de 3 insumos está abaixo do mínimo. Com o Dashboard você teria visibilidade total em tempo real.",
    targetModule: "Dashboard & Analytics",
    targetTier: "Tier 3",
  },
];

function TierCard({ tier }: { tier: TierKey }) {
  const config = tierConfig[tier];
  const tierModules = modules.filter(m => m.tier === tier);

  return (
    <Card className={`${config.borderColor} ${config.bgColor} border-2 h-full`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-bold ${config.color}`}>
            {config.label}
          </CardTitle>
          <Badge className={config.badgeClass} variant="secondary">
            Tier {tier === 'essential' ? '1' : tier === 'operations' ? '2' : '3'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {tierModules.map((mod) => (
          <div key={mod.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-card/80 border border-border/50">
            <div className={`mt-0.5 ${config.color}`}>{mod.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{mod.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              {mod.dependencies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {mod.dependencies.map(dep => (
                    <Badge key={dep} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {dep}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function generateMarkdown(): string {
  const lines: string[] = [];
  lines.push("# Mapa de Módulos SaaS\n");
  lines.push("Visualização das conexões entre módulos e composição dos pacotes comerciais.\n");

  // Cross-modules
  lines.push("## Módulos Cross-Module\n");
  lines.push("### Mischa IA");
  lines.push("Disponível em todos os tiers com capacidades que escalam.\n");
  lines.push("| Tier | Capacidades |");
  lines.push("|---|---|");
  lines.push("| Tier 1 | Responde sobre clientes, agendamentos e entregas |");
  lines.push("| Tier 2 | + estoque, produção, trocas e compras |");
  lines.push("| Tier 3 | + financeiro, analytics, comercial e mapas |\n");

  lines.push("### Faturamento & Pagamentos");
  lines.push("Emissão de NF-e, geração de boletos, PIX e gestão de recebimentos.\n");
  lines.push("| Tier | Capacidades |");
  lines.push("|---|---|");
  lines.push("| Tier 1 | NF-e básica e geração de boletos/PIX |");
  lines.push("| Tier 2 | + conciliação e cobrança automática |");
  lines.push("| Tier 3 | + relatórios financeiros integrados |\n");

  // Tiers
  const tierKeys: TierKey[] = ['essential', 'operations', 'intelligence'];
  for (const tier of tierKeys) {
    const config = tierConfig[tier];
    const tierModules = modules.filter(m => m.tier === tier);
    lines.push(`## ${config.label} (Tier ${tier === 'essential' ? '1' : tier === 'operations' ? '2' : '3'})`);
    lines.push(`${config.subtitle}\n`);
    lines.push("| Módulo | Descrição | Dependências |");
    lines.push("|---|---|---|");
    for (const mod of tierModules) {
      const deps = mod.dependencies.length > 0 ? mod.dependencies.join(", ") : "—";
      lines.push(`| ${mod.name} | ${mod.description} | ${deps} |`);
    }
    lines.push("");
  }

  // Upsell
  lines.push("## Estratégia de Upsell via Mischa IA\n");
  for (const ex of upsellExamples) {
    lines.push(`- **Usuário ${ex.from} → ${ex.targetModule} (${ex.targetTier}):** "${ex.message}"`);
  }
  lines.push("");

  // Full matrix
  lines.push("## Matriz de Dependências Completa\n");
  lines.push("| Módulo | Tier | Depende de |");
  lines.push("|---|---|---|");
  for (const mod of modules) {
    const config = tierConfig[mod.tier];
    const deps = mod.dependencies.length > 0 ? mod.dependencies.join(", ") : "—";
    lines.push(`| ${mod.name} | ${config.label} | ${deps} |`);
  }
  lines.push("| Mischa IA | Cross-Module | Escala com tier ativo |");
  lines.push("| Faturamento & Pagamentos | Cross-Module | Escala com tier ativo |");

  return lines.join("\n");
}

function exportMarkdown() {
  const content = generateMarkdown();
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mapa-modulos-saas.md";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Modulos() {
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa de Módulos SaaS</h1>
          <p className="text-muted-foreground mt-1">
            Visualize as conexões entre módulos e a composição dos pacotes comerciais
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportMarkdown}>
          <Download className="h-4 w-4 mr-1.5" />
          Exportar Markdown
        </Button>
      </div>

      {/* Mischa IA Cross-Module Card */}
      <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-yellow-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-foreground">Mischa IA</h2>
                <Badge className={tierConfig.cross.badgeClass} variant="secondary">Cross-Module</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Disponível em todos os tiers com capacidades que escalam. Motor de upsell natural — mostra insights 
                do tier superior para demonstrar valor e incentivar upgrade.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">No Tier 1</p>
                  <p className="text-xs text-muted-foreground">Responde sobre clientes, agendamentos e entregas</p>
                </div>
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">No Tier 2</p>
                  <p className="text-xs text-muted-foreground">+ estoque, produção, trocas e compras</p>
                </div>
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">No Tier 3</p>
                  <p className="text-xs text-muted-foreground">+ financeiro, analytics, comercial e mapas</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faturamento & Pagamentos Cross-Module Card */}
      <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-yellow-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-foreground">Faturamento & Pagamentos</h2>
                <Badge className={tierConfig.cross.badgeClass} variant="secondary">Cross-Module</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Emissão de NF-e, geração de boletos, PIX e gestão de recebimentos. Disponível em todos os tiers com recursos que escalam.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">No Tier 1</p>
                  <p className="text-xs text-muted-foreground">NF-e básica e geração de boletos/PIX</p>
                </div>
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">No Tier 2</p>
                  <p className="text-xs text-muted-foreground">+ conciliação e cobrança automática</p>
                </div>
                <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">No Tier 3</p>
                  <p className="text-xs text-muted-foreground">+ relatórios financeiros integrados</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow arrows between tiers */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Badge className={tierConfig.essential.badgeClass} variant="secondary">Tier 1 — Essencial</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge className={tierConfig.operations.badgeClass} variant="secondary">Tier 2 — Operações</Badge>
        <ArrowRight className="h-4 w-4" />
        <Badge className={tierConfig.intelligence.badgeClass} variant="secondary">Tier 3 — Gestão</Badge>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <TierCard tier="essential" />
        <TierCard tier="operations" />
        <TierCard tier="intelligence" />
      </div>

      {/* Upsell Strategy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Estratégia de Upsell via Mischa IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Exemplos de como a IA sugere funcionalidades de tiers superiores
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {upsellExamples.map((ex, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">Usuário {ex.from}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="text-[10px]">{ex.targetModule} ({ex.targetTier})</Badge>
                </div>
                <p className="text-sm text-foreground italic">"{ex.message}"</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dependency Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Matriz de Dependências</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowMatrix(!showMatrix)}>
              {showMatrix ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {showMatrix ? "Recolher" : "Expandir"}
            </Button>
          </div>
        </CardHeader>
        {showMatrix && (
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Módulo</TableHead>
                    <TableHead className="font-semibold">Tier</TableHead>
                    <TableHead className="font-semibold">Depende de</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((mod) => {
                    const config = tierConfig[mod.tier];
                    return (
                      <TableRow key={mod.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{mod.icon}</span>
                            {mod.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.badgeClass} variant="secondary">
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mod.dependencies.length === 0 ? (
                            <span className="text-muted-foreground text-sm">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {mod.dependencies.map(dep => (
                                <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600"><Sparkles className="h-5 w-5" /></span>
                        <span className="font-bold">Mischa IA</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tierConfig.cross.badgeClass} variant="secondary">Cross-Module</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground italic">Escala com tier ativo</span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600"><Receipt className="h-5 w-5" /></span>
                        <span className="font-bold">Faturamento & Pagamentos</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tierConfig.cross.badgeClass} variant="secondary">Cross-Module</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground italic">Escala com tier ativo</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
