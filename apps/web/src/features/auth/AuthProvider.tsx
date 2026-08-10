import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearOfflineUserData } from "../../lib/offline/database";
import { supabase, supabaseConfigured } from "../../lib/supabase";
import { AuthScreen } from "./AuthScreen";
import "./auth.css";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: false,
  session: null,
  user: null,
  signOut: async () => undefined
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    if (!supabase) return;
    const userId = session?.user.id;
    await supabase.auth.signOut();
    if (!userId) return;
    await Promise.all([
      clearOfflineUserData(userId),
      typeof caches === "undefined" ? Promise.resolve(false) : caches.delete("last-summary")
    ]);
  }

  return (
    <AuthContext.Provider
      value={{ configured: supabaseConfigured, loading, session, user: session?.user ?? null, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (!auth.configured) {
    return <main className="auth-setup-error"><h1>Falta configurar Supabase</h1><p>La aplicacion se cerro de forma segura porque no encontro la configuracion de autenticacion.</p></main>;
  }

  if (auth.loading) {
    return <main className="auth-loading" aria-live="polite"><span /><p>Verificando tu sesion...</p></main>;
  }

  if (!auth.session) return <AuthScreen />;
  return children;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
