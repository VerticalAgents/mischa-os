import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BarraInferior from "@/components/mobile/BarraInferior";
import { itensBarraRep } from "@/components/mobile/itens-barra";
import RepMobileMenuSheet from "@/components/rep/RepMobileMenuSheet";

export default function RepMobileDock() {
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <>
      <BarraInferior
        itens={itensBarraRep}
        maisAberto={menuAberto}
        aoAbrirMais={() => setMenuAberto(true)}
      />
      <RepMobileMenuSheet open={menuAberto} onOpenChange={setMenuAberto} />
    </>
  );
}
