import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor empaqueta la interfaz de `apps/web` dentro de un WebView nativo.
 *
 * `server.url` hace que la app cargue el despliegue de produccion en vez de la
 * copia que viaja dentro del APK. Es lo que permite que una correccion llegue a
 * todos los telefonos con solo desplegar en Vercel, sin que nadie reinstale
 * nada: reinstalar solo hace falta si cambia el envoltorio nativo (icono,
 * permisos, nombre). Con varias personas usando la app, pedirles que instalen
 * un APK por cada arreglo no es practico.
 *
 * El costo es que la app depende de la red para arrancar. Pesa poco aqui:
 * todos los datos vienen del servidor, asi que sin conexion la app no serviria
 * igual. Ademas el service worker de la PWA cachea la interfaz en la primera
 * apertura, con lo que las siguientes cargan aunque la red este lenta.
 * `errorPath` cubre el caso extremo (sin red y sin cache) con una pantalla
 * propia en vez del error crudo del navegador.
 *
 * Para volver al modo empaquetado basta con borrar el bloque `server`: el build
 * de `webDir` se sigue generando y queda listo como respaldo.
 *
 * No cambiar `androidScheme` ni `server.url`: el origen forma parte de la clave
 * de localStorage, y cambiarlo cierra la sesion de todos los usuarios.
 */
const config: CapacitorConfig = {
  appId: "app.rumbo.movil",
  appName: "Rumbo",
  webDir: "apps/web/dist",
  server: {
    url: "https://rumbo-web-sepia.vercel.app",
    errorPath: "offline.html"
  }
};

export default config;
