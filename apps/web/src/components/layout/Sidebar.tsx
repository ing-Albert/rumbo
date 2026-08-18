import { Plus } from "lucide-react";
import { RouteLink } from "../../app/router";
import { NAV_ITEMS } from "./nav-items";
import { RumboLogo } from "./RumboLogo";
import { UserMenu } from "./UserMenu";

export function Sidebar({
  pathname,
  user,
  onSignOut,
  onAdd
}: {
  pathname: string;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  onSignOut: () => void;
  onAdd: () => void;
}) {
  return (
    <aside className="sidebar">
      <RumboLogo />
      <button className="primary add-button" onClick={onAdd}>
        <Plus size={18} /> Agregar
      </button>
      <nav aria-label="Navegacion principal">
        {NAV_ITEMS.map(({ path, Icon, label }) => (
          <RouteLink
            key={path}
            to={path}
            className={
              pathname === path || (path === "/" && pathname === "/inicio") ? "active" : ""
            }
          >
            <span>
              <Icon size={18} />
            </span>{" "}
            {label}
          </RouteLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {user && <UserMenu user={user} onSignOut={onSignOut} className="sidebar-user-menu" />}
        <small>v0.5</small>
      </div>
    </aside>
  );
}
