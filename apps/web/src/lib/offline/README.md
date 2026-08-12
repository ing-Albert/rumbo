# Offline sync layer (scope futuro)

`database.ts` define un schema Dexie/IndexedDB completo (`movements`,
`outbox`, `metadata`) pensado para soportar modo offline con una cola de
sincronización: cambios locales se escribirían en `outbox` y se
reenviarían al backend cuando vuelva la conexión.

**Estado actual: no está conectado a ningún flujo real de la app.**

- `offlineDatabase`, `clearOfflineUserData` y `pendingOperationCount` no se
  usan en ningún componente de UI ni en `lib/api.ts`.
- El único punto de integración real es `clearOfflineUserData`, llamado
  desde `features/auth/AuthProvider.tsx` al cerrar sesión, para no dejar
  datos de un usuario en el dispositivo.
- Ningún flujo de movimientos, presupuesto o metas escribe en `outbox` ni
  lee de `movements` local — todo el estado de la app viene de la API vía
  `fetch` directo (ver `hooks/useMonthlyData.ts`, `hooks/useModuleData.ts`).

Conectar el outbox a los flujos reales (crear/editar movimientos offline,
reintentar sync, resolver conflictos) es un proyecto en sí mismo, no
alcance de la limpieza actual. Antes de completarlo, decidir explícitamente
si sigue siendo la dirección deseada o si este código debe removerse.
