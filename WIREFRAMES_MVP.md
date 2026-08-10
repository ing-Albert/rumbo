# Wireframes del MVP

Estos wireframes definen jerarquia y comportamiento, no el acabado visual. La apariencia final seguira `PLAN_DISENO_UX_UI.md`.

## 1. Onboarding movil

```text
+--------------------------------+
| Tu plan              Paso 2/5  |
+--------------------------------+
| Que deseas organizar?          |
|                                |
| +----------------------------+ |
| | [x] Mis finanzas           | |
| | Sueldo, gastos y metas     | |
| +----------------------------+ |
|                                |
| +----------------------------+ |
| | [ ] Mi negocio             | |
| | Ventas, costos y reservas  | |
| +----------------------------+ |
|                                |
| Frecuencia de ingresos         |
| [ Quincenal                v ] |
|                                |
| [Atras]            [Continuar] |
+--------------------------------+
```

## 2. Inicio movil

```text
+--------------------------------+
| [Personal v]       Agosto 2026 |
+--------------------------------+
| Disponible estimado             |
| RD$ 24,850                      |
| Para el resto del mes           |
|                                 |
| Ingresos    Gastos     Ahorro   |
| RD$62,000   RD$30,650  RD$6,500 |
| [Ver como se calculo]           |
+--------------------------------+
| Vas dentro de tu presupuesto    |
| [Revisar categorias]            |
+--------------------------------+
| Ingresos, gastos y ahorro       |
| +-----------------------------+ |
| |     [grafico de columnas]   | |
| +-----------------------------+ |
| [Ver todos los graficos]        |
+--------------------------------+
| Metas                           |
| Fondo de emergencia       42%   |
| [=========-----------]          |
+--------------------------------+
| Inicio Movs. Presup. Metas  Mas |
+--------------------------------+
```

## 3. Inicio escritorio

```text
+--------------------------------------------------------------------------------+
| Marca     [Personal v]                       Agosto 2026        [Agregar]         |
+-----------+--------------------------------------------------------------------+
| Inicio    | Disponible estimado                                             i  |
| Movs.     | RD$ 24,850             Ingresos 62k | Gastos 30.6k | Ahorro 6.5k   |
| Presup.   | [Ver calculo]                  Actualizado hoy, 10:35 a. m.          |
| Metas     +--------------------------------------------------------------------+
| Reportes  | Mensaje prioritario                  [Accion recomendada]            |
| Config.   +--------------------------------------+-----------------------------+
|           | Ingresos, gastos y ahorro           | Gastos por categoria        |
|           | [grafico de columnas]               | [barras horizontales]       |
|           +--------------------------------------+-----------------------------+
|           | Presupuesto por categoria                                         |
|           | Alimentacion  8,000/10,000 [===============-----]  Dentro          |
|           | Transporte    6,200/6,000  [=====================] Excedido         |
|           +--------------------------------------------------------------------+
|           | Metas prioritarias                     | Actividad reciente         |
+--------------------------------------------------------------------------------+
```

## 4. Resumen visual movil

```text
+--------------------------------+
| Graficos                        |
| [Este mes v] [Personal v]       |
| [Registrado + proyectado v]     |
+--------------------------------+
| Evolucion del disponible        |
| +-----------------------------+ |
| | --- proyectado             | |
| | ___ registrado             | |
| |       [grafico de linea]    | |
| +-----------------------------+ |
| [Ver tabla de datos]            |
+--------------------------------+
| Gastos por categoria            |
| Alimentacion       RD$ 8,000    |
| [====================] 32%      |
| Transporte         RD$ 5,200    |
| [=============-------] 21%      |
| [Ver todas]                     |
+--------------------------------+
| Presupuesto y metas             |
| [graficos de progreso]          |
+--------------------------------+
```

## 5. Movimientos escritorio

```text
+--------------------------------------------------------------------------------+
| Movimientos / Personal                                      [Nuevo movimiento] |
+--------------------------------------------------------------------------------+
| [Este mes v] [Todos v] [Categoria v] [Buscar____________] [Mas filtros]         |
| Activos: [Gasto] [Alimentacion]                         [Limpiar]               |
+--------------------------------------------------------------------------------+
| Fecha | Descripcion   | Categoria    | Tipo    | Estado     | Monto | Acciones  |
| 07/08 | Supermercado  | Alimentacion | Gasto   | Registrado | -3250 | ...       |
| 05/08 | Sueldo        | Sueldo       | Ingreso | Registrado | 45000 | ...       |
| 20/08 | Internet      | Servicios    | Gasto   | Programado | -2500 | ...       |
+--------------------------------------------------------------------------------+
| Ingresos RD$45,000 | Gastos RD$3,250 | Neto antes de ahorro RD$41,750           |
+--------------------------------------------------------------------------------+
```

## 6. Formulario de gasto movil

```text
+--------------------------------+
| < Registrar gasto              |
+--------------------------------+
| Espacio                         |
| [Personal v]                    |
|                                 |
| Monto *                         |
| RD$ [3,250.00_______________]   |
|                                 |
| Categoria *                     |
| [Alimentacion v]                |
|                                 |
| Fecha *                         |
| [07/08/2026]                    |
|                                 |
| Estado                          |
| (o) Registrado  ( ) Programado  |
|                                 |
| Descripcion                     |
| [Supermercado_______________]   |
|                                 |
| Impacto                         |
| Disponible: RD$28,100 -> 24,850 |
| Categoria quedara en 80%        |
|                                 |
| [Guardar gasto]                 |
+--------------------------------+
```

El formulario de ingreso reutiliza la estructura y cambia categoria por fuente e impacto de resta por suma.

## 7. Presupuesto movil

```text
+--------------------------------+
| Presupuesto         Agosto 2026 |
+--------------------------------+
| Planificado          RD$ 48,000 |
| Registrado           RD$ 38,500 |
| Comprometido         RD$ 42,000 |
| Restante real         RD$ 9,500 |
+--------------------------------+
| Alimentacion                  > |
| RD$ 8,000 de RD$ 10,000         |
| [================----] 80%      |
| Cerca del limite                |
|                                 |
| Transporte                   > |
| RD$ 6,200 de RD$ 6,000          |
| [=====================] 103%    |
| Excedido por RD$ 200             |
|                                 |
| [Agregar categoria]             |
+--------------------------------+
```

## 8. Metas movil

```text
+--------------------------------+
| Metas                [Nueva]    |
| [Activas] [Completadas] [Pausa] |
+--------------------------------+
| Fondo de emergencia             |
| RD$ 42,000 de RD$ 100,000        |
| [========------------] 42%      |
| Faltan RD$ 58,000                |
| Aporte sugerido RD$ 4,834/mes   |
| [Registrar aporte] [Ver]        |
+--------------------------------+
| Equipo del negocio              |
| RD$ 25,000 de RD$ 80,000         |
| [======--------------] 31%      |
| [Registrar aporte] [Ver]        |
+--------------------------------+
```

## 9. Detalle de meta escritorio

```text
+--------------------------------------------------------------------------------+
| < Metas     Fondo de emergencia                      [Editar] [Pausar]          |
+--------------------------------------------------------------------------------+
| RD$ 42,000 ahorrados de RD$ 100,000                      42%                    |
| [=================-----------------------]                                       |
| Progreso esperado a hoy: 38%               Vas en ritmo                         |
+-----------------------------------------+--------------------------------------+
| Plan                                    | Proximo aporte                       |
| Restante: RD$ 58,000                    | RD$ 4,834                            |
| Fecha objetivo: 31/07/2027              | 31/08/2026                           |
| 12 periodos restantes                   | [Registrar aporte]                   |
+-----------------------------------------+--------------------------------------+
| Historial de aportes                                                           |
| Fecha       Monto        Estado       Nota                                      |
+--------------------------------------------------------------------------------+
```

## 10. Reportes escritorio

```text
+--------------------------------------------------------------------------------+
| Reportes / Resumen                                        [Exportar CSV] [PDF]  |
+--------------------------------------------------------------------------------+
| [Este mes v] [Personal v] [Registrado + proyectado v] [Mas filtros]             |
| Filtros activos: [Agosto] [Personal]                               [Limpiar]    |
+--------------------------------------------------------------------------------+
| Ingresos        Gastos         Ahorro         Disponible despues de ahorro      |
| RD$ 62,000      RD$ 30,650     RD$ 6,500      RD$ 24,850                       |
+--------------------------------------+-----------------------------------------+
| Ingresos, gastos y ahorro           | Gastos por categoria                    |
| [columnas]                           | [barras]                                |
| [Ver tabla]                          | [Ver tabla]                             |
+--------------------------------------+-----------------------------------------+
| Detalle filtrado                                                               |
| Fecha | Descripcion | Categoria | Tipo | Estado | Espacio | Monto               |
+--------------------------------------------------------------------------------+
| Los valores se basan en registros manuales. Actualizado hoy, 10:35 a. m.       |
+--------------------------------------------------------------------------------+
```

## 11. Configuracion movil

```text
+--------------------------------+
| Configuracion                   |
+--------------------------------+
| Perfil                       >  |
| Espacios                     >  |
| Categorias                   >  |
| Moneda y formatos            >  |
| Notificaciones               >  |
| Apariencia                   >  |
| Seguridad y privacidad       >  |
| Datos y exportacion          >  |
+--------------------------------+
| Instalar aplicacion             |
| [Instalar]                      |
+--------------------------------+
| Cerrar sesion                   |
| Eliminar cuenta                 |
+--------------------------------+
```

## 12. Estados comunes

### Sin datos

```text
Todavia no podemos calcular tu disponible.
Registra un ingreso para comenzar.
[Registrar ingreso]
```

### Sin resultados

```text
No encontramos movimientos con estos filtros.
[Limpiar filtros]
```

### Sin conexion

```text
Estas sin conexion.
Estas viendo datos guardados del 07/08/2026 a las 10:35 a. m.
Conectate para registrar o modificar informacion.
```

### Error de guardado

```text
No pudimos guardar el cambio. Tus datos siguen en el formulario.
[Reintentar]
```

## 13. Reglas para el prototipo de alta fidelidad

- Usar la paleta y tipografias definidas en el plan de diseno.
- Probar primero anchos de 360 px, 768 px y 1,440 px.
- Incluir foco, error, carga, vacio y sin conexion.
- Hacer interactivos los flujos de ingreso, gasto, meta y filtros.
- Incluir valores financieros realistas en DOP.
- Probar los graficos con tabla accesible.
- No incluir IA, bancos, facturacion ni funciones deshabilitadas como promesa visual.
