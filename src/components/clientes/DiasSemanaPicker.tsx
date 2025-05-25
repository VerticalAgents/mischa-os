import React from 'react';
import { DiaSemana } from '@/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const diasSemana: DiaSemana[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

interface DiaSemanaPickerProps {
  value: DiaSemana[];
  onChange: (value: DiaSemana[]) => void;
  className?: string;
}

export default function DiasSemanaPicker({ value, onChange, className }: DiaSemanaPickerProps) {
  const toggleDia = (dia: DiaSemana) => {
    if (value.includes(dia)) {
      onChange(value.filter(d => d !== dia));
    } else {
      onChange([...value, dia]);
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {diasSemana.map((dia) => (
          <button
            key={dia}
            type="button"
            onClick={() => toggleDia(dia)}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors
              ${value.includes(dia)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {dia}
          </button>
        ))}
      </div>
    </div>
  );
}

