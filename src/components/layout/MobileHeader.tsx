import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import mischasLogo from "@/assets/mischas-logo.png";

/**
 * Cabeçalho do celular — cápsula vermelha flutuante.
 *
 * Era uma faixa de 56px colada nas bordas, com o nome em negrito grande. Virou
 * uma cápsula de 44px com respiro dos lados, e o nome desceu para o rótulo em
 * maiúscula espaçada do sistema visual. O vermelho da Mischa's continua fixo no
 * alto da tela — é a identidade — só que ocupando bem menos altura e parecendo
 * um bloco solto, como todo o resto do app.
 */

const VERMELHO = "#d1193a";
const BORDA_INTERNA = "rgba(255,255,255,0.18)";

const MobileHeader = () => {
  const alertas = useAlertaStore((state) => state.getQuantidadeAlertasNaoLidas());

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-2 lg:hidden">
      <div
        className="flex h-11 items-center gap-2 rounded-bloco border pl-2 pr-1.5 shadow-bloco"
        style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
      >
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img
            src={mischasLogo}
            alt="Mischa's Bakery"
            className="size-7 shrink-0 rounded-full border-2 border-white object-cover"
          />
          <span className="truncate text-[0.65rem] font-extrabold uppercase tracking-[2px] text-white">
            Mischa's Bakery
          </span>
        </Link>

        <Link
          to="/alertas"
          aria-label="Alertas"
          className="relative ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-controle text-white/85 transition-colors hover:bg-white/15 active:bg-white/25"
        >
          <Bell className="h-[18px] w-[18px]" />
          {alertas > 0 && (
            <Badge
              className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold"
              style={{ color: VERMELHO }}
            >
              {alertas}
            </Badge>
          )}
        </Link>
      </div>
    </div>
  );
};

export default MobileHeader;
