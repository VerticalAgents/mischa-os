
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
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          {progress.totalProgress > 0 && (
            <Badge className="bg-green-500 text-white text-xs">
              {progress.totalProgress}% concluído
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">Manual de Instruções</CardTitle>
        <CardDescription className="text-sm">
          Guia completo para usar o MischaOS
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {progress.totalProgress > 0 && (
          <div className="mb-3">
            <Progress value={progress.totalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress.completedSteps.length} passos concluídos
            </p>
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          <span>Começar aprendizado</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
