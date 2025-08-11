
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjecaoProducaoTab from "@/components/pcp/ProjecaoProducaoTab";
import NecessidadeDiariaTab from "@/components/pcp/NecessidadeDiariaTab";
import ProducaoAgendadaTab from "@/components/pcp/ProducaoAgendadaTab";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";
import AuditoriaPCPTab from "@/components/pcp/AuditoriaPCPTab";
import PCPHeader from "@/components/pcp/PCPHeader";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { useTabPersistenceV2 } from "@/hooks/useTabPersistenceV2";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PCP() {
  const { activeTab, setActiveTab, semanaAtual, setSemanaAtual } = usePlanejamentoProducaoStore();
  
  useTabPersistenceV2('pcp', {
    activeTab,
    setActiveTab
  });

  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 1 });

  const voltarSemana = () => {
    setSemanaAtual(subWeeks(semanaAtual, 1));
  };

  const avancarSemana = () => {
    setSemanaAtual(addWeeks(semanaAtual, 1));
  };

  const voltarHoje = () => {
    setSemanaAtual(new Date());
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PCPHeader 
        inicioSemana={inicioSemana}
        fimSemana={fimSemana}
        voltarSemana={voltarSemana}
        avancarSemana={avancarSemana}
        voltarHoje={voltarHoje}
        semanaAtual={semanaAtual}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projecao-producao">Projeção</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade</TabsTrigger>
          <TabsTrigger value="producao-agendada">Produção Agendada</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="auditoria-pcp">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="projecao-producao" className="space-y-6 mt-6" forceMount>
          <ProjecaoProducaoTab />
        </TabsContent>

        <TabsContent value="necessidade-diaria" className="space-y-6 mt-6" forceMount>
          <NecessidadeDiariaTab />
        </TabsContent>

        <TabsContent value="producao-agendada" className="space-y-6 mt-6" forceMount>
          <ProducaoAgendadaTab />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-6" forceMount>
          <HistoricoProducao />
        </TabsContent>

        <TabsContent value="auditoria-pcp" className="space-y-6 mt-6" forceMount>
          <AuditoriaPCPTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
