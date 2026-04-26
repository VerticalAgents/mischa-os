import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, Calendar, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/mischas-logo.png";

const items = [
  { to: "/rep/home", label: "Início", icon: Home },
  { to: "/rep/clientes", label: "Meus Clientes", icon: Users },
  { to: "/rep/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/rep/configuracoes", label: "Configurações", icon: Settings },
];

export function RepSidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-[#d1193a] text-white">
      <div className="p-5 flex items-center gap-3 border-b border-white/10">
        <img src={logo} alt="Mischa's Bakery" className="w-10 h-10 rounded-full bg-white" />
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm tracking-wide">MISCHA'S BAKERY</span>
          <span className="text-[11px] text-white/70">Portal do Representante</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + "/");
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/85 hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        {user?.email && (
          <div className="text-[11px] text-white/60 px-2 truncate">{user.email}</div>
        )}
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/90 hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}