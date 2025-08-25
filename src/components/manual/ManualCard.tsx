
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useManualProgress } from '@/hooks/useManualProgress';

interface ManualCardProps {
  onClick: () => void;
}

export default function ManualCard({ onClick }: ManualCardProps) {
  const { progress } = useManualProgress();

  return (
    <Card 
      className="group cursor-pointer border border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-black/5 hover:border-border/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1" 
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg shadow-black/10">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          {progress.totalProgress > 0 && (
            <Badge className="bg-green-500 text-white text-xs font-medium px-2 py-1 shadow-sm">
              {progress.totalProgress}% concluído
            </Badge>
          )}
        </div>
        <div className="text-left space-y-2">
          <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            Manual de Instruções
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground leading-relaxed font-medium">
            Guia completo para usar o MischaOS
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {progress.totalProgress > 0 && (
          <div className="mb-4 text-left">
            <Progress value={progress.totalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-left">
              {progress.completedSteps.length} passos concluídos
            </p>
          </div>
        )}
        <div className="flex items-center justify-between text-sm group-hover:text-primary transition-colors">
          <span className="font-semibold text-left">Começar aprendizado</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
