import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, Snowflake } from "lucide-react";

export default function ExplicacaoConfirmationScore() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/40 border-dashed">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/60 transition-colors rounded-lg text-left">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Como funciona o Cálculo de Probabilidade?</span>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5 px-5 space-y-5 text-sm">
            {/* O que é */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <BarChart3 className="h-4 w-4 text-primary" />
                O que é o Score
              </div>
              <p className="text-muted-foreground leading-relaxed">
                O score de confirmação estima a probabilidade (0–100%) de um agendamento ser confirmado, com base no histórico do cliente. Ele é exibido como um badge colorido nos cards do calendário semanal.
              </p>
            </section>

            {/* Baseline */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-blue-500" />
                Baseline de Cadência (peso principal)
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                <li>Analisa as entregas dos últimos <strong>84 dias</strong> e calcula o intervalo médio entre elas</li>
                <li>Se o agendamento está dentro do prazo esperado (±3 dias): baseline de <strong>95%</strong></li>
                <li>Atrasado (além da cadência): bônus de <strong>+1%</strong> por dia (máx +10%) — cliente precisa do produto</li>
                <li>Antecipação excessiva (&gt;3 dias antes): penalidade de <strong>−2%</strong> por dia além da margem</li>
                <li>Clientes com apenas 2 entregas recebem peso reduzido (×0.5)</li>
              </ul>
            </section>

            {/* Volatilidade */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Penalidade por Volatilidade
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                <li>Cada reagendamento vinculado ao pedido: <strong>−15%</strong></li>
                <li>Se o reagendamento foi feito com menos de <strong>24h</strong> de antecedência: <strong>−10% extra</strong></li>
              </ul>
            </section>

            {/* Tendência */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Vetor de Tendência
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                <li>Se o cliente costuma <strong>adiantar</strong> pedidos: bônus de <strong>+5%</strong></li>
                <li>Se o pedido atual tem <strong>2+ adiamentos</strong>: penalidade de <strong>−20%</strong></li>
              </ul>
            </section>

            {/* Cold Start */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <Snowflake className="h-4 w-4 text-cyan-500" />
                Cold Start (clientes novos)
              </div>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                <li>Sem entregas registradas: score fixo de <strong>70%</strong></li>
                <li>Apenas 1 entrega: score fixo de <strong>80%</strong></li>
              </ul>
            </section>

            {/* Faixas */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Faixas de Classificação
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border bg-background">
                  <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-300 text-xs">
                    &gt;85% — Confirmado Provável
                  </Badge>
                  <span className="text-xs text-muted-foreground text-center">Baixo risco</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border bg-background">
                  <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 border-yellow-300 text-xs">
                    50–84% — Atenção
                  </Badge>
                  <span className="text-xs text-muted-foreground text-center">Risco moderado</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2.5 rounded-md border bg-background">
                  <Badge variant="outline" className="bg-red-500/15 text-red-700 border-red-300 text-xs">
                    &lt;50% — Alto Risco
                  </Badge>
                  <span className="text-xs text-muted-foreground text-center">Pode cancelar</span>
                </div>
              </div>
            </section>

            {/* Fórmula */}
            <section className="p-3 rounded-md bg-background border text-xs text-muted-foreground">
              <strong className="text-foreground">Fórmula final:</strong>{" "}
              Score = Baseline + Volatilidade + Tendência (limitado entre 5% e 99%)
            </section>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
