import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BarraInferior from "@/components/mobile/BarraInferior";
import { useItensBarraApp } from "@/components/mobile/itens-barra";
import MobileMenuSheet from "@/components/layout/MobileMenuSheet";

export default function MobileDock() {
  const { pathname } = useLocation();
  const itens = useItensBarraApp();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <>
      <BarraInferior
        itens={itens}
        maisAberto={menuAberto}
        aoAbrirMais={() => setMenuAberto(true)}
      />
      <MobileMenuSheet open={menuAberto} onOpenChange={setMenuAberto} />
    </>
  );
}
