import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExplicacaoCalculoProps {
  titulo: string;
  explicacao: string;
  formula?: string;
  exemplo?: string;
  observacoes?: string[];
  fontes?: string[];
}

interface TooltipExplicativoProps {
  children: React.ReactNode;
  explicacao: ExplicacaoCalculoProps;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'indicator' | 'table-header';
}

const FormulaDisplay = ({ formula }: { formula: string }) => (
  <div className="bg-muted/50 p-2 rounded text-xs font-mono mt-2">
    <strong>Fórmula:</strong> {formula}
  </div>
);

const ExemploDisplay = ({ exemplo }: { exemplo: string }) => (
  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs mt-2">
    <strong>Exemplo:</strong> {exemplo}
  </div>
);

const ObservacoesDisplay = ({ observacoes }: { observacoes: string[] }) => (
  <div className="mt-2">
    <strong className="text-xs">Observações:</strong>
    <ul className="text-xs mt-1 space-y-1">
      {observacoes.map((obs, index) => (
        <li key={index} className="flex items-start gap-1">
          <span className="text-muted-foreground">•</span>
          <span>{obs}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FontesDisplay = ({ fontes }: { fontes: string[] }) => (
  <div className="mt-2 pt-2 border-t border-border">
    <strong className="text-xs text-muted-foreground">Fonte dos dados:</strong>
    <ul className="text-xs mt-1 space-y-1">
      {fontes.map((fonte, index) => (
        <li key={index} className="text-muted-foreground">{fonte}</li>
      ))}
    </ul>
  </div>
);

export default function TooltipExplicativo({ 
  children, 
  explicacao, 
  side = 'top',
  className,
  showIcon = false,
  variant = 'default'
}: TooltipExplicativoProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine icon and styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'indicator':
        return {
          triggerClass: "cursor-help hover:bg-muted/50 rounded-md transition-colors",
          icon: <Info className="h-3 w-3 text-muted-foreground ml-1" />
        };
      case 'table-header':
        return {
          triggerClass: "cursor-help",
          icon: <HelpCircle className="h-3 w-3 text-muted-foreground ml-1" />
        };
      default:
        return {
          triggerClass: "cursor-help",
          icon: showIcon ? <Info className="h-3 w-3 text-muted-foreground ml-1" /> : null
        };
    }
  };

  const { triggerClass, icon } = getVariantStyles();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div className={cn(triggerClass, className)}>
            <div className="flex items-center">
              {children}
              {icon}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-sm p-4 space-y-2"
          sideOffset={8}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{explicacao.titulo}</h4>
            <p className="text-xs leading-relaxed">{explicacao.explicacao}</p>
            
            {explicacao.formula && <FormulaDisplay formula={explicacao.formula} />}
            {explicacao.exemplo && <ExemploDisplay exemplo={explicacao.exemplo} />}
            {explicacao.observacoes && explicacao.observacoes.length > 0 && (
              <ObservacoesDisplay observacoes={explicacao.observacoes} />
            )}
            {explicacao.fontes && explicacao.fontes.length > 0 && (
              <FontesDisplay fontes={explicacao.fontes} />
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}