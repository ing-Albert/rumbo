import { ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigate } from "../../app/router";
import { getUserInitial, getUserName } from "../../lib/format";

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

export function UserMenu({
  user,
  onSignOut,
  className = ""
}: {
  user: { email?: string; user_metadata?: Record<string, unknown> };
  onSignOut: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userName = getUserName(user);
  const initial = getUserInitial(userName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`user-menu-container ${className}`} ref={menuRef}>
      <button
        className={`user-profile-button ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title={userName}
      >
        <div className="user-avatar">{initial}</div>
        <div className="user-details">
          <span className="user-name">{userName}</span>
          <span className="user-subtext">Mi cuenta</span>
        </div>
        <ChevronDown
          className={`chevron-icon ${open ? "open" : ""}`}
          size={14}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="user-dropdown-card" role="menu">
          <div className="dropdown-user-header">
            <div className="dropdown-avatar">{initial}</div>
            <div className="dropdown-user-info">
              <strong>{userName}</strong>
              <small>{user.email || "Usuario"}</small>
            </div>
          </div>
          <div className="dropdown-divider" />
          <button
            className="dropdown-action-btn"
            onClick={() => {
              setOpen(false);
              navigate("/novedades");
            }}
            role="menuitem"
          >
            <Sparkles size={16} />
            <span>Novedades</span>
          </button>
          <button
            className="dropdown-action-btn"
            onClick={() => {
              setOpen(false);
              navigate("/configuracion");
            }}
            role="menuitem"
          >
            <SettingsIcon />
            <span>Configuración</span>
          </button>
          <button
            className="dropdown-logout-btn"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
            role="menuitem"
            aria-label="Cerrar sesion"
          >
            <LogoutIcon />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
