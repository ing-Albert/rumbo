# Ideas y pendientes

Registro de lo que sigue en Rumbo. Lo de arriba esta acordado y en curso; lo de
abajo esta descartado _por ahora_, con el motivo, para no volver a discutirlo
desde cero cada vez.

## En curso

Ordenado por dependencia, no por valor: cada bloque se apoya en el anterior.

| #   | Que                                                               | Estado    |
| --- | ----------------------------------------------------------------- | --------- |
| 3   | Metas: cuanto apartar por mes para llegar a la fecha objetivo     | hecho     |
| 2   | Presupuesto: aviso al acercarse y al pasarse del limite           | hecho     |
| 1   | Movimientos recurrentes que se registran solos al llegar la fecha | hecho     |
| 4   | Saldo acumulado real, no solo el flujo del mes                    | hecho     |
| 5   | Deudas, prestamos y sanes                                         | pendiente |
| 7   | Foto del recibo adjunta al gasto                                  | pendiente |
| 8   | Uso sin conexion con sincronizacion posterior                     | pendiente |
| 6   | Notificaciones                                                    | pendiente |

Notas de dependencia y de bloqueo:

- **1 antes que 4.** El saldo acumulado tiene que contar lo recurrente ya
  registrado, o arranca dando cifras que no cuadran.
- **4 antes que 5.** Una deuda es un saldo con signo contrario; sin el concepto
  de saldo, el modulo de deudas queda colgado de la nada.
- **8 obliga a revisar `offline.html`.** Hoy esa pantalla bloquea la entrada a
  proposito, porque sin conexion la app abria vacia. Cuando funcione sin
  conexion, ese bloqueo pasa a estorbar: hay que dejar entrar y avisar que lo
  registrado se subira despues.
- **6 depende de cuentas de terceros.** Las notificaciones push necesitan
  Firebase (Android) y APNs (iOS), y esas cuentas las tiene que crear el
  dueno del proyecto. Las locales (recordatorios programados en el propio
  telefono) no dependen de nadie y cubren buena parte del valor, asi que van
  primero.
- **7 necesita un bucket de Supabase Storage** con sus politicas de acceso por
  usuario, equivalentes a las de RLS que ya protegen las tablas.

## Descartado por ahora

Ninguna es mala idea; todas tienen un costo que hoy no se justifica.

### Compartir un espacio entre dos personas

Que una pareja vea y edite el mismo espacio.

**Por que no ahora:** todo el aislamiento de datos esta montado sobre "cada
usuario ve solo lo suyo" (RLS mas filtro explicito por usuario en cada
consulta). Pasar a "este espacio lo comparten N usuarios" toca la parte mas
delicada del sistema, la que protege el dinero de la gente. Vale la pena, pero
no mientras haya funciones que no tocan la seguridad y dan mas valor.

### Manejar dolares ademas de pesos

**Por que no ahora:** meter una segunda moneda contamina todos los calculos
(resumenes, presupuestos, metas, reportes) con conversiones y tasas de cambio
con fecha. Es mucho ruido en el nucleo del dominio para el beneficio que da
hoy.

### Importar el estado de cuenta del banco

**Por que no ahora:** cada banco exporta en su propio formato, y varios solo dan
PDF. Es trabajo sin fin y sin garantia de que funcione. Si algun dia se hace,
conviene empezar por un CSV generico y documentado, no por "leer lo que sea".
