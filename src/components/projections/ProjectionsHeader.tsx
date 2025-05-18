
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Printer, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type ProjectionsHeaderProps = {
  activeView: 'scenarios' | 'comparison';
  setActiveView: (view: 'scenarios' | 'comparison') => void;
};

export function ProjectionsHeader({ activeView, setActiveView }: ProjectionsHeaderProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = (format: 'pdf' | 'csv' | 'xlsx') => {
    setExporting(true);

    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${format.toUpperCase()} exportado com sucesso.`
      });
      setExporting(false);
    }, 1500);
  };

  const handlePrint = () => {
    toast({
      title: "Preparando impressão",
      description: "O documento será enviado para a impressora."
    });
    
    // Use the browser's print functionality
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'scenarios' | 'comparison')}>
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1" disabled={exporting}>
              <FileText className="h-4 w-4" />
              Exportar
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              Exportar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Exportar como CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('xlsx')}>
              Exportar como XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
