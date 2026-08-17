# Rumbo

PWA de planificacion de ahorro para personas y emprendedores de Republica Dominicana.

## Requisitos

- Node.js 24 o posterior.
- npm 11 o posterior.
- Un proyecto Supabase configurado para autenticacion y PostgreSQL.

La API requiere `SUPABASE_URL` y `DATABASE_URL`. La PWA requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. El asistente `npm run setup:supabase` crea los archivos locales ignorados por Git; consulta `SUPABASE_SETUP.md` para completar la configuracion y las migraciones.

## Comandos

```bash
npm install
npm run setup:supabase
npm run db:migrate -w @ahorra/api
npm run db:security -w @ahorra/api
npm run dev
```

- Web: <http://localhost:5173>
- API: <http://localhost:3001>
- Salud: <http://localhost:3001/health>

```bash
npm test
npm run typecheck
npm run build
```

## Estructura

- `apps/web`: PWA React y Vite.
- `apps/api`: API Fastify autenticada y persistencia PostgreSQL aislada por usuario.
- `packages/domain`: contratos, validaciones y calculos financieros compartidos.
- `android`: envoltorio nativo generado con Capacitor; ver `MOVIL_ANDROID.md`.
- Documentos Markdown: especificacion funcional, UX/UI, reglas y datos.

## App movil

El mismo build de `apps/web` se empaqueta como APK de Android con Capacitor,
contra el mismo backend de produccion. Instrucciones completas en
`MOVIL_ANDROID.md`.

```bash
npm run build:mobile   # bundle web en modo native + cap sync
npm run mobile:open    # abre el proyecto en Android Studio
```

## Primera vertical

La version actual permite:

- Cambiar entre espacio Personal y Negocio.
- Registrar un sueldo u otro ingreso.
- Registrar gastos y movimientos programados.
- Editar ingresos y gastos para corregir o ajustar la planificacion.
- Calcular disponible antes y despues del ahorro.
- Mostrar proyeccion, categorias y actividad reciente.
- Navegar por paginas independientes de Inicio, Movimientos, Presupuesto, Metas, Reportes y Configuracion.
- Definir limites mensuales por categoria.
- Crear metas y registrar aportes que actualizan el disponible.
- Filtrar movimientos y exportar reportes CSV.
- Proteger los datos por cuenta con Supabase Auth, PostgreSQL y RLS.
- Instalar la interfaz como PWA.
