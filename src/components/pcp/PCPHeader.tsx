
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PCPHeaderProps {
  inicioSemana: Date;
  fimSemana: Date;
  voltarSemana: () => void;
  avancarSemana: () => void;
  calcularPlanejamentoProducao: () => void;
  exportarPlanejamento: () => void;
}

export default function PCPHeader({
  inicioSemana,
  fimSemana,
  voltarSemana,
  avancarSemana,
  calcularPlanejamentoProducao,
  exportarPlanejamento
}: PCPHeaderProps) {
  return (
    <PageHeader 
      title="Planejamento e Controle de Produção (PCP)" 
      description="Planejamento de produção baseado nos pedidos agendados e previstos"
    >
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={voltarSemana}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Semana Anterior
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[240px] justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {format(inicioSemana, "dd/MM")} - {format(fimSemana, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Semana selecionada</h4>
                <p className="text-sm text-muted-foreground">
                  {format(inicioSemana, "dd 'de' MMMM", { locale: ptBR })} - 
                  {format(fimSemana, " dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" onClick={avancarSemana}>
          Próxima Semana
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button onClick={calcularPlanejamentoProducao}>
          Calcular Produção
        </Button>
        <Button variant="outline" onClick={exportarPlanejamento}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>
    </PageHeader>
  );
}
