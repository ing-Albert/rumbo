# Plan de implementacion de la siguiente etapa

## 1. Decisiones confirmadas

- Base principal: PostgreSQL administrado en Supabase.
- Identidad: Supabase Auth.
- API financiera: Fastify seguira siendo la puerta de entrada a los datos.
- Datos actuales de SQLite: son pruebas y no se migraran a las cuentas reales.
- Cuentas iniciales: individuales.
- Espacios por usuario: Personal y uno o varios Negocios.
- Moneda inicial: DOP.
- Funcionamiento offline: lectura, creacion y edicion completas.
- Sincronizacion: automatica al recuperar internet.
- Registro manual: continuara siendo el flujo principal.
- IA: fuera de esta etapa.

## 2. Objetivo

Evolucionar la aplicacion actual desde un prototipo local a una aplicacion multiusuario segura, sincronizada y preparada para crecer, sin perder la facilidad para registrar gastos manualmente.

La entrega se realizara por fases. Cada fase debera quedar utilizable, probada y estable antes de comenzar la siguiente.

## 3. Arquitectura objetivo

```text
PWA React
|-- Interfaz y formularios
|-- IndexedDB local
|-- Cola de sincronizacion
|-- Cache privada por usuario
|
| HTTPS + sesion Supabase
v
API Fastify
|-- Autenticacion y autorizacion
|-- Reglas financieras
|-- Idempotencia y conflictos
|-- Reportes y exportaciones
|-- Jobs de recurrencias y notificaciones
|
v
Supabase PostgreSQL
|-- Datos financieros
|-- Row Level Security
|-- Migraciones versionadas
|-- Backups administrados
|
+-- Supabase Auth
```

### Responsabilidades

La PWA puede trabajar sin internet, pero no decide la propiedad final de los datos. Fastify valida permisos, reglas y versiones. PostgreSQL es la fuente de verdad cuando existe conexion.

El navegador nunca recibira la clave administrativa de Supabase. Las credenciales sensibles solo existiran en la API y en variables de entorno.

## 4. Estructura del codigo

```text
apps/web/src/
|-- features/auth/
|-- features/movements/
|-- features/categories/
|-- features/goals/
|-- features/reports/
|-- features/calendar/
|-- features/planning/
|-- features/debts/
|-- features/imports/
|-- lib/api/
|-- lib/offline/
`-- components/

apps/api/src/
|-- plugins/auth.ts
|-- plugins/database.ts
|-- plugins/security.ts
|-- modules/auth/
|-- modules/spaces/
|-- modules/movements/
|-- modules/categories/
|-- modules/goals/
|-- modules/reports/
|-- modules/calendar/
|-- modules/planning/
|-- modules/debts/
|-- modules/imports/
|-- jobs/
`-- migrations/

packages/domain/src/
|-- money.ts
|-- dates.ts
|-- movements.ts
|-- recurrence.ts
|-- goals.ts
|-- planning.ts
|-- reports.ts
|-- debts.ts
`-- contracts.ts
```

Se mantendra un monolito modular. No se crearan microservicios, Redis, colas externas ni Kubernetes en esta etapa.

## 5. Base de datos

### Creacion

La base se creara dentro de un proyecto Supabase. Se utilizaran ambientes separados:

- Desarrollo: proyecto Supabase de desarrollo.
- Produccion: proyecto independiente cuando llegue el piloto publico.
- Pruebas automatizadas: PostgreSQL temporal o esquema aislado.

### Tablas base

| Tabla | Responsabilidad |
| --- | --- |
| `users` | Vinculo con el identificador estable de Supabase Auth |
| `profiles` | Nombre, idioma, zona horaria y preferencias |
| `spaces` | Personal o Negocio, siempre vinculado al usuario |
| `categories` | Categorias normalizadas, clasificacion y archivo |
| `movements` | Ingresos, gastos, aportes y estados |
| `budgets` | Periodos presupuestarios |
| `budget_limits` | Limites por categoria |
| `recurrence_rules` | Plantillas de movimientos recurrentes |
| `scheduled_occurrences` | Ocurrencias pendientes, realizadas u omitidas |
| `goals` | Metas y fondos especiales |
| `goal_contributions` | Aportes enlazados a movimientos |
| `income_scenarios` | Ingreso minimo, probable y maximo |
| `saved_simulations` | Escenarios guardados por el usuario |
| `debts` | Datos declarados de deudas |
| `debt_payments` | Pagos enlazados a movimientos |
| `notifications` | Recordatorios y estado de entrega |
| `notification_preferences` | Canales, horarios y privacidad |
| `import_batches` | Lotes de importacion |
| `import_rows` | Filas en revision y resultado |
| `audit_events` | Acciones sensibles sin copiar datos financieros completos |

### Campos transversales

Las entidades sincronizables tendran:

- `id`: UUID creado en cliente o servidor.
- `user_id`: propietario.
- `space_id`: Personal o Negocio cuando corresponda.
- `version`: control de concurrencia.
- `created_at`.
- `updated_at`.
- `deleted_at`: eliminacion reversible cuando aplique.

Los importes se guardaran como `BIGINT` en centavos. No se usaran valores de punto flotante.

## 6. Funcionamiento offline y sincronizacion

### Base local

La PWA utilizara IndexedDB para almacenar una copia de los datos del usuario autenticado y una cola de cambios pendientes.

### Flujo offline

1. El usuario inicia sesion al menos una vez con internet.
2. La aplicacion descarga los datos necesarios de sus espacios.
3. Sin internet puede crear o editar movimientos, metas, presupuestos y otros datos compatibles.
4. Cada cambio recibe un UUID y se guarda en una cola local.
5. La interfaz muestra `Pendiente de sincronizar`.
6. Al recuperar internet, la PWA envia las operaciones en orden.
7. La API usa claves de idempotencia para evitar duplicados.
8. PostgreSQL confirma una nueva version.
9. La PWA marca el cambio como sincronizado.

### Momentos de sincronizacion

- Al abrir la aplicacion.
- Al volver a primer plano.
- Cuando el navegador detecte internet.
- Despues de guardar un cambio con conexion.
- Mediante sincronizacion en segundo plano cuando el navegador la soporte.

No se dependera exclusivamente de Background Sync porque su soporte varia, especialmente en iOS.

### Conflictos

- Etiquetas y preferencias simples: se puede elegir la version mas reciente cuando sea seguro.
- Movimientos, aportes, deudas y metas: nunca se fusionan silenciosamente.
- Si dos dispositivos editan el mismo dato, se mostraran ambas versiones y su impacto.
- El usuario elegira conservar una version o crear una correccion.

### Privacidad local

- La informacion local se separara por usuario.
- Cerrar sesion eliminara datos financieros y colas sincronizadas del dispositivo.
- Si existen cambios sin sincronizar, se advertira antes de cerrar sesion.
- El service worker no compartira respuestas financieras entre usuarios.
- La app explicara que el modo offline guarda informacion en el dispositivo.

## 7. Orden de implementacion

El orden se define por dependencias tecnicas, no solamente por la lista de funciones.

### Fase 0: preparacion y Supabase

Duracion estimada: 2 a 4 dias.

Trabajo:

- Crear proyecto Supabase de desarrollo.
- Configurar Auth, PostgreSQL, URLs y variables de entorno.
- Definir migraciones versionadas.
- Crear esquema inicial, restricciones y RLS.
- Actualizar arquitectura y contratos de API.
- Mantener SQLite solo para pruebas anteriores hasta verificar el corte.

Criterio de salida:

- API conecta mediante TLS.
- Migraciones se ejecutan desde cero.
- Ninguna clave administrativa aparece en la PWA o el repositorio.

### Fase 1: autenticacion y privacidad

Duracion estimada: 7 a 10 dias.

Funciones:

- Registro con correo y contrasena.
- Verificacion de correo.
- Inicio y cierre de sesion.
- Recuperacion de acceso.
- Sesion segura y renovacion.
- Creacion automatica del perfil y espacio Personal.
- Activacion de espacios Negocio.
- Pantalla de privacidad y uso de datos.
- Exportacion y eliminacion de cuenta como flujos preparados.
- Dispositivos o sesiones activas.
- Modo para ocultar importes en pantalla.

Seguridad:

- Cookies o sesion protegida.
- CSRF cuando corresponda.
- CORS limitado.
- Rate limiting en registro, acceso y recuperacion.
- Autorizacion por usuario en cada endpoint.
- Pruebas contra acceso a recursos ajenos.

Criterio de salida:

- El usuario A no puede conocer ni modificar datos del usuario B.
- Cerrar sesion limpia datos locales.
- Los mensajes de recuperacion no revelan si un correo existe.

### Fase 2: categorias completas y nucleo de movimientos

Duracion estimada: 7 a 10 dias.

Categorias:

- Crear, editar y reordenar.
- Icono y color.
- Clasificar como necesidad, gasto personal o ahorro.
- Marcar como gasto esencial.
- Archivar y restaurar.
- Combinar categorias y reasignar movimientos.
- Separacion Personal/Negocio.

Movimientos:

- Migrar categoria de texto a `category_id`.
- Crear y editar offline.
- Anular o enviar a papelera.
- Restaurar durante 30 dias.
- Mostrar impacto antes de eliminar.
- Registrar origen manual, recurrente o importado.
- Mantener paginacion y filtros.

Criterio de salida:

- Una categoria usada nunca rompe el historial.
- Eliminar un movimiento recalcula todo y puede deshacerse.
- Los cambios offline se sincronizan sin duplicarse.

### Fase 3: movimientos recurrentes

Duracion estimada: 5 a 7 dias.

Funciones:

- Crear recurrencia desde cero o desde un movimiento.
- Frecuencia semanal, quincenal, mensual y anual.
- Fecha de inicio y fin opcional.
- Monto fijo o estimado.
- Lista de proximas ocurrencias.
- Confirmar, editar, posponer u omitir cada ocurrencia.
- Editar solo una ocurrencia o esta y las futuras.
- Detener una serie sin alterar el historial.

Regla principal:

Una ocurrencia pendiente no afecta los datos registrados hasta que el usuario la confirme.

Criterio de salida:

- No se generan ocurrencias duplicadas.
- Los dias 29, 30 y 31 se ajustan al calendario real.
- Reintentar sincronizacion no duplica movimientos.

### Fase 4: metas avanzadas y distribucion automatica

Duracion estimada: 7 a 10 dias.

Edicion de metas:

- Editar nombre, objetivo, fecha y prioridad.
- Pausar, reactivar y archivar.
- Editar, retirar o anular aportes.
- Historial completo.
- Aporte requerido actualizado.
- Fecha aproximada al ritmo actual.

Distribucion automatica:

- Metodo 50/30/20 opcional.
- Porcentajes personalizados que deben sumar 100%.
- Necesidades, gastos personales y ahorro.
- Limites sugeridos por categoria.
- Distribucion del ahorro entre metas prioritarias.
- Comparacion entre plan sugerido y gasto registrado.
- Ningun limite bloquea el registro manual.

Criterio de salida:

- La propuesta nunca modifica movimientos reales.
- El usuario revisa y confirma antes de aplicar limites o aportes programados.
- Los aportes no se cuentan como gastos.

### Fase 5: comparaciones y reportes mensuales

Duracion estimada: 5 a 8 dias.

Funciones:

- Mes actual contra mes anterior.
- Mismos dias contra mismos dias si el mes esta incompleto.
- Ingresos, gastos, ahorro y disponible.
- Gastos por categoria y su variacion.
- Planificado contra registrado.
- Personal y Negocio por separado.
- Acceso desde cada indicador a sus movimientos.
- Exportacion CSV desde servidor.
- PDF en una iteracion posterior de esta fase.

Criterio de salida:

- Si el periodo anterior es cero, muestra `No comparable`.
- Registrado y proyectado nunca se mezclan sin indicarlo.
- Totales exportados coinciden con pantalla.

### Fase 6: calendario y notificaciones

Duracion estimada: 6 a 9 dias.

Calendario:

- Vista mensual y agenda.
- Ingresos esperados.
- Gastos recurrentes.
- Aportes a metas.
- Pagos de deudas.
- Estados pendiente, registrado, omitido y vencido.

Notificaciones:

- Recordatorios dentro de la app.
- Web Push opcional.
- Horarios silenciosos.
- Anticipacion configurable.
- Preferencias por tipo y espacio.
- Contenido discreto sin importes en pantalla bloqueada.

Criterio de salida:

- Una notificacion nunca registra un pago o gasto automaticamente.
- No se envia dos veces el mismo recordatorio.
- Denegar permisos no bloquea el calendario.

### Fase 7: ingresos variables, distribucion y simulaciones

Duracion estimada: 7 a 10 dias.

Ingresos variables:

- Fuentes de ingreso.
- Escenario minimo, probable y maximo.
- Historial de referencia opcional.
- Plan conservador basado en el minimo.
- Excedentes distribuidos solo despues de confirmarlos.

Simulador:

- Aumentar o reducir ahorro.
- Reducir una categoria.
- Cambiar ingresos.
- Cambiar aporte o fecha de una meta.
- Escenarios actual, conservador y optimista.
- Guardar y comparar escenarios.
- Aplicar solo elementos planificados despues de confirmacion.

Criterio de salida:

- Simular nunca cambia movimientos registrados.
- Se muestran todos los supuestos.
- Un escenario negativo indica el monto sin cubrir.

### Fase 8: deudas y fondo de emergencia

Duracion estimada: 8 a 12 dias.

Deudas:

- Nombre o alias.
- Saldo declarado y fecha.
- Pago minimo.
- Tasa opcional.
- Fecha de pago.
- Registro manual de pagos.
- Estrategia avalancha, bola de nieve o personalizada.
- Simulacion de pagos extraordinarios.

Fondo de emergencia:

- Meta especial Personal.
- Reserva operativa para Negocio.
- Objetivo fijo o meses de gastos esenciales.
- Seleccion explicita de categorias esenciales.
- Cobertura actual en meses.
- Aportes y retiros.

Criterio de salida:

- La app no inventa intereses ni saldos.
- Las simulaciones se presentan como estimaciones.
- Un pago se cuenta una sola vez.

### Fase 9: importaciones

Duracion estimada: 7 a 10 dias.

Primera version:

- CSV.
- Seleccion previa de Personal o Negocio.
- Mapeo de columnas.
- Formato de fecha configurable.
- Montos firmados o debito/credito separados.
- Vista previa.
- Asignacion de categorias.
- Deteccion de duplicados.
- Validacion por fila.
- Confirmacion final.
- Reversion del lote.

Seguridad:

- Limite de archivo y filas.
- Procesamiento en staging.
- Proteccion contra formulas CSV.
- Eliminacion del archivo original despues del plazo definido.
- Ningun dato se registra antes de confirmar.

Criterio de salida:

- Totales de la vista previa coinciden con lo importado.
- Reintentar no duplica filas.
- Revertir el lote muestra el impacto antes de actuar.

## 8. APIs principales

Las rutas se versionaran bajo `/api/v1`.

| Area | Rutas principales |
| --- | --- |
| Usuario | `/me`, `/account/export`, `/account` |
| Espacios | `/spaces` |
| Categorias | `/spaces/:id/categories`, `/categories/:id` |
| Movimientos | `/spaces/:id/movements`, `/movements/:id` |
| Recurrencias | `/recurrence-rules`, `/occurrences/:id` |
| Metas | `/goals`, `/goals/:id/contributions`, `/goals/:id/projection` |
| Planificacion | `/plans`, `/distributions`, `/simulations` |
| Reportes | `/reports/monthly`, `/reports/categories`, `/reports/trends` |
| Calendario | `/calendar`, `/notifications`, `/notification-preferences` |
| Deudas | `/debts`, `/debts/:id/payments`, `/debts/:id/simulation` |
| Importaciones | `/imports`, `/imports/:id/preview`, `/imports/:id/confirm` |

Toda ruta financiera obtiene el usuario desde la sesion. Un identificador enviado por el navegador no puede cambiar el propietario.

## 9. Privacidad y seguridad

- Correo verificado antes de sincronizar datos sensibles.
- Supabase Auth maneja contrasenas y recuperacion.
- Autorizacion adicional en Fastify.
- RLS en PostgreSQL como segunda barrera.
- TLS para web, API y base.
- Rate limiting.
- CORS limitado a dominios conocidos.
- Proteccion CSRF para sesiones basadas en cookies.
- CSP y cabeceras seguras.
- Logs sin importes, notas, tokens o archivos.
- Auditoria de accesos y operaciones sensibles.
- Reautenticacion para exportar o eliminar cuenta.
- Exportacion y eliminacion de datos.
- Retencion y backups documentados.
- Revision legal dominicana antes del piloto publico.

El tratamiento se disenara siguiendo los principios de finalidad, minimizacion, seguridad y derechos del titular contemplados por la Ley 172-13.

## 10. Estrategia de pruebas

### Unitarias

- Dinero y redondeos.
- Recurrencias y calendario.
- Distribucion porcentual.
- Proyeccion de metas.
- Comparaciones mensuales.
- Simulaciones de deuda.
- Deteccion de duplicados.

### Integracion

- PostgreSQL real.
- Migraciones.
- Transacciones.
- RLS y aislamiento.
- Idempotencia.
- Jobs recurrentes.
- Importaciones.

### E2E

- Registro y recuperacion.
- Trabajo online y offline.
- Sincronizacion al reconectar.
- Conflicto entre dispositivos.
- Movimiento recurrente.
- Eliminacion y restauracion.
- Categoria archivada.
- Meta y aporte.
- Reporte y exportacion.
- Calendario y recordatorio.
- Deuda y fondo de emergencia.
- Importacion y reversion.

### Seguridad

- El usuario A no accede al usuario B.
- Cambio de IDs en URL y API.
- CSRF y CORS.
- Sesion cerrada.
- Cache local eliminada.
- CSV malicioso.
- Limites de carga y solicitudes.

## 11. Estrategia de entrega

- Rama de trabajo por fase.
- Migraciones pequenas y reversibles.
- Ambiente de desarrollo Supabase.
- Build, pruebas y analisis de dependencias en cada cambio.
- Despliegue de prueba antes de cada cierre de fase.
- No mantener escritura doble SQLite/PostgreSQL.
- SQLite actual quedara solo como respaldo de datos de prueba y se retirara cuando PostgreSQL este validado.

## 12. Duracion estimada

Para un desarrollador full-stack trabajando de forma continua:

| Bloque | Estimacion |
| --- | ---: |
| Supabase, Auth, privacidad y sincronizacion offline | 3 a 4 semanas |
| Categorias, movimientos, eliminacion y recurrencias | 2 a 3 semanas |
| Metas, distribucion y reportes | 2 a 3 semanas |
| Calendario, notificaciones y simulaciones | 2 a 3 semanas |
| Deudas, emergencia e importaciones | 3 a 4 semanas |

Estimacion total: 12 a 17 semanas. La sincronizacion offline completa es la parte de mayor riesgo y no debe implementarse de forma apresurada.

## 13. Primer incremento a implementar

La primera entrega tecnica sera una vertical segura y pequena:

1. Proyecto Supabase de desarrollo.
2. Registro, verificacion, inicio y cierre de sesion.
3. Tablas `users`, `profiles`, `spaces`, `categories` y `movements`.
4. RLS y autorizacion Fastify.
5. IndexedDB por usuario.
6. Crear y editar un movimiento sin internet.
7. Sincronizarlo al recuperar conexion.
8. Impedir duplicados mediante idempotencia.
9. Limpiar datos locales al cerrar sesion.
10. Pruebas con dos usuarios y dos dispositivos simulados.

No se comenzara el segundo modulo hasta que esta vertical pase las pruebas de aislamiento, offline y sincronizacion.

## 14. Informacion necesaria para comenzar

Para la implementacion sera necesario crear el proyecto Supabase de desarrollo y disponer de:

- URL del proyecto.
- Clave publica o anonima para la PWA.
- Cadena de conexion PostgreSQL para la API y migraciones.
- Configuracion de URL local `http://localhost:5173` para Auth.
- Un correo de prueba para verificar el flujo.

Las claves privadas se guardaran en `.env` y nunca se incluiran en Git, documentacion publica o codigo cliente.
