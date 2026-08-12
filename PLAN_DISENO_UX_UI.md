# Plan de diseno UX/UI

## 1. Objetivo del diseno

La aplicacion debe ayudar al usuario a entender, en pocos segundos, cuatro cifras:

1. Cuanto dinero ingreso.
2. Cuanto dinero gasto.
3. Cuanto separo para ahorrar.
4. Cuanto dinero le queda disponible segun sus registros.

La experiencia debe sentirse confiable, humana y facil de aprender. No debe parecer una cuenta bancaria, un sistema contable ni una hoja de calculo complicada.

## 2. Concepto visual

### Cuaderno de rumbo

La direccion visual combina la claridad de un cuaderno de planificacion con la precision de una herramienta financiera. Las superficies se inspiran en papel calido; las cifras usan tinta oscura; la ciruela identifica acciones importantes y el ambar destaca oportunidades o elementos que requieren atencion.

La identidad evitara los recursos genericos de fintech: fondos azul oscuro, tarjetas bancarias flotantes, verdes neon, exceso de degradados y tableros llenos de tarjetas iguales.

### Personalidad

- Confiable, sin parecer institucional.
- Cercana, sin ser infantil.
- Optimista, sin ocultar problemas.
- Precisa con las cifras.
- Respetuosa, sin culpabilizar al usuario.
- Local para Republica Dominicana, sin usar cliches turisticos.

## 3. Paleta de colores

### Colores base

| Token                  | Color     | Uso                                                   |
| ---------------------- | --------- | ----------------------------------------------------- |
| `background`           | `#FFF8F0` | Fondo general tipo papel calido                       |
| `surface`              | `#FFFFFF` | Formularios, tablas y contenido principal             |
| `surface-muted`        | `#F3E8DD` | Bloques secundarios y filtros                         |
| `text-primary`         | `#2B211E` | Titulos, texto y cifras principales                   |
| `text-secondary`       | `#665851` | Etiquetas y texto complementario                      |
| `border`               | `#CFC0B5` | Divisores y bordes de controles                       |
| `brand-primary`        | `#6B2948` | Boton principal, enlaces destacados y seleccion       |
| `brand-primary-active` | `#512037` | Hover y estado presionado                             |
| `brand-secondary`      | `#A94725` | Acentos editoriales y acciones secundarias especiales |
| `accent`               | `#E3A72F` | Oportunidades, hitos y destacados                     |
| `success`              | `#267052` | Meta completada o resultado confirmado                |
| `warning`              | `#9A5700` | Cerca del limite o requiere revision                  |
| `danger`               | `#B3263E` | Error, gasto excedido o accion destructiva            |
| `info`                 | `#6650A4` | Informacion educativa o estimaciones                  |

### Contrastes validados

| Combinacion                            | Relacion aproximada |
| -------------------------------------- | ------------------- |
| Texto blanco sobre ciruela `#6B2948`   | 10.31:1             |
| Texto blanco sobre terracota `#A94725` | 5.81:1              |
| Texto blanco sobre verde `#267052`     | 5.96:1              |
| Texto cacao sobre fondo crema          | 14.89:1             |
| Texto secundario sobre blanco          | 6.82:1              |
| Texto cacao sobre ambar                | 7.34:1              |

No se usara blanco sobre ambar. Ningun estado dependera solamente del color: siempre tendra icono, etiqueta o patron adicional.

### Uso financiero del color

- Los ingresos no seran siempre verdes; se identificaran con signo `+`, texto e icono.
- Los gastos no seran siempre rojos; el rojo se reserva para errores o limites excedidos.
- El disponible positivo usara texto principal, no verde celebratorio.
- Los datos proyectados usaran violeta y linea discontinua.
- Los datos registrados usaran tinta oscura y linea continua.

## 4. Tipografia

### Familias

- Titulos editoriales: `Fraunces`, peso 600.
- Interfaz, formularios y cuerpo: `Atkinson Hyperlegible`, pesos 400, 500 y 700.
- Alternativas del sistema: Georgia para titulos y Arial o sans-serif para interfaz mientras cargan las fuentes.

### Escala

| Estilo          | Escritorio | Movil    | Uso                               |
| --------------- | ---------- | -------- | --------------------------------- |
| Display         | 48/52 px   | 36/40 px | Bienvenida y disponible principal |
| Titulo 1        | 36/42 px   | 30/36 px | Titulo de modulo                  |
| Titulo 2        | 28/34 px   | 24/30 px | Secciones                         |
| Titulo 3        | 20/26 px   | 18/24 px | Tarjetas y paneles                |
| Cuerpo          | 16/24 px   | 16/24 px | Texto general                     |
| Secundario      | 14/20 px   | 14/20 px | Ayudas y metadatos                |
| Cifra principal | 40/44 px   | 32/36 px | Disponible y totales              |

Montos y tablas usaran numeros tabulares para que las cifras queden alineadas. No se mostrara texto operativo menor de 14 px.

## 5. Reticula y espaciado

- Unidad base: 4 px.
- Espaciados principales: 8, 12, 16, 24, 32, 48 y 64 px.
- Radio pequeno: 8 px.
- Radio de controles y tarjetas: 12 px.
- Radio de panel destacado: 16 px.
- Borde habitual: 1 px.
- Objetivos tactiles: minimo 44 x 44 px recomendado.
- Ancho maximo del contenido: 1,440 px.
- Ancho ideal para formularios: 640-760 px.
- Barra lateral de escritorio: 256 px.
- Barra inferior movil: 64-72 px mas area segura.

Las secciones se separaran principalmente con espacio, divisores y fondos suaves. Se evitaran sombras fuertes y tarjetas anidadas.

## 6. Arquitectura de informacion

### Modulos principales

1. Inicio.
2. Movimientos.
3. Presupuesto.
4. Metas.
5. Reportes.
6. Configuracion.

### Contextos financieros

- `Personal`: sueldo, gastos personales, ahorro y metas personales.
- `Negocio`: ventas, gastos operativos, reservas y metas del emprendimiento.
- `Vista general`: resumen combinado sin duplicar transferencias internas.

El contexto activo debe estar visible en todas las pantallas. Al cambiarlo, la aplicacion mantendra el modulo actual y actualizara sus datos.

## 7. Navegacion

### Movil

La barra inferior tendra cinco destinos:

1. Inicio.
2. Movimientos.
3. Presupuesto.
4. Metas.
5. Mas.

`Mas` contendra Reportes, Configuracion, Ayuda y Cerrar sesion.

Un boton visible `Agregar` abrira una hoja inferior con:

- Ingreso.
- Gasto.
- Aporte a meta.
- Meta nueva.

El selector `Personal / Negocio / Vista general` se ubicara en la cabecera y abrira una hoja inferior en movil.

### Escritorio

La barra lateral contendra:

- Identidad del producto.
- Selector de contexto.
- Boton `Agregar`.
- Inicio.
- Movimientos.
- Presupuesto.
- Metas.
- Reportes.
- Configuracion.

Los filtros podran mostrarse en una barra horizontal o panel lateral. Los detalles se abriran en un panel derecho cuando eso permita conservar el contexto de una tabla.

## 8. Pestanas por modulo

### Inicio

- Resumen.
- Graficos.

`Resumen` mostrara las cifras y acciones principales. `Graficos` permitira analizar visualmente el periodo con mas detalle sin entrar al modulo completo de Reportes.

### Movimientos

- Todos.
- Ingresos.
- Gastos.
- Aportes.
- Programados.

### Presupuesto

- Resumen.
- Categorias.
- Historial.

### Metas

- Activas.
- Completadas.
- Pausadas.

### Reportes

- Resumen financiero.
- Ingresos.
- Gastos.
- Flujo y disponible.
- Ahorro.
- Metas.
- Personal vs. Negocio.

### Configuracion

- Perfil.
- Espacios.
- Categorias.
- Moneda y formatos.
- Notificaciones.
- Apariencia.
- Seguridad y privacidad.
- Datos y exportacion.

## 9. Diseno del dashboard

### Jerarquia

El dashboard no sera una cuadricula de tarjetas iguales. El disponible estimado sera el elemento dominante y el resto se organizara como una hoja continua de planificacion.

### Bloque principal

```text
PERSONAL                       Agosto 2026

Disponible estimado
RD$ 24,850
Para el resto del mes

Ingresos       Gastos       Ahorro separado
RD$ 62,000     RD$ 30,650   RD$ 6,500

[ Ver como se calculo ]       Ultima actualizacion: hoy, 10:35 a. m.
```

### Secciones siguientes

1. Alerta prioritaria con una sola accion.
2. Resumen visual con graficos.
3. Presupuesto por categorias.
4. Meta principal y proximos aportes.
5. Proximos ingresos y gastos programados.
6. Actividad reciente.

### Alertas basadas en reglas

- `Vas dentro de tu presupuesto`.
- `Transporte esta RD$ 1,250 por encima de lo planificado`.
- `Te faltan RD$ 2,000 para completar el aporte de este mes`.
- `Tienes tres gastos sin categoria`.

El MVP usara reglas transparentes, no IA, para generar estos mensajes.

### Resumen visual con graficos

La pestana `Inicio > Graficos` y una version abreviada dentro de `Inicio > Resumen` mostraran:

#### Ingresos, gastos y ahorro

- Grafico de columnas agrupadas por semana, quincena o mes.
- Serie para ingresos, gastos y ahorro realizado.
- Selector de periodo visible.
- Comparacion con el periodo anterior.
- Montos exactos al tocar, enfocar o pasar el cursor.

Responde: `Cuanto entro, cuanto salio y cuanto logre ahorrar`.

#### Evolucion del disponible

- Grafico de linea temporal.
- Linea continua para movimientos registrados.
- Linea discontinua para ingresos y gastos programados.
- Marcador de `Hoy`.
- Zona de advertencia cuando el disponible proyectado sea menor que cero.

Responde: `Como ha cambiado lo que me queda y si podria faltarme dinero`.

#### Gastos por categoria

- Barras horizontales ordenadas de mayor a menor.
- Maximo cinco categorias visibles y una opcion `Ver todas`.
- Monto, porcentaje y variacion frente al periodo anterior.
- Al seleccionar una barra se abrira la lista de movimientos filtrada.

Responde: `En que estoy gastando mas`.

En pantallas amplias se puede ofrecer una dona como vista alternativa, limitada a cinco categorias mas `Otras`. Las barras seran la vista predeterminada por ser mas faciles de comparar.

#### Presupuesto frente a gasto

- Barras de progreso por categoria.
- Marcador del monto presupuestado.
- Estado textual `Dentro`, `Cerca del limite` o `Excedido`.
- Proyeccion de cierre identificada como estimacion.

Responde: `Que categorias estan consumiendo el presupuesto`.

#### Progreso de metas

- Barras de progreso para un maximo de tres metas prioritarias.
- Progreso real y marcador del progreso esperado para la fecha.
- Monto restante y proximo aporte.
- Enlace `Ver todas las metas`.

Responde: `Que tan cerca estoy de mis objetivos`.

#### Distribucion Personal y Negocio

- Columnas agrupadas para ingresos y gastos de cada espacio.
- Flujo neto visible en RD$.
- Transferencias internas excluidas de los totales consolidados.
- Solo aparecera para perfiles Mixto o Emprendedor con ambos espacios configurados.

Responde: `Que parte de mi dinero pertenece a cada espacio`.

### Filtros del resumen visual

- Esta semana.
- Esta quincena.
- Este mes.
- Mes anterior.
- Este ano.
- Rango personalizado.
- Personal, Negocio o Vista general.
- Solo registrado, solo proyectado o ambos.

Los filtros se aplicaran a todos los graficos del resumen. Cada grafico mostrara claramente cuando usa un filtro diferente.

### Distribucion responsive

En movil los graficos se mostraran en una sola columna, con altura reducida y desplazamiento horizontal solo cuando sea indispensable. El orden sera Disponible, Ingresos/Gastos/Ahorro, Categorias, Presupuesto y Metas.

En escritorio se usara una reticula asimetrica:

```text
+----------------------------------+-----------------------+
| Evolucion del disponible         | Gastos por categoria  |
|                                  |                       |
+----------------------+-----------+-----------------------+
| Ingresos/Gastos      | Presupuesto por categorias       |
+----------------------+-----------------------------------+
| Progreso de metas                                        |
+----------------------------------------------------------+
```

### Estados de los graficos

- Sin datos: explicar que informacion falta y ofrecer registrarla.
- Datos insuficientes: mostrar valores disponibles sin inventar tendencia.
- Periodo incompleto: indicar `Datos hasta el dia X`.
- Cargando: usar un skeleton con la forma del grafico.
- Error: conservar las cifras resumen y ofrecer reintentar el grafico.
- Offline: mostrar la fecha de los ultimos datos guardados.

Todos los graficos tendran titulo, pregunta que responden, leyenda, valores exactos, alternativa tabular y descripcion accesible. No dependeran del color y permitiran navegacion por teclado.

## 10. Pantallas y flujos

### Onboarding

1. Bienvenida y explicacion de valor.
2. Elegir perfil Personal, Emprendedor o Mixto.
3. Elegir frecuencia semanal, quincenal, mensual o variable.
4. Registrar primer sueldo o ingreso.
5. Registrar gastos principales.
6. Mostrar el primer disponible estimado.
7. Ofrecer crear una meta o ir al inicio.

El usuario podra omitir datos no esenciales. No se exigira crear un presupuesto completo durante el onboarding.

### Registrar ingreso

1. Introducir monto.
2. Escribir descripcion o elegir fuente.
3. Seleccionar fecha y contexto.
4. Elegir si es registrado o esperado.
5. Definir recurrencia opcional.
6. Mostrar el impacto en el disponible.
7. Guardar y mostrar el nuevo disponible.

### Registrar gasto

1. Introducir monto.
2. Escribir descripcion.
3. Seleccionar categoria.
4. Seleccionar fecha y contexto.
5. Clasificar como necesario, compromiso o discrecional de forma opcional.
6. Elegir si es registrado o programado.
7. Mostrar `Tu disponible estimado bajara a RD$ X`.
8. Guardar.

### Crear meta

1. Nombrar la meta.
2. Introducir monto objetivo.
3. Introducir saldo inicial opcional.
4. Elegir fecha objetivo.
5. Elegir frecuencia de aportes.
6. Mostrar aporte recomendado y formula.
7. Ajustar monto, fecha o aporte.
8. Guardar y ofrecer registrar el primer aporte.

### Editar o eliminar

- Mostrar el efecto financiero antes de confirmar.
- Mantener los datos introducidos si ocurre un error.
- Ofrecer `Deshacer` despues de eliminar un movimiento.
- Archivar categorias y espacios con datos, en lugar de borrarlos directamente.

## 11. Diseno de movimientos

### Lista movil

Cada fila mostrara:

- Categoria e icono.
- Descripcion.
- Fecha.
- Contexto.
- Estado registrado o programado.
- Monto con signo.

Los movimientos se agruparan por fecha y mostraran subtotal diario cuando sea util.

### Tabla de escritorio

| Columna     | Comportamiento                         |
| ----------- | -------------------------------------- |
| Fecha       | Ordenable                              |
| Descripcion | Busqueda y acceso al detalle           |
| Categoria   | Filtrable                              |
| Tipo        | Ingreso, gasto, aporte o transferencia |
| Contexto    | Personal o Negocio                     |
| Estado      | Registrado o programado                |
| Monto       | Alineado a la derecha                  |
| Acciones    | Editar, duplicar o eliminar            |

## 12. Diseno del presupuesto

### Resumen

- Ingreso planificado.
- Presupuesto total.
- Gastado.
- Restante.
- Dias restantes.
- Categorias cerca del limite o excedidas.

### Categoria presupuestaria

Cada fila mostrara:

- Categoria.
- Gastado y presupuestado.
- Barra de progreso.
- Diferencia en RD$.
- Estado textual `Dentro`, `Cerca del limite` o `Excedido`.
- Accion `Ver movimientos`.

El usuario podra crear el presupuesto desde cero o copiar el periodo anterior. Superar una categoria nunca bloqueara el registro de un gasto.

## 13. Diseno de metas

### Tarjeta de meta

- Nombre.
- Monto acumulado y objetivo.
- Porcentaje completado.
- Monto restante.
- Fecha objetivo.
- Aporte sugerido.
- Estado `Adelantada`, `En ritmo`, `Con retraso`, `Pausada` o `Completada`.

### Detalle

- Progreso real y progreso esperado.
- Formula del aporte requerido.
- Historial de aportes.
- Proximos aportes.
- Proyeccion prudente de fecha.
- Acciones Editar, Pausar y Completar.

Una fecha proyectada se mostrara como posibilidad: `A este ritmo, podrias completar la meta aproximadamente en...`.

## 14. Sistema de filtros

### Filtros globales

- Periodo.
- Contexto Personal, Negocio o Vista general.
- Estado registrado, programado o ambos.
- Categoria.
- Tipo de movimiento.
- Rango de monto.
- Busqueda por descripcion, categoria o nota.

### Atajos de periodo

- Esta semana.
- Esta quincena.
- Este mes.
- Mes anterior.
- Este trimestre.
- Este ano.
- Rango personalizado.

### Filtros para gastos

- Categoria y subcategoria.
- Comercio o proveedor.
- Fijo o variable.
- Necesario, compromiso o discrecional.
- Recurrente o puntual.
- Registrado o programado.

### Filtros para ingresos

- Fuente o pagador.
- Fijo o variable.
- Recurrente o puntual.
- Registrado o esperado.

### Filtros para metas

- Estado.
- Prioridad.
- Contexto.
- Fecha objetivo.
- Categoria de meta.

### Comportamiento

- En movil se abriran en una hoja inferior.
- En escritorio usaran una barra desplegable o panel lateral.
- Los filtros activos se mostraran como chips removibles.
- Siempre existira `Limpiar filtros`.
- Se conservaran al entrar y salir de un detalle.
- El periodo y contexto activos nunca quedaran ocultos.
- Un resultado vacio explicara los filtros que lo causaron.

## 15. Consultas y busqueda

### Busqueda rapida

La busqueda encontrara coincidencias en:

- Descripcion.
- Categoria.
- Comercio o proveedor.
- Fuente de ingreso.
- Notas.

### Consultas guardadas posteriores al MVP

- Mis gastos fijos del mes.
- Gastos discrecionales mayores de RD$ X.
- Ingresos esperados pendientes.
- Movimientos sin categoria.
- Gastos del negocio pagados con dinero personal.
- Metas con retraso.

El MVP puede mostrar accesos rapidos predefinidos. Guardar filtros personalizados se implementara despues de validar su uso.

## 16. Reportes del MVP

Cada reporte mostrara titulo, periodo, contexto, fecha de actualizacion, resumen narrativo, indicadores, grafico, tabla equivalente, filtros y exportacion.

### Resumen financiero

Responde: `Cuanto ingrese, gaste, ahorre y cuanto queda`.

Indicadores:

- Ingresos registrados.
- Gastos registrados.
- Ahorro registrado.
- Disponible operativo.
- Disponible despues del ahorro.
- Disponible proyectado.
- Tasa de ahorro.

Visualizaciones:

- Columnas agrupadas de ingresos, gastos y ahorro por periodo.
- Barras para Personal y Negocio.
- Tabla con los valores exactos.

### Reporte de ingresos

Responde: `De donde viene mi dinero y como cambia`.

Columnas:

- Fecha.
- Descripcion.
- Fuente.
- Categoria.
- Contexto.
- Estado.
- Recurrencia.
- Monto.

Visualizaciones:

- Columnas por semana, quincena o mes.
- Barras horizontales por fuente.
- Registrado frente a esperado.

### Reporte de gastos

Responde: `En que estoy gastando y que categoria consume mas`.

Columnas:

- Fecha.
- Descripcion.
- Comercio o proveedor.
- Categoria.
- Contexto.
- Tipo fijo o variable.
- Clasificacion necesaria o discrecional.
- Estado.
- Monto.

Visualizaciones:

- Barras horizontales ordenadas por categoria.
- Tendencia por periodo.
- Presupuestado frente a registrado.
- Dona opcional con maximo cinco categorias y `Otras`.

### Flujo y disponible

Responde: `Cuanto queda y en que fecha podria faltar dinero`.

Columnas:

- Periodo.
- Saldo inicial declarado.
- Ingresos registrados y esperados.
- Gastos registrados y programados.
- Ahorro registrado y planificado.
- Disponible calculado.

Visualizaciones:

- Cascada de ingresos, gastos, ahorro y disponible.
- Linea temporal del disponible acumulado.
- Linea continua para registrado y discontinua para proyectado.

Advertencia visible:

> El disponible es una estimacion basada en movimientos registrados manualmente. Puede no coincidir con el saldo de tus cuentas.

### Reporte de ahorro

Responde: `Cuanto estoy ahorrando y si cumplo el plan`.

Indicadores:

- Ahorro del periodo.
- Tasa de ahorro.
- Ahorro planificado frente a realizado.
- Ahorro asignado y sin asignar.

Visualizaciones:

- Columnas de ahorro por periodo.
- Linea de tasa de ahorro.
- Barras por meta.

### Reporte de metas

Responde: `Que meta avanza bien y cual necesita ajuste`.

Columnas:

- Meta.
- Monto objetivo.
- Acumulado.
- Restante.
- Progreso.
- Fecha objetivo.
- Aporte previsto.
- Aporte requerido actualizado.
- Estado.

### Personal frente a Negocio

Responde: `Que dinero corresponde a cada espacio y si se estan mezclando`.

Indicadores:

- Ingresos.
- Gastos.
- Ahorro.
- Flujo neto.
- Transferencias internas.

Las transferencias internas se mostraran en detalle, pero se excluiran de los totales consolidados para evitar doble conteo.

## 17. Reglas de visualizacion financiera

- No mezclar cifras registradas y proyectadas sin estilos distintos.
- No mostrar porcentajes sin sus montos base.
- Si el denominador es cero, mostrar `No calculable`, no `0 %`.
- Comparar periodos de igual duracion.
- Identificar periodos incompletos.
- No truncar ejes para exagerar diferencias.
- No usar graficos circulares para comparar ingresos contra gastos.
- Limitar las donas a cinco categorias mas `Otras`.
- Ofrecer tabla de datos para todos los graficos.
- Mostrar moneda, contexto y periodo en reportes y exportaciones.
- No llamar utilidad fiscal al flujo neto del negocio.
- Diferenciar disponible, ahorro realizado y aporte planificado.

## 18. Exportaciones

### CSV

- Exportara el detalle filtrado.
- Tendra columnas separadas para monto y moneda.
- Indicara si el registro es real o estimado.
- Usara codificacion compatible con Excel.
- Nombre sugerido: `gastos_personal_2026-08.csv`.

### PDF

- Titulo del reporte.
- Periodo y contexto.
- Fecha de generacion.
- Filtros aplicados.
- Indicadores y graficos.
- Tabla resumida.
- Aviso sobre datos manuales.

Las notas sensibles no se incluiran por defecto.

## 19. Componentes del sistema de diseno

- Botones primario, secundario, discreto y destructivo.
- Campo de texto.
- Campo monetario con `RD$`.
- Selector de fecha y periodo.
- Selector de contexto.
- Selector segmentado.
- Pestanas.
- Chips de filtro.
- Barra de progreso.
- Barra de presupuesto.
- Indicador de estado con texto e icono.
- Tarjeta de meta.
- Fila de movimiento.
- Tabla responsive.
- Panel de detalle.
- Alerta contextual.
- Banner informativo.
- Hoja inferior.
- Modal de confirmacion.
- Toast con accion Deshacer.
- Skeleton de carga.
- Estado vacio.
- Ayuda contextual de formulas.
- Grafico con tabla accesible.

Todos tendran estados normal, hover, foco visible, presionado, deshabilitado, cargando, error y exito.

## 20. Formularios

- Una columna en movil y maximo dos en escritorio.
- Etiquetas visibles encima de los campos.
- Datos opcionales marcados con `Opcional`.
- Monto como primer campo en ingresos y gastos.
- Formato visible `RD$ 12,500` sin perder el valor escrito.
- Mensajes especificos junto al campo.
- Resumen de errores en formularios largos.
- Boton principal unico y claramente identificado.
- Aviso al salir con cambios sin guardar.
- Confirmacion del impacto antes de guardar cambios importantes.

Ejemplos de validacion:

- `Introduce un monto mayor que cero`.
- `La fecha objetivo debe ser posterior a hoy`.
- `Ya existe una categoria con este nombre`.

## 21. Estados de interfaz

### Sin datos

> Todavia no podemos calcular tu disponible.

Acciones: Registrar ingreso, agregar gasto o crear meta, segun corresponda.

### Filtros sin resultados

> No encontramos movimientos con estos filtros.

Accion: Limpiar filtros.

### Carga

Se usaran skeletons con la forma del contenido. La navegacion permanecera visible.

### Error recuperable

> No pudimos cargar tus movimientos. Tu informacion no se ha perdido.

Acciones: Reintentar o consultar datos guardados.

### Error de guardado

El formulario conservara toda la informacion introducida.

### Sin conexion

Un banner indicara que los datos visibles pueden estar desactualizados. En el MVP, el modo sin conexion sera de solo lectura; los formularios explicaran que se necesita conexion antes de permitir guardar.

### Exito

> Gasto registrado. Disponible estimado: RD$ 18,350.

## 22. Responsive y PWA

- Diseno funcional desde 320 px de ancho.
- Navegacion inferior en movil y lateral en escritorio.
- Listas en movil y tablas en escritorio.
- Filtros en hoja inferior en movil y panel en escritorio.
- Formularios de una columna en movil.
- Graficos simplificados y desplazables sin ocultar datos.
- Areas seguras para dispositivos con notch.
- Instalacion sugerida despues de completar una accion de valor.
- Ultimo dashboard disponible sin conexion.
- Indicador de ultima sincronizacion.
- Actualizaciones de la PWA sin interrumpir formularios activos.

## 23. Accesibilidad

El objetivo es WCAG 2.2 nivel AA.

- Contraste minimo 4.5:1 para texto normal.
- Contraste minimo 3:1 para texto grande y componentes.
- Navegacion completa por teclado.
- Foco visible y no cubierto por barras fijas.
- Enlace `Saltar al contenido`.
- Nombres accesibles para iconos.
- Errores asociados al campo correspondiente.
- Alternativa tabular para graficos.
- Reflow correcto con zoom de 200 %.
- Lectura correcta por lector de pantalla.
- Cierre de modales con Escape y retorno del foco.
- Respeto de la preferencia de movimiento reducido.
- No depender del color, arrastre o gestos complejos.

## 24. Preparacion para IA futura

La IA no tendra una pestana vacia en el MVP. En el futuro aparecera como accion contextual `Analizar mi planificacion` dentro de Inicio y Reportes.

Cada recomendacion incluira:

- Hallazgo.
- Datos utilizados.
- Periodo analizado.
- Impacto estimado.
- Nivel de confianza.
- Accion sugerida.
- Enlace a los movimientos relacionados.

Ejemplo:

> Tus gastos en comida a domicilio fueron RD$ 3,200 mayores que tu promedio reciente. Si vuelves a ese promedio, podrias destinar aproximadamente RD$ 3,200 a tu fondo de emergencia.

La IA nunca cambiara presupuestos, eliminara gastos o movera aportes sin confirmacion. Tampoco decidira que un gasto es innecesario sin contexto del usuario.

## 25. Entregables de diseno

1. Mapa de navegacion.
2. Flujos de onboarding, ingreso, gasto, meta y aporte.
3. Wireframes de baja fidelidad para movil y escritorio.
4. Prototipo navegable de alta fidelidad.
5. Tokens visuales y libreria de componentes.
6. Especificacion responsive.
7. Estados vacios, carga, error, offline y exito.
8. Prototipos de reportes y filtros.
9. Pruebas de accesibilidad y contraste.
10. Prueba de usabilidad con personas y emprendedores dominicanos.

## 26. Orden recomendado de diseno

1. Onboarding.
2. Dashboard.
3. Registro de ingreso y gasto.
4. Lista y detalle de movimientos.
5. Creacion y detalle de meta.
6. Presupuesto por categoria.
7. Reportes y filtros.
8. Configuracion y privacidad.
9. Estados de sistema y experiencia offline.
10. Prototipo completo y prueba con usuarios.

## 27. Criterios de validacion UX

- El usuario identifica su disponible estimado en menos de cinco segundos.
- El usuario entiende por que no equivale al saldo bancario.
- Registrar un gasto habitual tarda menos de 30 segundos.
- Crear una meta y comprender el aporte sugerido tarda menos de tres minutos.
- Al menos 80 % distingue datos registrados de proyectados en pruebas.
- Al menos 80 % encuentra un gasto mediante filtros sin ayuda.
- Al menos 70 % interpreta correctamente un reporte basico.
- Todos los flujos criticos funcionan con teclado y lector de pantalla.
