import { RouteLink } from "../../app/router";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="bottom-nav" aria-label="Navegacion movil">
      {NAV_ITEMS.map(({ path, Icon, label }) => (
        <RouteLink
          key={path}
          to={path}
          className={pathname === path || (path === "/" && pathname === "/inicio") ? "active" : ""}
        >
          <span>
            <Icon size={18} />
          </span>
          {/* El texto va envuelto para poder recortarlo: con seis entradas, en
              pantallas de 360px la palabra mas larga no cabe entera, y es
              preferible un puntito suspensivo a que la barra se parta en dos. */}
          <small>{label}</small>
        </RouteLink>
      ))}
    </nav>
  );
}
