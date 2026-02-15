import { CalendarClock } from "lucide-react";
import { useReagendamentosEntreSemanas } from "@/hooks/useReagendamentosEntreSemanas";
import ReagendamentosResumo from "@/components/reagendamentos/ReagendamentosResumo";
import ReagendamentosTable from "@/components/reagendamentos/ReagendamentosTable";
import ExplicacaoConfirmationScore from "@/components/reagendamentos/ExplicacaoConfirmationScore";

export default function Reagendamentos() {
  const { reagendamentos, resumo, isLoading, excluir } = useReagendamentosEntreSemanas();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Log de Reagendamentos</h1>
          <p className="text-muted-foreground text-sm">
            Registro de adiamentos e adiantamentos entre semanas
          </p>
        </div>
      </div>

      <ExplicacaoConfirmationScore />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <ReagendamentosResumo
            total={resumo.total}
            adiamentos={resumo.adiamentos}
            adiantamentos={resumo.adiantamentos}
            mediaSemanas={resumo.mediaSemanas}
            topClientes={resumo.topClientes}
          />
          <ReagendamentosTable reagendamentos={reagendamentos} onExcluir={excluir} />
        </>
      )}
    </div>
  );
}
