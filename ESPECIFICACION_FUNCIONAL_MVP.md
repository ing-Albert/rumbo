# Especificacion funcional del MVP

## 1. Proposito

Este documento define como debe comportarse la primera version de la PWA. Complementa `PLAN_PROYECTO.md` y `PLAN_DISENO_UX_UI.md` y evita decisiones ambiguas durante el desarrollo.

## 2. Alcance confirmado

- Registro y acceso de un unico propietario.
- Perfiles Personal, Emprendedor o Mixto.
- Espacios financieros `Personal` y `Negocio`.
- Sueldos e ingresos fijos, variables o extraordinarios.
- Gastos registrados y programados.
- Disponible estimado del periodo.
- Presupuesto por categoria.
- Metas y aportes manuales.
- Transferencias internas Personal/Negocio sin doble conteo.
- Dashboard con resumen y graficos.
- Reportes y exportacion CSV; PDF como complemento.
- PWA responsive e instalable.
- Ultimo resumen disponible sin conexion en modo de solo lectura.

No incluye banca, pagos, custodia, contabilidad formal, facturacion, IA, multiples usuarios, roles ni monedas diferentes de DOP.

## 3. Mapa de navegacion

```text
Publico
|-- Bienvenida
|-- Crear cuenta
|-- Iniciar sesion
`-- Recuperar acceso

Onboarding
|-- Elegir perfil
|-- Configurar espacios
|-- Registrar primer ingreso
|-- Registrar gastos principales
`-- Ver primer disponible

Aplicacion
|-- Inicio
|   |-- Resumen
|   `-- Graficos
|-- Movimientos
|   |-- Todos
|   |-- Ingresos
|   |-- Gastos
|   |-- Aportes
|   `-- Programados
|-- Presupuesto
|   |-- Resumen
|   |-- Categorias
|   `-- Historial
|-- Metas
|   |-- Activas
|   |-- Completadas
|   `-- Pausadas
|-- Reportes
|   |-- Resumen financiero
|   |-- Ingresos
|   |-- Gastos
|   |-- Flujo y disponible
|   |-- Ahorro
|   |-- Metas
|   `-- Personal vs. Negocio
`-- Configuracion
    |-- Perfil
    |-- Espacios
    |-- Categorias
    |-- Moneda y formatos
    |-- Notificaciones
    |-- Apariencia
    |-- Seguridad y privacidad
    `-- Datos y exportacion
```

## 4. Rutas propuestas

| Ruta                      | Pantalla                 | Acceso                     |
| ------------------------- | ------------------------ | -------------------------- |
| `/`                       | Bienvenida o redireccion | Publico                    |
| `/registro`               | Crear cuenta             | Publico                    |
| `/acceso`                 | Iniciar sesion           | Publico                    |
| `/recuperar`              | Recuperar acceso         | Publico                    |
| `/onboarding`             | Configuracion inicial    | Autenticado sin onboarding |
| `/inicio`                 | Resumen                  | Autenticado                |
| `/inicio/graficos`        | Resumen visual           | Autenticado                |
| `/movimientos`            | Lista de movimientos     | Autenticado                |
| `/movimientos/nuevo`      | Crear movimiento         | Autenticado                |
| `/movimientos/:id`        | Detalle                  | Propietario del espacio    |
| `/movimientos/:id/editar` | Editar                   | Propietario del espacio    |
| `/presupuesto`            | Presupuesto del periodo  | Autenticado                |
| `/metas`                  | Lista de metas           | Autenticado                |
| `/metas/nueva`            | Crear meta               | Autenticado                |
| `/metas/:id`              | Detalle de meta          | Propietario del espacio    |
| `/metas/:id/aporte`       | Registrar aporte         | Propietario del espacio    |
| `/reportes`               | Reportes                 | Autenticado                |
| `/configuracion`          | Configuracion            | Autenticado                |
| `/configuracion/:seccion` | Seccion especifica       | Autenticado                |

El espacio activo se mantiene como estado de sesion y no se expone como permiso confiable del cliente. El backend valida siempre que cada recurso pertenece al usuario.

## 5. Navegacion responsive

### Movil

- Barra inferior: Inicio, Movimientos, Presupuesto, Metas y Mas.
- Boton `Agregar` visible sobre la barra.
- `Mas`: Reportes, Configuracion y Ayuda.
- Selector de espacio en la cabecera.
- Formularios como paginas completas.
- Filtros en hoja inferior.

### Escritorio

- Barra lateral persistente de 256 px.
- Selector de espacio en la parte superior.
- Boton `Agregar` destacado.
- Formularios simples en panel derecho y formularios complejos como pagina.
- Tablas para movimientos y reportes detallados.

## 6. Contextos

### Personal

Contiene sueldo, otros ingresos, gastos personales, presupuesto, metas y aportes personales.

### Negocio

Contiene ventas o servicios, gastos operativos, presupuesto, reservas y metas del emprendimiento. No produce estados contables ni fiscales.

### Vista general

Solo resume. No permite crear un movimiento sin elegir antes Personal o Negocio. Excluye transferencias internas de ingresos y gastos consolidados.

## 7. Flujos criticos

### Crear cuenta y completar onboarding

1. Introducir nombre, correo y metodo de acceso.
2. Aceptar terminos y confirmar lectura de privacidad.
3. Elegir Personal, Emprendedor o Mixto.
4. Crear los espacios correspondientes.
5. Elegir frecuencia principal: semanal, quincenal, mensual o variable.
6. Registrar el primer sueldo o ingreso; se puede omitir.
7. Registrar gastos principales; se puede omitir.
8. Mostrar el primer disponible estimado cuando existan datos suficientes.
9. Ofrecer crear una meta o ir al Inicio.

### Registrar ingreso

1. Elegir espacio.
2. Introducir monto.
3. Seleccionar fuente o categoria.
4. Elegir fecha.
5. Marcar como registrado o esperado.
6. Configurar recurrencia opcional.
7. Mostrar impacto sobre el disponible.
8. Guardar y actualizar resumen, graficos y reportes.

### Registrar gasto

1. Elegir espacio.
2. Introducir monto.
3. Seleccionar categoria.
4. Elegir fecha.
5. Marcar como registrado o programado.
6. Clasificar opcionalmente como necesario, compromiso o discrecional.
7. Mostrar impacto sobre disponible y presupuesto.
8. Advertir sin bloquear si excede una categoria.
9. Guardar y ofrecer `Deshacer`.

### Crear presupuesto

1. Elegir espacio y periodo.
2. Crear desde cero o copiar el periodo anterior.
3. Asignar limites por categoria.
4. Mostrar total presupuestado y capacidad estimada.
5. Advertir si el presupuesto supera los ingresos planificados.
6. Guardar y mostrar consumo registrado y comprometido.

### Crear meta

1. Introducir nombre y monto objetivo.
2. Anadir saldo inicial opcional como primer aporte.
3. Elegir fecha objetivo y frecuencia.
4. Calcular aporte sugerido.
5. Permitir ajustar monto, fecha o aporte.
6. Guardar y ofrecer registrar un aporte.

### Registrar aporte

1. Abrir una meta activa.
2. Introducir monto y fecha.
3. Marcar como realizado o planificado.
4. Mostrar nuevo progreso y disponible despues del ahorro.
5. Confirmar.
6. Proponer completar la meta si alcanza el objetivo.

### Transferir entre Personal y Negocio

1. Elegir espacio de origen y destino.
2. Introducir monto, fecha y motivo opcional.
3. Mostrar la reduccion en origen y aumento en destino.
4. Confirmar una sola operacion enlazada.
5. Excluirla de ingresos, gastos y presupuesto consolidados.

### Consultar reporte

1. Elegir reporte.
2. Seleccionar periodo y espacio.
3. Aplicar filtros adicionales.
4. Revisar resumen, grafico y tabla.
5. Abrir movimientos relacionados desde el grafico o tabla.
6. Exportar respetando los filtros activos.

## 8. Estados globales

| Estado            | Comportamiento                                       |
| ----------------- | ---------------------------------------------------- |
| Cargando          | Skeleton que conserva la estructura                  |
| Sin datos         | Explicacion y una accion principal                   |
| Sin resultados    | Filtros visibles y accion Limpiar                    |
| Error recuperable | Mensaje contextual y Reintentar                      |
| Sin conexion      | Ultimos datos en modo de solo lectura                |
| Sesion vencida    | Solicitar acceso sin perder el destino de navegacion |
| Acceso denegado   | No revelar existencia ni contenido del recurso       |
| Actualizacion PWA | Aviso no bloqueante fuera de formularios             |
| Exito             | Confirmacion especifica con resultado actualizado    |

## 9. Categorias iniciales

### Ingresos personales

- Sueldo.
- Trabajo independiente.
- Remesas.
- Ventas.
- Bonificaciones.
- Otros ingresos.

### Gastos personales

- Vivienda.
- Alimentacion.
- Transporte.
- Servicios.
- Salud.
- Educacion.
- Deudas.
- Entretenimiento.
- Familia.
- Imprevistos.
- Otros gastos.

### Ingresos del negocio

- Ventas.
- Servicios.
- Cobros.
- Aporte del propietario.
- Otros ingresos.

### Gastos del negocio

- Inventario.
- Materia prima.
- Local.
- Servicios.
- Transporte y entregas.
- Nomina.
- Mercadeo.
- Impuestos y tasas.
- Equipos.
- Mantenimiento.
- Otros gastos.

Las categorias se pueden crear, renombrar y archivar. Una categoria utilizada no se elimina porque debe conservar el historial.

## 10. Criterios de salida funcional

- El usuario puede completar el flujo sueldo -> gasto -> disponible -> meta -> aporte.
- Los cambios actualizan resumen, graficos, presupuesto y reportes de forma consistente.
- Personal y Negocio permanecen aislados salvo en Vista general.
- Las transferencias internas no duplican resultados.
- Cada resultado indica periodo, espacio y si es registrado o proyectado.
- Las funciones financieras no dependen de IA.
- Las rutas privadas rechazan acceso de otro usuario desde servidor.
- El ultimo resumen puede consultarse sin conexion sin permitir cambios.
