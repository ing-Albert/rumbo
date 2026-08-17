import { type FormEvent, useState } from "react";
import { PageTitle } from "../../components/PageTitle";
import { Briefcase, CalendarDays, Clock, Coins, Pencil, ShieldCheck, User } from "lucide-react";
import { StatusPill } from "../../components/StatusPill";
import { supabase } from "../../lib/supabase";
import { getUserName } from "../../lib/format";
import { OpeningBalanceCard } from "./OpeningBalanceCard";
import type { Balance } from "@ahorra/domain";

type Space = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

export function SettingsPage({
  accessToken,
  spaces,
  spaceId,
  balance,
  user,
  onSaved
}: {
  accessToken: string;
  spaces: Space[];
  spaceId: string;
  balance: Balance;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  onSaved: () => void;
}) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(getUserName(user));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setSavingProfile(true);
    setProfileError("");
    const { error } = await supabase.auth.updateUser({
      data: { display_name: profileName, username: profileName }
    });
    setSavingProfile(false);
    if (!error) {
      setEditingProfile(false);
      onSaved();
    } else {
      setProfileError("No pudimos actualizar el perfil.");
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
          <div className="settings-definition settings-definition-block">
            <div>
              <dt>Correo electronico</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Nombre visible</dt>
              <dd>
                {!editingProfile ? (
                  <div className="field-row">
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
                  <form onSubmit={(event) => void saveProfile(event)} className="inline-edit-form">
                    <input
                      autoFocus
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={50}
                      className="inline-edit-input"
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
                {profileError && (
                  <p className="form-error" role="alert">
                    {profileError}
                  </p>
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
                <span className="space-avatar">
                  {space.type === "PERSONAL" ? <User size={18} /> : <Briefcase size={18} />}
                </span>
                <div>
                  <strong>{space.name}</strong>
                  <span>
                    {space.type === "PERSONAL" ? "Finanzas personales" : "Emprendimiento"}
                  </span>
                </div>
                {space.id === spaceId && <StatusPill tone="active" label="Activo" />}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Formato regional</p>
          <h2>Republica Dominicana</h2>
          <dl className="settings-definition">
            <div>
              <dt>
                <Coins size={16} /> Moneda
              </dt>
              <dd>DOP · Peso dominicano</dd>
            </div>
            <div>
              <dt>
                <Clock size={16} /> Zona horaria
              </dt>
              <dd>America/Santo_Domingo</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={16} /> Formato de fecha
              </dt>
              <dd>DD/MM/AAAA</dd>
            </div>
          </dl>
        </section>
        <OpeningBalanceCard
          accessToken={accessToken}
          spaceId={spaceId}
          spaceName={spaces.find((space) => space.id === spaceId)?.name ?? "este espacio"}
          balance={balance}
          onSaved={onSaved}
        />
        <section className="panel privacy-card">
          <p className="eyebrow">Privacidad</p>
          <h2>
            <ShieldCheck size={22} /> Tus registros son manuales
          </h2>
          <p>Rumbo no esta conectado a tus cuentas bancarias y no mueve dinero.</p>
        </section>
      </div>
    </>
  );
}
