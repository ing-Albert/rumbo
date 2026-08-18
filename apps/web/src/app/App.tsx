import { formatDop, type MovementType, type Movement } from "@ahorra/domain";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { BalanceBridge } from "../components/BalanceBridge";
import { BottomNav } from "../components/layout/BottomNav";
import { RumboLogo } from "../components/layout/RumboLogo";
import { Sidebar } from "../components/layout/Sidebar";
import { UserMenu } from "../components/layout/UserMenu";
import { Stat } from "../components/Stat";
import { CashFlowChart } from "../features/dashboard/CashFlowChart";
import { CategoryChart } from "../features/dashboard/CategoryChart";
import { BalanceCard } from "../features/dashboard/BalanceCard";
import { EmptyState } from "../features/dashboard/EmptyState";
import { Projection } from "../features/dashboard/Projection";
import { RecentMovements } from "../features/dashboard/RecentMovements";
import { MovementDialog } from "../features/movements/MovementDialog";
import { MovementsPage } from "../features/movements/MovementsPage";
import { RecurrencesPanel } from "../features/movements/RecurrencesPanel";
import { BudgetAlertBanner } from "../features/budget/BudgetAlertBanner";
import { BudgetPage } from "../features/budget/BudgetPage";
import { DebtsPage } from "../features/debts/DebtsPage";
import { GoalsPage } from "../features/goals/GoalsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { WhatsNewPage } from "../features/whatsnew/WhatsNewPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { useSpaces } from "../hooks/useSpaces";
import { useMonthlyData } from "../hooks/useMonthlyData";
import { useModuleData } from "../hooks/useModuleData";
import { useBalance } from "../hooks/useBalance";
import { useCountUp } from "../hooks/useCountUp";
import { usePreviousMonthSummary } from "../hooks/usePreviousMonthSummary";
import { useWhatsNew } from "../hooks/useWhatsNew";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { useReminder } from "../hooks/useReminder";
import { WhatsNewPanel } from "../components/WhatsNewPanel";
import { OfflineBanner } from "../components/OfflineBanner";
import { expenseCategories } from "../lib/categories";
import { currentMonth, monthLabel } from "../lib/format";
import { navigate, usePathname } from "./router";

export default function App() {
  const auth = useAuth();
  const accessToken = auth.session?.access_token;
  const pathname = usePathname();
  const [month, setMonth] = useState(currentMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<MovementType>("EXPENSE");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { spaces, spaceId, setSpaceId, error: spacesError } = useSpaces(accessToken, auth.user?.id);
  const {
    summary,
    movements,
    loading,
    error: monthlyError
  } = useMonthlyData(accessToken, spaceId, month, refreshKey, auth.user?.id);
  const {
    budgetLimits,
    goals,
    customCategories,
    recurrences,
    debts,
    error: moduleError
  } = useModuleData(accessToken, spaceId, month, refreshKey, auth.user?.id);

  const error = spacesError || monthlyError || moduleError;
  const { balance } = useBalance(accessToken, spaceId, refreshKey, auth.user?.id);
  const animatedAvailable = useCountUp(summary.availableAfterSavingsCents);
  const previousSummary = usePreviousMonthSummary(accessToken, spaceId, month);
  const whatsNew = useWhatsNew(auth.user);
  const offline = useOfflineSync(auth.user?.id, accessToken, () =>
    setRefreshKey((value) => value + 1)
  );
  const reminder = useReminder(auth.user?.id, offline.pending);

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

        <div key={pathname} className="page-transition">
          {pathname === "/" || pathname === "/inicio" ? (
            <>
              <section className="hero" aria-labelledby="available-title">
                <div>
                  <p className="eyebrow">Disponible despues de ahorro</p>
                  <h1 id="available-title">
                    {loading ? (
                      <span className="skeleton skeleton-hero-number" aria-label="Calculando" />
                    ) : (
                      formatDop(animatedAvailable)
                    )}
                  </h1>
                  <p>Para {monthLabel(month)} segun tus registros</p>
                  {!loading && (
                    <BalanceBridge
                      beforeSavingsCents={summary.availableBeforeSavingsCents}
                      contributionCents={summary.contributionCents}
                      afterSavingsCents={summary.availableAfterSavingsCents}
                    />
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
                        {formatDop(summary.contributionCents)} para ahorro. Ajusta gastos o el
                        aporte de este periodo.
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

              <OfflineBanner
                online={offline.online}
                pending={offline.pending}
                onSync={() => void offline.sync()}
              />

              {!loading && <BalanceCard balance={balance} />}

              {!loading && <BudgetAlertBanner limits={budgetLimits} summary={summary} />}

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
                  <CashFlowChart summary={summary} previousSummary={previousSummary} />
                  <CategoryChart summary={summary} />
                  <RecentMovements
                    movements={movements}
                    onEdit={editMovement}
                    onViewAll={() => navigate("/movimientos")}
                  />
                  <Projection summary={summary} movements={movements} />
                </div>
              )}
            </>
          ) : pathname === "/movimientos" ? (
            <MovementsPage
              movements={movements}
              onAdd={openForm}
              onEdit={editMovement}
              minDate={auth.user?.created_at ? auth.user.created_at.substring(0, 10) : undefined}
              recurrencesSlot={
                <RecurrencesPanel
                  accessToken={accessToken}
                  spaceId={spaceId}
                  recurrences={recurrences}
                  customCategories={customCategories}
                  goals={goals}
                  onSaved={() => setRefreshKey((value) => value + 1)}
                />
              }
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
          ) : pathname === "/deudas" ? (
            <DebtsPage
              accessToken={accessToken}
              spaceId={spaceId}
              debts={debts}
              onSaved={() => setRefreshKey((value) => value + 1)}
            />
          ) : pathname === "/novedades" ? (
            <WhatsNewPage />
          ) : pathname === "/reportes" ? (
            <ReportsPage
              summary={summary}
              movements={movements}
              month={month}
              accessToken={accessToken}
              spaceId={spaceId}
            />
          ) : pathname === "/configuracion" ? (
            <SettingsPage
              accessToken={accessToken}
              spaces={spaces}
              spaceId={spaceId}
              balance={balance}
              reminder={reminder.settings}
              onReminderChange={reminder.save}
              user={auth.user}
              onSaved={() => setRefreshKey((value) => value + 1)}
            />
          ) : (
            <NotFoundPage />
          )}
        </div>
      </main>

      <button
        className="floating-add"
        aria-label="Agregar movimiento"
        onClick={() => openForm("EXPENSE")}
      >
        <Plus size={26} />
      </button>
      <BottomNav pathname={pathname} />

      {formOpen && (
        <MovementDialog
          accessToken={accessToken}
          userId={auth.user?.id ?? ""}
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
      {whatsNew.show && <WhatsNewPanel onClose={whatsNew.dismiss} />}
    </div>
  );
}
