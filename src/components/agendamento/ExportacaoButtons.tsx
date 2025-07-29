
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText } from "lucide-react";
import { useExportacao } from "@/hooks/useExportacao";
import { toast } from "@/hooks/use-toast";
import { Cliente } from "@/types";

interface ClienteExportacao extends Cliente {
  statusConfirmacao: string;
  dataReposicao: Date;
  tipoPedido?: string;
  observacoes: string;
}

interface ExportacaoButtonsProps {
  clientes: ClienteExportacao[];
  filtroAtivo: string;
}

export default function ExportacaoButtons({ clientes, filtroAtivo }: ExportacaoButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { exportarCSV, exportarPDF } = useExportacao();

  const handleExportCSV = async () => {
    if (clientes.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há clientes na lista atual para exportar.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const nomeArquivo = `confirmacao_${filtroAtivo.toLowerCase().replace(' ', '_')}`;
      exportarCSV(clientes, nomeArquivo);
      
      toast({
        title: "Exportação concluída",
        description: `${clientes.length} registros exportados para CSV com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar para CSV.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (clientes.length === 0) {
      toast({
        title: "Nenhum dado para exportar", 
        description: "Não há clientes na lista atual para exportar.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const nomeArquivo = `confirmacao_${filtroAtivo.toLowerCase().replace(' ', '_')}`;
      exportarPDF(clientes, nomeArquivo);
      
      toast({
        title: "Exportação concluída",
        description: `${clientes.length} registros exportados para PDF com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar para PDF.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar Lista"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
