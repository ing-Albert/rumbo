import { type FormEvent, useState } from "react";
import { PageTitle } from "../../components/PageTitle";
import { Pencil } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getUserName } from "../../lib/format";

type Space = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

export function SettingsPage({
  spaces,
  spaceId,
  user,
  onSaved
}: {
  spaces: Space[];
  spaceId: string;
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
                  <form
                    onSubmit={(event) => void saveProfile(event)}
                    style={{ display: "flex", gap: 10 }}
                  >
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
