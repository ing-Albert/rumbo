# App movil (Android) con Capacitor

Rumbo se distribuye en tres formas a partir del mismo codigo:

1. La web en Vercel (<https://rumbo-web-sepia.vercel.app>).
2. La PWA instalable desde el navegador.
3. Un APK de Android, que es lo que documenta este archivo.

Capacitor no reescribe la interfaz: empaqueta el build de `apps/web` dentro de
un WebView nativo y lo sirve desde `https://localhost`. La app instalada usa el
mismo backend de produccion (Supabase + la API en Vercel) que la web, asi que
los datos son los mismos en ambos lados.

## Que cambia respecto al build web

| Tema | Web | APK |
| --- | --- | --- |
| Llamadas a la API | rutas relativas `/api/...`, resueltas por los rewrites de `vercel.json` | URL absoluta de produccion, inyectada en `VITE_API_BASE_URL` |
| Service worker | activo (PWA offline) | desactivado: los assets ya viajan dentro del APK, y cachearlos dejaria la app pegada en una version vieja |
| Origen del navegador | el dominio de Vercel | `https://localhost` |

La reescritura de las rutas vive en un solo lugar, `apps/web/src/lib/api.ts`:
si `VITE_API_BASE_URL` esta definida, `apiFetch` antepone esa base a cualquier
ruta que empiece con `/`. El resto del codigo sigue escribiendo `/api/...` sin
enterarse.

Como el APK deja de compartir dominio con la API, las llamadas pasan a ser
cross-origin y entra a jugar CORS. Por eso `apps/api/src/app.ts` permite
siempre los origenes de Capacitor (`https://localhost`, `http://localhost`,
`capacitor://localhost`), ademas de los que se configuren en `CORS_ORIGIN`.

## Archivos relevantes

- `capacitor.config.ts`: `appId`, `appName` y `webDir` (apunta a `apps/web/dist`).
- `apps/web/.env.native`: define `VITE_API_BASE_URL`. Se versiona a proposito
  porque no contiene secretos; las claves de Supabase siguen viniendo de
  `.env.local`, que no se sube.
- `android/`: proyecto nativo generado por `npx cap add android`. Se versiona,
  porque ahi viven el icono, el splash y la configuracion de Gradle.

## Generar el APK

### Opcion A: desde GitHub Actions (no requiere instalar nada)

El workflow `.github/workflows/android.yml` compila el APK de debug en los
servidores de GitHub.

1. Configurar una sola vez los secrets del repositorio (Settings > Secrets and
   variables > Actions): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Ir a la pestana **Actions**, elegir **Android APK** y pulsar **Run workflow**.
3. Al terminar, descargar el artefacto `rumbo-debug-apk` del run.

### Opcion B: en la maquina local

Requiere Android Studio instalado (trae el JDK y el SDK de Android).

```bash
npm run build:mobile
npm run mobile:open
```

`build:mobile` compila `packages/domain`, genera el bundle web en modo `native`
y copia el resultado al proyecto Android (`cap sync`). `mobile:open` abre
Android Studio, donde se genera el APK con **Build > Build Bundle(s) / APK(s) >
Build APK(s)**.

## Instalar el APK en un telefono

El APK de debug no viene de Play Store, asi que Android pide permiso explicito:
al abrir el archivo aparece un aviso de "origen desconocido" y hay que
autorizar la instalacion para esa app. Es el flujo normal para una app propia.

## Pendiente para publicar en Play Store

Un APK de debug sirve para instalarlo uno mismo, no para publicar. Para eso
haria falta, ademas:

- Generar una keystore de release y firmar el build (`assembleRelease`).
- Definir `versionCode` / `versionName` en `android/app/build.gradle`.
- Cuenta de Google Play Console y las fichas de la tienda.

## iOS

No esta configurado. Requiere una Mac con Xcode para compilar, asi que se deja
fuera por ahora. El codigo esta preparado: `npx cap add ios` mas la misma
variable `VITE_API_BASE_URL` bastarian para arrancar.
