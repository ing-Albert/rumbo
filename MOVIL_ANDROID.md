# App movil (Android) con Capacitor

Rumbo se distribuye en tres formas a partir del mismo codigo:

1. La web en Vercel (<https://rumbo-web-sepia.vercel.app>).
2. La PWA instalable desde el navegador.
3. Un APK de Android, que es lo que documenta este archivo.

Capacitor no reescribe la interfaz: le pone un envoltorio nativo (icono,
nombre, pantalla de arranque, entrada en el lanzador) a la misma app web.

## Como se actualiza

La app **carga el despliegue de produccion**, no la copia que viaja dentro del
APK: `capacitor.config.ts` define `server.url`. Un arreglo desplegado en Vercel
llega a todos los telefonos en la siguiente apertura, sin que nadie reinstale.

Solo hace falta repartir un APK nuevo cuando cambia el envoltorio nativo: el
icono, el nombre, los permisos, la version de Capacitor. Nunca por un cambio de
la interfaz o de la logica.

La alternativa era empaquetar los assets adentro (borrando el bloque `server`),
que es como estuvo al principio. Se descarto porque obligaba a reinstalar en
cada cambio, y eso no escala apenas la usa mas de una persona. A cambio, la app
necesita red para arrancar; pesa poco, porque todos los datos vienen del
servidor y sin conexion no serviria igual. Ademas:

- El service worker de la PWA cachea la interfaz en la primera apertura, asi
  que las siguientes no dependen de que la red este rapida.
- Si no hay red ni cache, `server.errorPath` muestra `offline.html` (una
  pantalla propia, en los colores de Rumbo) en vez del error crudo del WebView.

El build de `webDir` se sigue generando y queda dentro del APK como respaldo:
borrar el bloque `server` alcanza para volver al modo empaquetado.

## Llamadas a la API

Con `server.url` la app corre en el dominio de Vercel, asi que las rutas
relativas `/api/...` vuelven a resolver solas, igual que en la web.

El soporte para el modo empaquetado sigue en su lugar, porque ahi si haria
falta: `apps/web/src/lib/api.ts` antepone `VITE_API_BASE_URL` a cualquier ruta
que empiece con `/` cuando esa variable esta definida (`apps/web/.env.native`,
que se usa en `vite build --mode native`), y `apps/api/src/app.ts` permite los
origenes de Capacitor (`https://localhost`, `http://localhost`,
`capacitor://localhost`) ademas de los de `CORS_ORIGIN`.

## Archivos relevantes

- `capacitor.config.ts`: `appId`, `appName`, `webDir` y el bloque `server`.
- `apps/web/public/offline.html`: pantalla de "sin conexion" del envoltorio.
- `apps/web/.env.native`: define `VITE_API_BASE_URL` para el modo empaquetado.
  Se versiona a proposito porque no contiene secretos; las claves de Supabase
  siguen viniendo de `.env.local`, que no se sube.
- `android/`: proyecto nativo generado por `npx cap add android`. Se versiona,
  porque ahi viven el icono, el splash y la configuracion de Gradle.

## Generar el APK

### Opcion A: desde GitHub Actions (no requiere instalar nada)

El workflow `.github/workflows/android.yml` compila el APK de debug en los
servidores de GitHub. Requiere que la cuenta tenga GitHub Actions habilitado:
si hay un problema de facturacion, el job falla antes de arrancar con
"your account is locked due to a billing issue" y no es un error del proyecto.

1. Configurar una sola vez los secrets del repositorio (Settings > Secrets and
   variables > Actions): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Ir a la pestana **Actions**, elegir **Android APK** y pulsar **Run workflow**.
3. Al terminar, descargar el artefacto `rumbo-debug-apk` del run.

### Opcion B: en la maquina local

Hace falta un JDK 21 y el SDK de Android. Android Studio los trae, pero no es
necesario: alcanza con el JDK y las command line tools.

Instalacion de la cadena minima (una sola vez):

```bash
winget install --id Microsoft.OpenJDK.21 --silent --accept-package-agreements
```

Descargar `commandlinetools-win-*_latest.zip` de
<https://developer.android.com/studio#command-line-tools-only>, descomprimirlo
en `%USERPROFILE%\Android\Sdk\cmdline-tools\latest`, y desde ahi:

```bash
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

Crear `android/local.properties` (ignorado por Git) con la ruta del SDK:

```
sdk.dir=C\:\\Users\\TU_USUARIO\\Android\\Sdk
```

Ya con eso, generar el APK:

```bash
npm run build:mobile
cd android && ./gradlew assembleDebug
```

`build:mobile` compila `packages/domain`, genera el bundle web en modo `native`
y copia el resultado al proyecto Android (`cap sync`). El APK queda en
`android/app/build/outputs/apk/debug/app-debug.apk`.

Si `gradlew` no encuentra Java, exportar `JAVA_HOME` apuntando al JDK 21
(`C:\Program Files\Microsoft\jdk-21.x.y.z-hotspot`).

Con Android Studio instalado, `npm run mobile:open` abre el proyecto y el APK
se genera desde **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

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
