# Configuracion de Supabase

## Objetivo

Crear el ambiente de desarrollo para PostgreSQL y autenticacion. Los datos actuales de SQLite son pruebas y no se importaran.

## Datos que necesitara el proyecto

- URL publica del proyecto Supabase.
- Clave publica `anon` o `publishable`.
- Cadena de conexion PostgreSQL con TLS para la API y las migraciones.
- URL local permitida: `http://localhost:5173`.

La clave `service_role` no debe colocarse en la PWA ni compartirse en capturas. Si llega a utilizarse en una tarea administrativa, solo puede existir en el entorno privado de la API.

## Configuracion del panel

1. Crear un proyecto nuevo de desarrollo en Supabase.
2. Elegir una region cercana disponible.
3. En Authentication, habilitar Email y Password.
4. Mantener activa la confirmacion de correo.
5. Configurar Site URL como `http://localhost:5173` durante desarrollo.
6. Agregar `http://localhost:5173/**` a Redirect URLs.
7. Obtener Project URL y clave publica desde API Settings.
8. Obtener la cadena PostgreSQL desde Database / Connect.
9. Aplicar la migracion `supabase/migrations/202608100001_initial_schema.sql`.

## Configuracion local sin publicar secretos

Despues de crear el proyecto, ejecutar en una terminal local:

```bash
npm run setup:supabase
```

El asistente reutiliza Project URL y clave publica si ya existen en `apps/web/.env.local`; despues solicita la cadena PostgreSQL y crea la configuracion privada de la API. Los archivos quedan ignorados por Git. No se debe introducir `service_role`.

Si se guardo por error una conexion Direct, se puede ejecutar el asistente nuevamente para reemplazar solo `DATABASE_URL` por la URI de Session pooler.

Luego la conexion y la migracion se verifican con:

```bash
npm run db:check -w @ahorra/api
npm run db:migrate -w @ahorra/api
npm run db:security -w @ahorra/api
```

## Verificacion prevista

- Crear dos usuarios de prueba.
- Confirmar que cada uno recibe su propio espacio Personal.
- Confirmar que RLS impide leer datos del otro usuario.
- Crear un movimiento offline y sincronizarlo.
- Reintentar la sincronizacion y confirmar que no se duplica.
