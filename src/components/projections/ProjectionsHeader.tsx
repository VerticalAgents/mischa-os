
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProjectionStore } from '@/hooks/useProjectionStore';

interface ProjectionsHeaderProps {
  activeView: 'scenarios' | 'comparison';
  setActiveView: (view: 'scenarios' | 'comparison') => void;
}

export function ProjectionsHeader({ activeView, setActiveView }: ProjectionsHeaderProps) {
  const { toast } = useToast();
  const { baseDRE, scenarios, activeScenarioId } = useProjectionStore();
  const [isPrinting, setIsPrinting] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  const handleExport = () => {
    // In a real app, this would use a library like jsPDF or html2pdf
    // For now, we'll just show a toast message
    toast({
      title: "Exportação iniciada",
      description: "Os documentos serão gerados em instantes.",
    });
  };
  
  const handlePrint = () => {
    setIsPrinting(true);
    
    // In a real application, we'd prepare the content for printing
    // For now, we'll just use the browser's print functionality
    setTimeout(() => {
      if (printFrameRef.current?.contentWindow) {
        printFrameRef.current.contentWindow.print();
      }
      setIsPrinting(false);
    }, 500);
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-2xl font-bold">Projeções Financeiras</h2>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs 
          value={activeView} 
          onValueChange={(value) => setActiveView(value as 'scenarios' | 'comparison')}
        >
          <TabsList>
            <TabsTrigger value="scenarios">Cenários</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <FileText className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>
      
      {/* Hidden iframe for printing */}
      <iframe 
        ref={printFrameRef}
        style={{ display: 'none' }}
        title="print-frame"
        src="about:blank"
      />
    </div>
  );
}
