# Capa sin conexion

Registrar un gasto sin senal y que se suba solo despues.

## Que cubre y que no

Solo la **creacion de movimientos**. Es lo unico que de verdad se hace con el
telefono en la mano y sin cobertura: anotar un gasto en el momento en que
ocurre. Editar o borrar sin conexion abriria la puerta a conflictos (dos
dispositivos tocando la misma fila), y resolverlos bien pide una estrategia que
no vale la pena disenar antes de que el problema exista.

Presupuesto, metas, deudas y recurrencias siguen necesitando conexion.

## Como funciona

1. `MovementDialog` intenta el POST normal. Si el `fetch` revienta —lo que
   significa falta de red, porque un rechazo del servidor habria devuelto una
   respuesta— llama a `queueMovement` en vez de mostrar un error.
2. `queueMovement` escribe en `movements` (para pintarlo) y en `outbox` (para
   subirlo), con un id local prefijado `local:`.
3. `useMonthlyData` mezcla lo pendiente con lo que vino del servidor y
   **recalcula el resumen en el cliente**. Si no lo hiciera, un gasto apareceria
   en la lista sin descontar del disponible, y eso hace dudar de todas las
   cifras.
4. `useOfflineSync` vacia la cola al volver la conexion, al volver la app a
   primer plano y al arrancar. Lo segundo importa: en un telefono, lo normal es
   que la app este cerrada justo cuando la senal regresa.

## Decisiones que conviene no deshacer

- **Un 4xx no se reintenta.** El dato es invalido y lo seguira siendo dentro de
  una hora; la entrada se marca `FAILED` y deja de bloquear a las demas. Un
  fallo de red, en cambio, se conserva intacto: ahi el problema es el momento.
- **Un 5xx o un fallo de red cortan el recorrido.** No tiene sentido repetir el
  mismo intento fallido con cada entrada que queda.
- **Si IndexedDB no esta disponible, se devuelve vacio.** En navegacion privada
  o en un WebView viejo puede no existir. Guardar para despues es una mejora;
  que su ausencia dejara la pantalla en blanco seria mucho peor que no tenerla.
- **La foto del recibo no entra en la cola.** Subirla necesita red igual, y
  guardarla aqui solo serviria para inflar IndexedDB con una imagen que se
  puede volver a tomar.

## Relacion con `offline.html`

`apps/web/public/offline.html` es la pantalla que muestra el APK cuando no
puede cargar el sitio. Antes bloqueaba el paso a proposito, porque entrar sin
conexion llevaba a una app vacia. Ahora ofrece **Entrar sin conexion**, que ya
lleva a algo util.
