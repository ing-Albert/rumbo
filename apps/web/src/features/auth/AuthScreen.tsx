import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type AuthMode = "SIGN_IN" | "SIGN_UP" | "RECOVERY";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("SIGN_IN");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "RECOVERY") {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (recoveryError) throw recoveryError;
        setMessage("Si existe una cuenta con ese correo, recibiras instrucciones para recuperar el acceso.");
        return;
      }

      if (mode === "SIGN_UP") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { 
              display_name: displayName.trim(),
              username: displayName.trim()
            }
          }
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch {
      setError("No pudimos completar la solicitud. Revisa los datos e intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand auth-brand">
          <svg className="brand-logo-svg" width="38" height="38" viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="112" fill="rgba(255,255,255,0.2)"/>
            <path d="M126 354V158h92c63 0 105 31 105 87 0 35-17 61-48 75l90 34h-94l-66-29v29h-79zm79-97h19c24 0 37-9 37-28s-13-27-37-27h-19v55z" fill="#FFF8F0"/>
            <circle cx="365" cy="152" r="42" fill="#E3A72F"/>
          </svg>
          <strong className="brand-name">Rumbo</strong>
        </div>
        <p className="eyebrow">Planificacion clara</p>
        <h1>Organiza lo que entra, lo que sale y lo que quieres alcanzar.</h1>
        <p>Tus espacios Personal y Negocio permanecen separados y bajo tu control.</p>
        <div className="auth-promise"><span>01</span><p>Registra manualmente incluso sin internet.</p><span>02</span><p>Sincroniza automaticamente al reconectarte.</p><span>03</span><p>Revisa cada calculo y supuesto.</p></div>
      </section>
      <section className="auth-card">
        <p className="eyebrow">{mode === "SIGN_IN" ? "Bienvenido de nuevo" : mode === "SIGN_UP" ? "Crea tu cuenta" : "Recupera el acceso"}</p>
        <h2>{mode === "SIGN_IN" ? "Entra a tu plan" : mode === "SIGN_UP" ? "Comienza tu rumbo" : "Te enviaremos instrucciones"}</h2>
        <form onSubmit={(event) => void submit(event)}>
          {mode === "SIGN_UP" && <label>Nombre de usuario<input autoComplete="username" placeholder="Ej. JuanPerez" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>}
          <label>Correo electronico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode !== "RECOVERY" && <label>Contrasena<input type="password" minLength={8} autoComplete={mode === "SIGN_UP" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} /><small>Minimo 8 caracteres.</small></label>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="primary auth-submit" disabled={loading}>{loading ? "Procesando..." : mode === "SIGN_IN" ? "Iniciar sesion" : mode === "SIGN_UP" ? "Crear cuenta" : "Enviar instrucciones"}</button>
        </form>
        <div className="auth-links">
          {mode === "SIGN_IN" && <><button onClick={() => changeMode("RECOVERY")}>Olvide mi contrasena</button><button onClick={() => changeMode("SIGN_UP")}>Crear una cuenta</button></>}
          {mode !== "SIGN_IN" && <button onClick={() => changeMode("SIGN_IN")}>Volver a iniciar sesion</button>}
        </div>
        <p className="auth-privacy">Al continuar aceptas los terminos y confirmas que leiste el aviso de privacidad.</p>
      </section>
    </main>
  );
}
