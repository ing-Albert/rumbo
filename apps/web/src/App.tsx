import {
  Home,
  ArrowUpDown,
  LayoutGrid,
  Target,
  BarChart2,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Gem,
  Pencil,
  Trash2
} from "lucide-react";
import {
  dominicanDate,
  formatDop,
  type BudgetLimit,
  type ExpenseCategory,
  type Goal,
  type GoalContribution,
  type Movement,
  type MovementStatus,
  type MovementType,
  type Summary
} from "@ahorra/domain";
import { FormEvent, startTransition, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./features/auth/AuthProvider";
import { apiFetch } from "./lib/api";
import { supabase } from "./lib/supabase";

type Space = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

const emptySummary: Summary = {
  incomeCents: 0,
  expenseCents: 0,
  contributionCents: 0,
  availableBeforeSavingsCents: 0,
  availableAfterSavingsCents: 0,
  projectedAvailableCents: 0,
  expenseByCategory: []
};

const incomeCategories = ["Sueldo", "Trabajo independiente", "Ventas", "Remesas", "Otros ingresos"];
const expenseCategories = [
  "Vivienda",
  "Alimentacion",
  "Transporte",
  "Servicios",
  "Salud",
  "Educacion",
  "Otros gastos"
];

function currentMonth(): string {
  return dominicanDate().slice(0, 7);
}

function today(): string {
  return dominicanDate();
}

function monthLabel(month: string): string {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-DO", { month: "long", year: "numeric" }).format(
    new Date(year!, value! - 1, 1)
  );
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error("No pudimos cargar la informacion.");
  return response.json() as Promise<T>;
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return pathname;
}

function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function RouteLink({
  to,
  className,
  children
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export default function App() {
  const auth = useAuth();
  const accessToken = auth.session?.access_token;
  const pathname = usePathname();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(emptySummary);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<MovementType>("EXPENSE");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCategories, setCustomCategories] = useState<ExpenseCategory[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSpaces([]);
    setSpaceId("");
    setSummary(emptySummary);
    setMovements([]);
    setBudgetLimits([]);
    setGoals([]);
    setCustomCategories([]);
  }, [auth.user?.id]);

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    void apiFetch(accessToken, "/api/spaces", { signal: controller.signal })
      .then((response) => readJson<Space[]>(response))
      .then((nextSpaces) => {
        setSpaces(nextSpaces);
        setSpaceId((current) => {
          if (nextSpaces.some((space) => space.id === current)) return current;
          return (
            nextSpaces.find((space) => space.type === "PERSONAL")?.id ?? nextSpaces[0]?.id ?? ""
          );
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError("No pudimos cargar tus espacios.");
        }
      });
    return () => controller.abort();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !spaceId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");

    Promise.all([
      apiFetch(accessToken, `/api/summary?spaceId=${encodeURIComponent(spaceId)}&month=${month}`, {
        signal: controller.signal
      }).then((response) => readJson<Summary>(response)),
      apiFetch(
        accessToken,
        `/api/movements?spaceId=${encodeURIComponent(spaceId)}&month=${month}`,
        { signal: controller.signal }
      ).then((response) => readJson<Movement[]>(response))
    ])
      .then(([nextSummary, nextMovements]) => {
        startTransition(() => {
          setSummary(nextSummary);
          setMovements(nextMovements);
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Ocurrio un error inesperado.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey]);

  useEffect(() => {
    if (!accessToken || !spaceId) return;
    const controller = new AbortController();
    Promise.all([
      apiFetch(accessToken, `/api/budget?spaceId=${encodeURIComponent(spaceId)}&month=${month}`, {
        signal: controller.signal
      }).then((response) => readJson<BudgetLimit[]>(response)),
      apiFetch(accessToken, `/api/goals?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<Goal[]>(response)),
      apiFetch(accessToken, `/api/categories?spaceId=${encodeURIComponent(spaceId)}`, {
        signal: controller.signal
      }).then((response) => readJson<ExpenseCategory[]>(response))
    ])
      .then(([limits, nextGoals, nextCategories]) => {
        setBudgetLimits(limits);
        setGoals(nextGoals);
        setCustomCategories(nextCategories);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError("No pudimos cargar todos los modulos.");
      });
    return () => controller.abort();
  }, [accessToken, spaceId, month, refreshKey]);

  function openForm(type: MovementType) {
    setFormType(type);
    setEditingMovement(null);
    setFormOpen(true);
  }

  function editMovement(movement: Movement) {
    setFormType(movement.type);
    setEditingMovement(movement);
    setFormOpen(true);
  }

  if (!accessToken) {
    return (
      <main className="auth-setup-error">
        <h1>Necesitas iniciar sesion</h1>
        <p>No se cargaron datos financieros sin una sesion valida.</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <Sidebar
        pathname={pathname}
        user={auth.user}
        onSignOut={() => void auth.signOut()}
        onAdd={() => openForm("EXPENSE")}
      />

      <main id="main" className="main-content">
        <header className="topbar">
          <div className="topbar-header-row">
            <div className="topbar-brand">
              <RumboLogo size={48} />
            </div>
            {/* UserMenu visible only on mobile in the topbar */}
            {auth.user && (
              <UserMenu
                user={auth.user}
                onSignOut={() => void auth.signOut()}
                className="topbar-user-menu"
              />
            )}
          </div>
          <div className="topbar-pickers">
            <label className="space-picker">
              <span>Espacio</span>
              <select value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="month-picker">
              <span>Periodo</span>
              <input
                type="month"
                value={month}
                min={auth.user?.created_at ? auth.user.created_at.substring(0, 7) : undefined}
                onChange={(event) => setMonth(event.target.value)}
              />
            </label>
          </div>
        </header>

        {pathname === "/" || pathname === "/inicio" ? (
          <>
            <section className="hero" aria-labelledby="available-title">
              <div>
                <p className="eyebrow">Disponible despues de ahorro</p>
                <h1 id="available-title">
                  {loading ? "Calculando..." : formatDop(summary.availableAfterSavingsCents)}
                </h1>
                <p>Para {monthLabel(month)} segun tus registros</p>
                {!loading && (
                  <div className="balance-bridge">
                    <span>
                      Antes de ahorro:{" "}
                      <strong>{formatDop(summary.availableBeforeSavingsCents)}</strong>
                    </span>
                    <span>
                      Ahorro separado: <strong>{formatDop(summary.contributionCents)}</strong>
                    </span>
                  </div>
                )}
              </div>
              <div className="hero-stats">
                <Stat label="Ingresos" value={summary.incomeCents} tone="income" />
                <Stat label="Gastos" value={summary.expenseCents} tone="expense" />
                <Stat label="Ahorro" value={summary.contributionCents} tone="savings" />
              </div>
            </section>

            {!loading && summary.availableAfterSavingsCents < 0 && (
              <section className="allocation-alert" role="status">
                <div>
                  <span aria-hidden="true">!</span>
                  <div>
                    <strong>
                      Tu plan supera el dinero disponible por{" "}
                      {formatDop(Math.abs(summary.availableAfterSavingsCents))}
                    </strong>
                    <p>
                      Despues de los gastos quedaban{" "}
                      {formatDop(summary.availableBeforeSavingsCents)}, pero separaste{" "}
                      {formatDop(summary.contributionCents)} para ahorro. Ajusta gastos o el aporte
                      de este periodo.
                    </p>
                  </div>
                </div>
                <div className="button-row">
                  <button className="secondary" onClick={() => navigate("/movimientos")}>
                    Revisar gastos
                  </button>
                  <button className="primary" onClick={() => navigate("/metas")}>
                    Ajustar metas
                  </button>
                </div>
              </section>
            )}

            {error && (
              <div className="error-banner" role="alert">
                {error}{" "}
                <button onClick={() => setRefreshKey((value) => value + 1)}>Reintentar</button>
              </div>
            )}

            {!loading && movements.length === 0 ? (
              <EmptyState
                onIncome={() => openForm("INCOME")}
                onExpense={() => openForm("EXPENSE")}
              />
            ) : (
              <div className="dashboard-grid">
                <CashFlowChart summary={summary} />
                <CategoryChart summary={summary} />
                <RecentMovements
                  movements={movements}
                  onEdit={editMovement}
                  onViewAll={() => navigate("/movimientos")}
                />
                <Projection summary={summary} />
              </div>
            )}
          </>
        ) : pathname === "/movimientos" ? (
          <MovementsPage
            movements={movements}
            onAdd={openForm}
            onEdit={editMovement}
            minDate={auth.user?.created_at ? auth.user.created_at.substring(0, 10) : undefined}
          />
        ) : pathname === "/presupuesto" ? (
          <BudgetPage
            accessToken={accessToken}
            spaceId={spaceId}
            month={month}
            summary={summary}
            limits={budgetLimits}
            customCategories={customCategories}
            onSaved={() => setRefreshKey((value) => value + 1)}
          />
        ) : pathname === "/metas" ? (
          <GoalsPage
            accessToken={accessToken}
            spaceId={spaceId}
            goals={goals}
            onSaved={() => setRefreshKey((value) => value + 1)}
          />
        ) : pathname === "/reportes" ? (
          <ReportsPage summary={summary} movements={movements} month={month} />
        ) : pathname === "/configuracion" ? (
          <SettingsPage
            spaces={spaces}
            spaceId={spaceId}
            user={auth.user}
            onSaved={() => setRefreshKey((value) => value + 1)}
          />
        ) : (
          <NotFoundPage />
        )}
      </main>

      <button
        className="floating-add"
        aria-label="Agregar movimiento"
        onClick={() => openForm("EXPENSE")}
      >
        +
      </button>
      <BottomNav pathname={pathname} />

      {formOpen && (
        <MovementDialog
          accessToken={accessToken}
          initialType={formType}
          movement={editingMovement ?? undefined}
          expenseOptions={[
            ...new Set([...expenseCategories, ...customCategories.map((category) => category.name)])
          ]}
          spaceId={spaceId}
          availableCents={summary.availableAfterSavingsCents}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

function getUserName(user: { email?: string; user_metadata?: Record<string, any> } | null): string {
  if (!user) return "Usuario";
  const meta = user.user_metadata;
  if (meta?.username && typeof meta.username === "string" && meta.username.trim())
    return meta.username.trim();
  if (meta?.display_name && typeof meta.display_name === "string" && meta.display_name.trim())
    return meta.display_name.trim();
  if (meta?.full_name && typeof meta.full_name === "string" && meta.full_name.trim())
    return meta.full_name.trim();
  if (meta?.name && typeof meta.name === "string" && meta.name.trim()) return meta.name.trim();
  if (user.email) {
    const raw = user.email.split("@")[0] || "Usuario";
    return raw
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Usuario";
}

function getUserInitial(name: string): string {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
}

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

function UserMenu({
  user,
  onSignOut,
  className = ""
}: {
  user: { email?: string; user_metadata?: Record<string, any> };
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
              window.history.pushState({}, "", "/configuracion");
              window.dispatchEvent(new Event("popstate"));
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

const NAV_ITEMS: [string, React.ReactNode, string][] = [
  ["/", <Home size={18} />, "Inicio"],
  ["/movimientos", <ArrowUpDown size={18} />, "Movimientos"],
  ["/presupuesto", <LayoutGrid size={18} />, "Presupuesto"],
  ["/metas", <Target size={18} />, "Metas"],
  ["/reportes", <BarChart2 size={18} />, "Reportes"]
];

function RumboLogo({ size = 42 }: { size?: number }) {
  return (
    <div className="brand">
      <svg
        className="brand-logo-svg"
        width={size}
        height={size}
        viewBox="0 0 512 512"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="512" height="512" rx="112" fill="#6B2948" />
        <path
          d="M126 354V158h92c63 0 105 31 105 87 0 35-17 61-48 75l90 34h-94l-66-29v29h-79zm79-97h19c24 0 37-9 37-28s-13-27-37-27h-19v55z"
          fill="#FFF8F0"
        />
        <circle cx="365" cy="152" r="42" fill="#E3A72F" />
      </svg>
      <strong className="brand-name">Rumbo</strong>
    </div>
  );
}

function Sidebar({
  pathname,
  user,
  onSignOut,
  onAdd
}: {
  pathname: string;
  user: { email?: string; user_metadata?: Record<string, any> } | null;
  onSignOut: () => void;
  onAdd: () => void;
}) {
  return (
    <aside className="sidebar">
      <RumboLogo />
      <button className="primary add-button" onClick={onAdd}>
        + Agregar
      </button>
      <nav aria-label="Navegacion principal">
        {NAV_ITEMS.map(([path, icon, label]) => (
          <RouteLink
            key={path}
            to={path!}
            className={
              pathname === path || (path === "/" && pathname === "/inicio") ? "active" : ""
            }
          >
            <span>{icon}</span> {label}
          </RouteLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {user && <UserMenu user={user} onSignOut={onSignOut} className="sidebar-user-menu" />}
        <small>v0.2</small>
      </div>
    </aside>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
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

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`stat ${tone}`}>
      <span>{label}</span>
      <strong>{formatDop(value)}</strong>
    </div>
  );
}

function EmptyState({ onIncome, onExpense }: { onIncome: () => void; onExpense: () => void }) {
  return (
    <section className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span>RD$</span>
        <i />
      </div>
      <div>
        <p className="eyebrow">Comienza con lo esencial</p>
        <h2>Todavia no podemos calcular tu disponible</h2>
        <p>
          Registra tu sueldo o primer ingreso y luego anade tus gastos. Veras como cambia el dinero
          que te queda.
        </p>
        <div className="button-row">
          <button className="primary" onClick={onIncome}>
            Registrar ingreso
          </button>
          <button className="secondary" onClick={onExpense}>
            Registrar gasto
          </button>
        </div>
      </div>
    </section>
  );
}

function CashFlowChart({ summary }: { summary: Summary }) {
  const values = [summary.incomeCents, summary.expenseCents, summary.contributionCents];
  const max = Math.max(...values, 1);
  return (
    <section className="panel cash-chart">
      <header>
        <div>
          <p className="eyebrow">Flujo del periodo</p>
          <h2>Lo que entra, sale y apartas</h2>
        </div>
        <button className="text-button">Ver reporte</button>
      </header>
      <div
        className="bars"
        role="img"
        aria-label={`Ingresos ${formatDop(values[0]!)}, gastos ${formatDop(values[1]!)}, ahorro ${formatDop(values[2]!)}`}
      >
        {values.map((value, index) => (
          <div className="bar-item" key={index}>
            <strong>{formatDop(value)}</strong>
            <div className="bar-track">
              <div
                className={`bar-fill bar-${index}`}
                style={{ height: `${Math.max((value / max) * 100, value ? 8 : 0)}%` }}
              />
            </div>
            <span>{["Ingresos", "Gastos", "Ahorro"][index]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryChart({ summary }: { summary: Summary }) {
  const max = summary.expenseByCategory[0]?.amountCents ?? 1;
  return (
    <section className="panel category-chart">
      <header>
        <div>
          <p className="eyebrow">Gastos</p>
          <h2>En que se fue el dinero</h2>
        </div>
      </header>
      {summary.expenseByCategory.length === 0 ? (
        <p className="muted">Registra un gasto para ver tus categorias.</p>
      ) : (
        <div className="category-list">
          {summary.expenseByCategory.slice(0, 5).map((item) => (
            <div className="category-row" key={item.category}>
              <div>
                <span>{item.category}</span>
                <strong>{formatDop(item.amountCents)}</strong>
              </div>
              <div className="horizontal-track">
                <span style={{ width: `${(item.amountCents / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentMovements({
  movements,
  onEdit,
  onViewAll
}: {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onViewAll: () => void;
}) {
  return (
    <section id="movements" className="panel movements-panel">
      <header>
        <div>
          <p className="eyebrow">Actividad reciente</p>
          <h2>Tus ultimos movimientos</h2>
        </div>
        <button className="text-button" onClick={onViewAll}>
          Ver todos
        </button>
      </header>
      <div className="movement-list">
        {movements.slice(0, 6).map((movement) => (
          <article key={movement.id} className="movement-row">
            <span className={`movement-icon ${movement.type.toLowerCase()}`}>
              {movement.type === "INCOME" ? (
                <TrendingUp size={16} />
              ) : movement.type === "EXPENSE" ? (
                <TrendingDown size={16} />
              ) : (
                <Gem size={16} />
              )}
            </span>
            <div>
              <strong>{movement.description}</strong>
              <span>
                {movement.category} ·{" "}
                {new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" }).format(
                  new Date(`${movement.effectiveDate}T12:00:00`)
                )}
              </span>
            </div>
            <div className="movement-actions">
              <strong className={movement.type === "INCOME" ? "amount-income" : ""}>
                {movement.type === "INCOME" ? "+" : "−"}
                {formatDop(movement.amountCents)}
              </strong>
              {movement.type !== "CONTRIBUTION" && (
                <button
                  aria-label={`Editar ${movement.description}`}
                  onClick={() => onEdit(movement)}
                >
                  Editar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Projection({ summary }: { summary: Summary }) {
  const changed = summary.projectedAvailableCents !== summary.availableAfterSavingsCents;
  return (
    <section className="panel projection-panel">
      <p className="eyebrow">Mirada al cierre</p>
      <h2>{formatDop(summary.projectedAvailableCents)}</h2>
      <p>
        {changed
          ? "Disponible proyectado al incluir movimientos programados."
          : "Agrega movimientos programados para anticipar como cerrara el periodo."}
      </p>
      <div className="projection-line">
        <span />
        <i />
      </div>
      <small>Registrado ahora</small>
      <small>Proyeccion</small>
    </section>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function MovementsPage({
  movements,
  onAdd,
  onEdit,
  minDate
}: {
  movements: Movement[];
  onAdd: (type: MovementType) => void;
  onEdit: (movement: Movement) => void;
  minDate?: string;
}) {
  const pageSize = 15;
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [page, setPage] = useState(1);

  function getDateBounds(): { from: string; to: string } | null {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (period === "TODAY") {
      const t = fmt(now);
      return { from: t, to: t };
    }
    if (period === "WEEK") {
      const dow = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((dow + 6) % 7));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    if (period === "MONTH") {
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from, to: fmt(last) };
    }
    if (period === "YEAR") {
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    if (period === "RANGE" && rangeFrom && rangeTo) {
      return { from: rangeFrom, to: rangeTo };
    }
    return null;
  }

  const bounds = getDateBounds();
  const filtered = movements.filter(
    (movement) =>
      (type === "ALL" || movement.type === type) &&
      (status === "ALL" || movement.status === status) &&
      `${movement.description} ${movement.category}`.toLowerCase().includes(query.toLowerCase()) &&
      (!bounds || (movement.effectiveDate >= bounds.from && movement.effectiveDate <= bounds.to))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstResult = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [query, type, status, period, rangeFrom, rangeTo]);
  useEffect(() => setPage((value) => Math.min(value, totalPages)), [totalPages]);

  const periodLabels: Record<string, string> = {
    ALL: "Todos",
    TODAY: "Hoy",
    WEEK: "Esta semana",
    MONTH: "Este mes",
    YEAR: "Este a\u00f1o",
    RANGE: "Rango"
  };

  return (
    <>
      <PageTitle
        eyebrow="Control del periodo"
        title="Movimientos"
        description="Consulta, filtra y corrige todo lo que registraste."
        action={
          <div className="button-row">
            <button className="secondary" onClick={() => onAdd("INCOME")}>
              + Ingreso
            </button>
            <button className="primary" onClick={() => onAdd("EXPENSE")}>
              + Gasto
            </button>
          </div>
        }
      />
      <section className="panel module-panel">
        <div className="filters-row">
          <label>
            Buscar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Descripcion o categoria"
            />
          </label>
          <label>
            Tipo
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="ALL">Todos</option>
              <option value="INCOME">Ingresos</option>
              <option value="EXPENSE">Gastos</option>
              <option value="CONTRIBUTION">Aportes</option>
            </select>
          </label>
          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">Todos</option>
              <option value="REGISTERED">Registrados</option>
              <option value="SCHEDULED">Programados</option>
            </select>
          </label>
          <span className="result-count">{filtered.length} resultados</span>
        </div>
        <div className="period-filter-row">
          {["ALL", "TODAY", "WEEK", "MONTH", "YEAR", "RANGE"].map((p) => (
            <button
              key={p}
              className={`period-chip${period === p ? " active" : ""}`}
              onClick={() => {
                setPeriod(p);
                if (p !== "RANGE") {
                  setRangeFrom("");
                  setRangeTo("");
                }
              }}
            >
              {periodLabels[p]}
            </button>
          ))}
          {period === "RANGE" && (
            <div className="period-range-inputs">
              <label>
                Desde
                <input
                  type="date"
                  value={rangeFrom}
                  min={minDate}
                  max={today()}
                  onChange={(e) => setRangeFrom(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  value={rangeTo}
                  min={rangeFrom || minDate}
                  max={today()}
                  onChange={(e) => setRangeTo(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="module-empty">
            <h2>No hay movimientos con estos filtros</h2>
            <button
              className="text-button"
              onClick={() => {
                setQuery("");
                setType("ALL");
                setStatus("ALL");
                setPeriod("ALL");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripcion</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="number">Monto</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.effectiveDate.split("-").reverse().join("/")}</td>
                      <td>
                        <strong>{movement.description}</strong>
                      </td>
                      <td>{movement.category}</td>
                      <td>
                        {movement.type === "INCOME"
                          ? "Ingreso"
                          : movement.type === "EXPENSE"
                            ? "Gasto"
                            : "Aporte"}
                      </td>
                      <td>
                        <span className={`status-pill ${movement.status.toLowerCase()}`}>
                          {movement.status === "REGISTERED" ? "Registrado" : "Programado"}
                        </span>
                      </td>
                      <td className={`number ${movement.type === "INCOME" ? "amount-income" : ""}`}>
                        {movement.type === "INCOME" ? "+" : "-"}
                        {formatDop(movement.amountCents)}
                      </td>
                      <td>
                        {movement.type !== "CONTRIBUTION" && (
                          <button
                            className="table-action"
                            onClick={() => onEdit(movement)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="pagination">
              <p>
                Mostrando{" "}
                <strong>
                  {firstResult}-{lastResult}
                </strong>{" "}
                de <strong>{filtered.length}</strong>
              </p>
              <div>
                <button
                  className="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Anterior
                </button>
                <span>
                  Pagina <strong>{currentPage}</strong> de {totalPages}
                </span>
                <button
                  className="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Siguiente
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </>
  );
}

function BudgetPage({
  accessToken,
  spaceId,
  month,
  summary,
  limits,
  customCategories,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  month: string;
  summary: Summary;
  limits: BudgetLimit[];
  customCategories: ExpenseCategory[];
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const customCategoryNames = customCategories.map((c) => c.name);
  const categories = [
    ...new Set([
      ...expenseCategories,
      ...customCategoryNames,
      ...summary.expenseByCategory.map((item) => item.category)
    ])
  ];

  useEffect(() => {
    setValues(
      Object.fromEntries(
        limits.map((limit) => [
          limit.category,
          limit.limitCents > 0 ? String(limit.limitCents / 100) : ""
        ])
      )
    );
  }, [limits]);

  const totalLimit = categories.reduce(
    (total, category) => total + Math.round(Number(values[category] || 0) * 100),
    0
  );

  async function saveBudget() {
    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        categories.map(async (category) => {
          const response = await apiFetch(accessToken, "/api/budget", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spaceId,
              month,
              category,
              limitCents: Math.max(0, Math.round(Number(values[category] || 0) * 100))
            })
          });
          if (!response.ok) throw new Error();
        })
      );
      setMessage("Presupuesto guardado correctamente.");
      onSaved();
    } catch {
      setMessage("No pudimos guardar el presupuesto.");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setCategoryError("");
    const response = await apiFetch(accessToken, "/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spaceId, name: categoryName })
    });
    if (!response.ok) {
      const body = (await response
        .json()
        .catch(() => ({ message: "No pudimos crear la categoria." }))) as { message?: string };
      setCategoryError(body.message ?? "No pudimos crear la categoria.");
      return;
    }
    setCategoryName("");
    setAddingCategory(false);
    setMessage("Categoria agregada correctamente.");
    onSaved();
  }

  function startEdit(cat: ExpenseCategory) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditError("");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingCategory) return;
    setEditError("");
    const response = await apiFetch(accessToken, `/api/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName })
    });
    if (!response.ok) {
      const body = (await response
        .json()
        .catch(() => ({ message: "No pudimos editar la categoria." }))) as { message?: string };
      setEditError(body.message ?? "No pudimos editar la categoria.");
      return;
    }
    setEditingCategory(null);
    setMessage("Categoria actualizada correctamente.");
    onSaved();
  }

  async function deleteCategory(cat: ExpenseCategory) {
    setDeletingId(cat.id);
    const response = await apiFetch(accessToken, `/api/categories/${cat.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!response.ok) {
      setMessage("No pudimos eliminar la categoria.");
      return;
    }
    setMessage(`Categoria "${cat.name}" eliminada.`);
    onSaved();
  }

  return (
    <>
      <PageTitle
        eyebrow="Plan del periodo"
        title="Presupuesto"
        description={`Define cuanto quieres gastar durante ${monthLabel(month)}.`}
        action={
          <div className="button-row">
            <button className="secondary" onClick={() => setAddingCategory(true)}>
              + Nueva categoria
            </button>
            <button className="primary" onClick={() => void saveBudget()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar presupuesto"}
            </button>
          </div>
        }
      />
      {addingCategory && (
        <form className="category-creator" onSubmit={(event) => void createCategory(event)}>
          <label>
            Nombre de la categoria
            <input
              autoFocus
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Ej. Mascotas"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <div>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setAddingCategory(false);
                setCategoryError("");
              }}
            >
              Cancelar
            </button>
            <button className="primary">Agregar categoria</button>
          </div>
          {categoryError && <p role="alert">{categoryError}</p>}
        </form>
      )}
      <div className="summary-strip">
        <Stat label="Ingresos" value={summary.incomeCents} tone="income" />
        <Stat label="Presupuestado" value={totalLimit} tone="savings" />
        <Stat label="Gastado" value={summary.expenseCents} tone="expense" />
        <Stat label="Disponible" value={summary.availableAfterSavingsCents} tone="income" />
      </div>
      <p className="budget-formula">
        Disponible = ingresos - gastos - ahorro separado. El presupuesto por categoria sirve como
        limite, no como saldo.
      </p>
      {message && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}
      <section className="panel module-panel budget-editor">
        <header>
          <div>
            <p className="eyebrow">Categorias</p>
            <h2>Limites del mes</h2>
          </div>
          <span>Plan por categoria</span>
        </header>
        {categories.map((category) => {
          const spent =
            summary.expenseByCategory.find((item) => item.category === category)?.amountCents ?? 0;
          const limit = Math.round(Number(values[category] || 0) * 100);
          const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const remaining = limit - spent;
          const customCat = !expenseCategories.includes(category)
            ? customCategories.find((c) => c.name === category)
            : undefined;
          return (
            <div className="budget-row" key={category}>
              <div className="budget-category">
                <div className="budget-category-header">
                  {editingCategory && customCat && editingCategory.id === customCat.id ? (
                    <form
                      onSubmit={(event) => void saveEdit(event)}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        width: "100%",
                        flexWrap: "wrap"
                      }}
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        minLength={2}
                        maxLength={80}
                        required
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          flex: 1,
                          minWidth: "120px"
                        }}
                      />
                      <button className="primary" style={{ padding: "6px 10px", fontSize: "12px" }}>
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancelar
                      </button>
                      {editError && (
                        <span className="danger-text" style={{ fontSize: "12px", width: "100%" }}>
                          {editError}
                        </span>
                      )}
                    </form>
                  ) : (
                    <>
                      <strong>{category}</strong>
                      {customCat && (
                        <div className="category-actions">
                          <button
                            className="table-action"
                            onClick={() => startEdit(customCat)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="table-action danger"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la categoria "${category}"?`))
                                void deleteCategory(customCat);
                            }}
                            disabled={deletingId === customCat.id}
                            title="Eliminar"
                          >
                            {deletingId === customCat.id ? "..." : <Trash2 size={16} />}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span>{spent > 0 ? `${formatDop(spent)} gastados` : "Sin gastos registrados"}</span>
              </div>
              <div className="budget-usage">
                {limit > 0 ? (
                  <>
                    <div className="budget-progress">
                      <span
                        style={{ width: `${Math.min(percent, 100)}%` }}
                        className={percent > 100 ? "over" : ""}
                      />
                    </div>
                    <div className="budget-status">
                      <span>
                        {formatDop(spent)} de {formatDop(limit)}
                      </span>
                      <strong className={remaining < 0 ? "danger-text" : ""}>
                        {remaining >= 0
                          ? `${formatDop(remaining)} disponibles`
                          : `Excedido por ${formatDop(Math.abs(remaining))}`}
                      </strong>
                    </div>
                  </>
                ) : (
                  <span className="no-limit-message">
                    Define un limite para comparar este gasto.
                  </span>
                )}
              </div>
              <label className="limit-field">
                <span>Limite mensual</span>
                <div className="compact-money">
                  <span>RD$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={values[category] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [category]: event.target.value }))
                    }
                    placeholder="Ej. 10000"
                  />
                </div>
              </label>
            </div>
          );
        })}
      </section>
    </>
  );
}

function GoalsPage({
  accessToken,
  spaceId,
  goals,
  onSaved
}: {
  accessToken: string;
  spaceId: string;
  goals: Goal[];
  onSaved: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [contributingTo, setContributingTo] = useState<string | null>(null);
  const [viewingContributions, setViewingContributions] = useState<string | null>(null);
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({});
  const [editingContribution, setEditingContribution] = useState<GoalContribution | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [initial, setInitial] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contribution, setContribution] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function createGoal(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await apiFetch(accessToken, "/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spaceId,
        name,
        targetCents: Math.round(Number(target) * 100),
        initialAmountCents: Math.round(Number(initial || 0) * 100),
        targetDate: targetDate || null,
        priority: "MEDIUM"
      })
    });
    setSaving(false);
    if (response.ok) {
      setCreating(false);
      setName("");
      setTarget("");
      setInitial("");
      setTargetDate("");
      onSaved();
    }
  }

  async function addContribution(goalId: string) {
    setSaving(true);
    const response = await apiFetch(accessToken, `/api/goals/${goalId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: Math.round(Number(contribution) * 100),
        effectiveDate: today()
      })
    });
    setSaving(false);
    if (response.ok) {
      setContribution("");
      setContributingTo(null);
      onSaved();
      if (viewingContributions === goalId) await loadContributions(goalId);
    }
  }

  async function loadContributions(goalId: string) {
    const response = await apiFetch(accessToken, `/api/goals/${goalId}/contributions`);
    if (!response.ok) return;
    const items = (await response.json()) as GoalContribution[];
    setContributions((current) => ({ ...current, [goalId]: items }));
  }

  async function toggleContributions(goalId: string) {
    if (viewingContributions === goalId) {
      setViewingContributions(null);
      setEditingContribution(null);
      return;
    }
    setViewingContributions(goalId);
    await loadContributions(goalId);
  }

  function beginContributionEdit(item: GoalContribution) {
    setEditingContribution(item);
    setEditedAmount(String(item.amountCents / 100));
    setEditedDate(item.effectiveDate);
  }

  async function saveContribution(goalId: string) {
    if (!editingContribution || Number(editedAmount) <= 0) return;
    setSaving(true);
    const response = await apiFetch(
      accessToken,
      `/api/goals/${goalId}/contributions/${editingContribution.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(Number(editedAmount) * 100),
          effectiveDate: editedDate
        })
      }
    );
    setSaving(false);
    if (response.ok) {
      setEditingContribution(null);
      await loadContributions(goalId);
      onSaved();
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Objetivos"
        title="Metas de ahorro"
        description="Convierte lo que quieres lograr en un avance visible."
        action={
          <button className="primary" onClick={() => setCreating(true)}>
            + Nueva meta
          </button>
        }
      />
      {creating && (
        <form className="panel inline-form" onSubmit={(event) => void createGoal(event)}>
          <header>
            <div>
              <p className="eyebrow">Nueva meta</p>
              <h2>Que quieres alcanzar?</h2>
            </div>
            <button type="button" className="close-button" onClick={() => setCreating(false)}>
              ×
            </button>
          </header>
          <div className="form-grid">
            <label>
              Nombre
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Fondo de emergencia"
              />
            </label>
            <label>
              Monto objetivo
              <div className="compact-money">
                <span>RD$</span>
                <input
                  required
                  inputMode="decimal"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                />
              </div>
            </label>
            <label>
              Ya tengo ahorrado <small>Opcional</small>
              <div className="compact-money">
                <span>RD$</span>
                <input
                  inputMode="decimal"
                  value={initial}
                  onChange={(event) => setInitial(event.target.value)}
                />
              </div>
            </label>
            <label>
              Fecha objetivo <small>Opcional</small>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
              />
            </label>
          </div>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              Crear meta
            </button>
          </div>
        </form>
      )}
      {goals.length === 0 ? (
        <div className="module-empty large">
          <h2>Aun no tienes metas</h2>
          <p>Define una cantidad y una fecha para calcular tu avance.</p>
          <button className="primary" onClick={() => setCreating(true)}>
            Crear primera meta
          </button>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map((goal) => {
            const progress = Math.round((goal.savedCents / goal.targetCents) * 100);
            const goalContributions = contributions[goal.id] ?? [];
            return (
              <article className="panel goal-card" key={goal.id}>
                <div className="goal-top">
                  <span className={`status-pill ${goal.status.toLowerCase()}`}>
                    {goal.status === "COMPLETED"
                      ? "Completada"
                      : goal.status === "PAUSED"
                        ? "Pausada"
                        : "Activa"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <h2>{goal.name}</h2>
                <p>
                  <strong>{formatDop(goal.savedCents)}</strong> de {formatDop(goal.targetCents)}
                </p>
                <div className="goal-progress">
                  <span style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="goal-meta">
                  <span>Faltan {formatDop(Math.max(0, goal.targetCents - goal.savedCents))}</span>
                  <span>
                    {goal.targetDate
                      ? new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
                          new Date(`${goal.targetDate}T12:00:00`)
                        )
                      : "Sin fecha"}
                  </span>
                </div>
                {contributingTo === goal.id ? (
                  <div className="contribution-form">
                    <div className="compact-money">
                      <span>RD$</span>
                      <input
                        autoFocus
                        inputMode="decimal"
                        value={contribution}
                        onChange={(event) => setContribution(event.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <button
                      className="primary"
                      disabled={saving || Number(contribution) <= 0}
                      onClick={() => void addContribution(goal.id)}
                    >
                      Guardar
                    </button>
                    <button className="secondary" onClick={() => setContributingTo(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="goal-actions">
                    {goal.status !== "COMPLETED" && (
                      <button className="primary" onClick={() => setContributingTo(goal.id)}>
                        Registrar aporte
                      </button>
                    )}
                    <button className="secondary" onClick={() => void toggleContributions(goal.id)}>
                      {viewingContributions === goal.id
                        ? "Ocultar aportes"
                        : "Ver y editar aportes"}
                    </button>
                  </div>
                )}
                {viewingContributions === goal.id && (
                  <div className="contribution-history">
                    <h3>Historial de aportes</h3>
                    {goalContributions.length === 0 ? (
                      <p>No hay aportes registrados.</p>
                    ) : (
                      goalContributions.map((item) => (
                        <div className="contribution-row" key={item.id}>
                          {editingContribution?.id === item.id ? (
                            <>
                              <div className="compact-money">
                                <span>RD$</span>
                                <input
                                  aria-label="Monto del aporte"
                                  autoFocus
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editedAmount}
                                  onChange={(event) => setEditedAmount(event.target.value)}
                                />
                              </div>
                              <input
                                aria-label="Fecha del aporte"
                                type="date"
                                value={editedDate}
                                onChange={(event) => setEditedDate(event.target.value)}
                              />
                              <button
                                className="primary"
                                disabled={saving}
                                onClick={() => void saveContribution(goal.id)}
                              >
                                Guardar cambios
                              </button>
                              <button
                                className="secondary"
                                onClick={() => setEditingContribution(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <div>
                                <strong>{formatDop(item.amountCents)}</strong>
                                <span>
                                  {new Intl.DateTimeFormat("es-DO", { dateStyle: "medium" }).format(
                                    new Date(`${item.effectiveDate}T12:00:00`)
                                  )}{" "}
                                  · {item.movementId ? "Aporte registrado" : "Saldo inicial"}
                                </span>
                              </div>
                              <button
                                className="table-action"
                                onClick={() => beginContributionEdit(item)}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function ReportsPage({
  summary,
  movements,
  month
}: {
  summary: Summary;
  movements: Movement[];
  month: string;
}) {
  function exportCsv() {
    const rows = [
      ["fecha", "descripcion", "categoria", "tipo", "estado", "monto_DOP"],
      ...movements.map((movement) => [
        movement.effectiveDate,
        movement.description,
        movement.category,
        movement.type,
        movement.status,
        String(movement.amountCents / 100)
      ])
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const safeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
            return `"${safeCell.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const savingsRate =
    summary.incomeCents > 0
      ? Math.round((summary.contributionCents / summary.incomeCents) * 100)
      : null;
  return (
    <>
      <PageTitle
        eyebrow="Analisis"
        title="Reportes"
        description={`Resumen financiero de ${monthLabel(month)}.`}
        action={
          <button className="primary" onClick={exportCsv}>
            Exportar CSV
          </button>
        }
      />
      <div className="report-kpis">
        <div>
          <span>Ingresos</span>
          <strong>{formatDop(summary.incomeCents)}</strong>
        </div>
        <div>
          <span>Gastos</span>
          <strong>{formatDop(summary.expenseCents)}</strong>
        </div>
        <div>
          <span>Ahorro</span>
          <strong>{formatDop(summary.contributionCents)}</strong>
        </div>
        <div>
          <span>Tasa de ahorro</span>
          <strong>{savingsRate === null ? "No calculable" : `${savingsRate}%`}</strong>
        </div>
      </div>
      <div className="reports-grid">
        <CashFlowChart summary={summary} />
        <CategoryChart summary={summary} />
        <section className="panel report-detail">
          <header>
            <div>
              <p className="eyebrow">Detalle</p>
              <h2>Datos del reporte</h2>
            </div>
          </header>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripcion</th>
                  <th>Categoria</th>
                  <th className="number">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.effectiveDate}</td>
                    <td>{movement.description}</td>
                    <td>{movement.category}</td>
                    <td className="number">
                      {movement.type === "INCOME" ? "+" : "-"}
                      {formatDop(movement.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function SettingsPage({
  spaces,
  spaceId,
  user,
  onSaved
}: {
  spaces: Space[];
  spaceId: string;
  user: { email?: string; user_metadata?: Record<string, any> } | null;
  onSaved: () => void;
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(getUserName(user));
  const [savingProfile, setSavingProfile] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: profileName, username: profileName }
    });
    setSavingProfile(false);
    if (!error) {
      setEditingProfile(false);
      onSaved();
    } else {
      alert("No pudimos actualizar el perfil.");
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Preferencias"
        title="Configuracion"
        description="Administra los espacios y ajustes generales de tu planificacion."
      />
      <div className="settings-grid">
        <section className="panel">
          <p className="eyebrow">Mi Perfil</p>
          <h2>Datos del usuario</h2>
          <div className="settings-definition" style={{ marginTop: 20 }}>
            <div>
              <dt>Correo electronico</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Nombre visible</dt>
              <dd>
                {!editingProfile ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{getUserName(user)}</span>
                    <button
                      className="table-action"
                      onClick={() => {
                        setProfileName(getUserName(user));
                        setEditingProfile(true);
                      }}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} style={{ display: "flex", gap: 10 }}>
                    <input
                      autoFocus
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={50}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        width: "100%"
                      }}
                    />
                    <button type="submit" className="primary" disabled={savingProfile}>
                      {savingProfile ? "..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </dd>
            </div>
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Espacios</p>
          <h2>Personal y negocio</h2>
          <div className="settings-list">
            {spaces.map((space) => (
              <div key={space.id}>
                <span className="space-avatar">{space.type === "PERSONAL" ? "P" : "N"}</span>
                <div>
                  <strong>{space.name}</strong>
                  <span>
                    {space.type === "PERSONAL" ? "Finanzas personales" : "Emprendimiento"}
                  </span>
                </div>
                {space.id === spaceId && <span className="status-pill active">Activo</span>}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Formato regional</p>
          <h2>Republica Dominicana</h2>
          <dl className="settings-definition">
            <div>
              <dt>Moneda</dt>
              <dd>DOP · Peso dominicano</dd>
            </div>
            <div>
              <dt>Zona horaria</dt>
              <dd>America/Santo_Domingo</dd>
            </div>
            <div>
              <dt>Formato de fecha</dt>
              <dd>DD/MM/AAAA</dd>
            </div>
          </dl>
        </section>
        <section className="panel privacy-card">
          <p className="eyebrow">Privacidad</p>
          <h2>Tus registros son manuales</h2>
          <p>Rumbo no esta conectado a tus cuentas bancarias y no mueve dinero.</p>
        </section>
      </div>
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="module-empty large">
      <h1>Esta pagina no existe</h1>
      <button className="primary" onClick={() => navigate("/")}>
        Volver al inicio
      </button>
    </div>
  );
}

function MovementDialog({
  accessToken,
  initialType,
  movement,
  expenseOptions,
  spaceId,
  availableCents,
  onClose,
  onSaved
}: {
  accessToken: string;
  initialType: MovementType;
  movement?: Movement;
  expenseOptions: string[];
  spaceId: string;
  availableCents: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<MovementType>(initialType);
  const [status, setStatus] = useState<MovementStatus>(movement?.status ?? "REGISTERED");
  const [amount, setAmount] = useState(movement ? String(movement.amountCents / 100) : "");
  const [category, setCategory] = useState(
    movement?.category ?? (initialType === "INCOME" ? incomeCategories[0]! : expenseCategories[0]!)
  );
  const [description, setDescription] = useState(movement?.description ?? "");
  const [date, setDate] = useState(movement?.effectiveDate ?? today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amountCents = Math.round(Number(amount || 0) * 100);
  const previousImpact =
    movement?.status === "REGISTERED"
      ? movement.type === "INCOME"
        ? movement.amountCents
        : -movement.amountCents
      : 0;
  const nextImpact = status === "REGISTERED" ? (type === "INCOME" ? amountCents : -amountCents) : 0;
  const impact = availableCents - previousImpact + nextImpact;
  const categories = type === "INCOME" ? incomeCategories : expenseOptions;

  function changeType(next: MovementType) {
    setType(next);
    setCategory(next === "INCOME" ? incomeCategories[0]! : expenseOptions[0]!);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Introduce un monto mayor que cero.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const response = await apiFetch(
        accessToken,
        movement ? `/api/movements/${movement.id}` : "/api/movements",
        {
          method: movement ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceId,
            type,
            status,
            amountCents,
            effectiveDate: date,
            description: description.trim() || category,
            category
          })
        }
      );
      if (!response.ok) throw new Error("No pudimos guardar el movimiento.");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="movement-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header>
          <div>
            <p className="eyebrow">{movement ? "Editar movimiento" : "Nuevo movimiento"}</p>
            <h2 id="dialog-title">
              {movement
                ? `Editar ${type === "INCOME" ? "ingreso" : "gasto"}`
                : type === "INCOME"
                  ? "Registrar ingreso"
                  : "Registrar gasto"}
            </h2>
          </div>
          <button className="close-button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="type-tabs">
            <button
              type="button"
              className={type === "EXPENSE" ? "active" : ""}
              onClick={() => changeType("EXPENSE")}
            >
              Gasto
            </button>
            <button
              type="button"
              className={type === "INCOME" ? "active" : ""}
              onClick={() => changeType("INCOME")}
            >
              Ingreso
            </button>
          </div>
          <label>
            Monto <span>*</span>
            <div className="money-input">
              <span>RD$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </label>
          <div className="form-row">
            <label>
              Categoria <span>*</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha <span>*</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          <label>
            Descripcion <small>Opcional</small>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                type === "INCOME" ? "Ej. sueldo de agosto" : "Ej. compra del supermercado"
              }
            />
          </label>
          <fieldset>
            <legend>Estado</legend>
            <label>
              <input
                type="radio"
                checked={status === "REGISTERED"}
                onChange={() => setStatus("REGISTERED")}
              />{" "}
              Registrado
            </label>
            <label>
              <input
                type="radio"
                checked={status === "SCHEDULED"}
                onChange={() => setStatus("SCHEDULED")}
              />{" "}
              Programado
            </label>
          </fieldset>
          {amountCents > 0 && status === "REGISTERED" && (
            <div className="impact-card">
              <span>Disponible despues de guardar</span>
              <strong>{formatDop(impact)}</strong>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              {saving
                ? "Guardando..."
                : movement
                  ? "Guardar cambios"
                  : `Guardar ${type === "INCOME" ? "ingreso" : "gasto"}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
