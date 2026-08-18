# Ideas y pendientes

Registro de lo que sigue en Rumbo. Lo de arriba esta acordado y en curso; lo de
abajo esta descartado _por ahora_, con el motivo, para no volver a discutirlo
desde cero cada vez.

## En curso

Ordenado por dependencia, no por valor: cada bloque se apoya en el anterior.

| #   | Que                                                               | Estado |
| --- | ----------------------------------------------------------------- | ------ |
| 3   | Metas: cuanto apartar por mes para llegar a la fecha objetivo     | hecho  |
| 2   | Presupuesto: aviso al acercarse y al pasarse del limite           | hecho  |
| 1   | Movimientos recurrentes que se registran solos al llegar la fecha | hecho  |
| 4   | Saldo acumulado real, no solo el flujo del mes                    | hecho  |
| 5   | Deudas, prestamos y sanes                                         | hecho  |
| 7   | Foto del recibo adjunta al gasto                                  | hecho  |
| 8   | Uso sin conexion con sincronizacion posterior                     | hecho  |
| 6   | Notificaciones (locales; las push siguen pendientes)              | hecho  |

Notas de dependencia y de bloqueo:

- **1 antes que 4.** El saldo acumulado tiene que contar lo recurrente ya
  registrado, o arranca dando cifras que no cuadran.
- **4 antes que 5.** Una deuda es un saldo con signo contrario; sin el concepto
  de saldo, el modulo de deudas queda colgado de la nada.
- **8 obliga a revisar `offline.html`.** Hoy esa pantalla bloquea la entrada a
  proposito, porque sin conexion la app abria vacia. Cuando funcione sin
  conexion, ese bloqueo pasa a estorbar: hay que dejar entrar y avisar que lo
  registrado se subira despues.
- **6 quedo a medias, a proposito.** El recordatorio diario ya funciona: lo
  lanza el propio aparato, sin servidor. Lo que falta son las notificaciones
  push, que necesitan cuentas de Firebase (Android) y APNs (iOS) que solo puede
  crear el dueno del proyecto, mas un backend que las envie. Hasta entonces el
  aviso solo suena mientras Rumbo sigue abierta.
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

## Version de pago

Aplazado: primero se sigue mejorando la version gratis. Se deja escrito lo
hablado para no reconstruirlo desde cero.

**El bloqueo real no son las funciones, es cobrar.** Stripe no opera en
Republica Dominicana. Google Play cobra 15% y ademas la app todavia no esta
publicada ahi, con el riesgo de que la rechacen por parecer "solo un sitio
web". Quedan las pasarelas locales (Azul, CardNet, que piden empresa formal),
PayPal con limitaciones para recibir en RD, o un intermediario tipo Paddle o
Lemon Squeezy que factura desde fuera: mas comision, menos papeleo. **Conviene
resolver esto antes de construir una sola funcion de pago**, porque la
respuesta puede cambiar el plan entero.

**La funcion con mas sentido: el san visto por quien lo organiza.** Hoy la app
sigue _tu_ san; falta la otra mitad, la de quien lleva la rueda de diez
personas en una libreta o en un grupo de WhatsApp. Ninguna app internacional lo
entiende, quien organiza maneja el dinero de todos, y se lo ensena a diez
personas cada ronda. Vale construirla aunque al principio sea gratis: es lo que
trae gente.

Otras candidatas: espacios ilimitados (hoy son dos fijos), compartir espacio
con la pareja, apartar a una meta automaticamente al cobrar el sueldo, analisis
comparando varios meses, y las notificaciones push, que necesitan
infraestructura de pago igualmente.

**Lo que no se puede cobrar nunca**, porque esto es una app de dinero y la
confianza es el producto: registrar y ver movimientos, exportar los propios
datos, y consultar meses viejos. El analisis entre meses si es cobrable —
gratis nunca se pierde acceso a nada, se paga por la comparacion, no por la
propia historia. Un limite de recibos al mes tambien es honesto, porque el
almacenamiento cuesta de verdad.

**Sobre el precio:** 3.99 USD al mes ronda el 1.5% de un salario minimo
dominicano, mas caro de lo que suena. Conviene cobrar en pesos y no en dolares,
empujar el anual antes que el mensual, y considerar un pago unico, que en RD
convierte mucho mejor que una suscripcion.
