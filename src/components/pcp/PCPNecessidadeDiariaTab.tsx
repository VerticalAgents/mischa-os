
import { useSaborStore } from "@/hooks/useSaborStore";
import DailyNeedsTab from "@/components/pcp/DailyNeedsTab";

interface PCPNecessidadeDiariaTabProps {
  mostrarPedidosPrevistos: boolean;
  setMostrarPedidosPrevistos: (mostrar: boolean) => void;
}

export default function PCPNecessidadeDiariaTab({
  mostrarPedidosPrevistos,
  setMostrarPedidosPrevistos
}: PCPNecessidadeDiariaTabProps) {
  const { sabores } = useSaborStore();

  // Mock data for daily needs - in a real app, would be calculated from pedidos
  const necessidadeDiaria = [
    { 
      data: new Date(), 
      diaSemana: 'Seg', 
      totalUnidades: 520, 
      formasNecessarias: 18,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 220 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 150 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 70 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 80 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 1)), 
      diaSemana: 'Ter', 
      totalUnidades: 480, 
      formasNecessarias: 16,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 200 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 50 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 100 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 2)), 
      diaSemana: 'Qua', 
      totalUnidades: 490, 
      formasNecessarias: 17,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 210 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 60 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 90 }
      ]
    }
  ];

  return (
    <DailyNeedsTab
      necessidadeDiaria={necessidadeDiaria}
      sabores={sabores}
      mostrarPedidosPrevistos={mostrarPedidosPrevistos}
      setMostrarPedidosPrevistos={setMostrarPedidosPrevistos}
    />
  );
}
