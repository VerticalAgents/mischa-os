
import RetrospectiveTab from "@/components/pcp/RetrospectiveTab";

export default function PCPRetrospectivaTab() {
  // Mock data for retrospective (last 30 days)
  const retrospectiva = [
    { idSabor: 1, nomeSabor: 'Tradicional', totalUnidades: 2800, formasNecessarias: 93, percentualTotal: 38.5, crescimento: 5.2 },
    { idSabor: 2, nomeSabor: 'Choco Duo', totalUnidades: 1950, formasNecessarias: 65, percentualTotal: 26.8, crescimento: 3.1 },
    { idSabor: 5, nomeSabor: 'Avelã', totalUnidades: 1250, formasNecessarias: 42, percentualTotal: 17.2, crescimento: -2.5 },
    { idSabor: 3, nomeSabor: 'Mesclado', totalUnidades: 850, formasNecessarias: 28, percentualTotal: 11.7, crescimento: 8.7 },
    { idSabor: 4, nomeSabor: 'Surpresa', totalUnidades: 420, formasNecessarias: 14, percentualTotal: 5.8, crescimento: 1.2 }
  ];

  return <RetrospectiveTab retrospectiva={retrospectiva} />;
}
