import { RouteLink } from "../../app/router";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="bottom-nav" aria-label="Navegacion movil">
      {NAV_ITEMS.map(([path, icon, label]) => (
        <RouteLink
          key={path}
          to={path!}
          className={pathname === path || (path === "/" && pathname === "/inicio") ? "active" : ""}
        >
          <span>{icon}</span>
          {label}
        </RouteLink>
      ))}
    </nav>
  );
}
