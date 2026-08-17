import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor empaqueta el build de `apps/web` tal cual dentro de un WebView
 * nativo. El bundle se sirve desde https://localhost (esquema por defecto de
 * Android), asi que las llamadas a la API tienen que ir a la URL absoluta de
 * produccion: se define en `apps/web/.env.native` como VITE_API_BASE_URL.
 *
 * No cambiar `androidScheme`: el origen forma parte de la clave de
 * localStorage, y cambiarlo cierra la sesion de todos los usuarios instalados.
 */
const config: CapacitorConfig = {
  appId: "app.rumbo.movil",
  appName: "Rumbo",
  webDir: "apps/web/dist"
};

export default config;
