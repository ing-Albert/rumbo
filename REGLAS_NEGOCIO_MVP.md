# Reglas de negocio y criterios de aceptacion

## 1. Definiciones

- `Registrado`: hecho confirmado manualmente por el usuario.
- `Programado`: ingreso, gasto o aporte futuro que solo afecta proyecciones.
- `Disponible antes de ahorro`: ingresos registrados menos gastos registrados, ajustado por transferencias internas.
- `Ahorro reservado`: aportes registrados a metas activas.
- `Disponible despues de ahorro`: disponible antes de ahorro menos ahorro reservado.
- `Disponible proyectado`: disponible despues de ahorro mas ingresos programados, menos gastos y aportes programados dentro del horizonte.
- `Espacio`: Personal o Negocio.
- `Periodo`: semana, quincena, mes, ano o rango personalizado.

## 2. Espacios y propiedad

### RN-01

Todo movimiento, presupuesto, categoria y meta pertenece a un espacio.

### RN-02

Personal y Negocio se calculan por separado. Solo Vista general puede consolidarlos.

### RN-03

El MVP tiene un unico propietario. No existen colaboradores ni roles.

### RN-04

El backend valida la propiedad en cada lectura y escritura. Ocultar un control en la interfaz no constituye autorizacion.

### Criterios

- Un gasto Personal no cambia el presupuesto de Negocio.
- Solicitar por URL un recurso ajeno no revela importe, descripcion ni existencia.
- Cambiar de espacio conserva el modulo actual y actualiza sus datos.

## 3. Movimientos

### RN-05

Tipos permitidos: ingreso, gasto y aporte. Las transferencias internas se gestionan como una operacion propia enlazada.

### RN-06

Un ingreso o gasto requiere espacio, importe mayor que cero, fecha, categoria y estado.

### RN-07

Los importes admiten como maximo dos decimales y se calculan sin punto flotante binario.

### RN-08

Un movimiento con fecha futura es programado por defecto. Marcarlo registrado requiere confirmacion explicita.

### RN-09

Editar o anular un movimiento recalcula todos los periodos, presupuestos y reportes afectados.

### RN-10

Un movimiento registrado puede anularse, pero no se elimina fisicamente. La interfaz puede llamarlo `Eliminar` y explicar el efecto.

### Criterios

- Registrar ingreso de RD$10,000 aumenta el disponible antes de ahorro exactamente RD$10,000.
- Registrar gasto de RD$1,250.50 lo reduce exactamente RD$1,250.50.
- Se rechazan cero, negativos, texto ambiguo y mas de dos decimales.
- Un gasto programado no cambia el disponible registrado.

## 4. Recurrencias

### RN-11

Frecuencias del MVP: semanal, quincenal, mensual y anual.

### RN-12

Cada ocurrencia puede estar pendiente, realizada, omitida o vencida.

### RN-13

Realizar una ocurrencia genera un unico movimiento registrado. Reintentar no puede duplicarlo.

### RN-14

Una ocurrencia pasada pendiente queda vencida y no se convierte automaticamente en gasto o ingreso registrado.

### RN-15

Si el dia no existe en el mes, se usa el ultimo dia valido. Una recurrencia del dia 31 cae el 28 o 29 de febrero y vuelve al 31 en marzo.

## 5. Disponible

Para un espacio y periodo:

```text
disponible_antes_ahorro =
  ingresos_registrados
  - gastos_registrados
  + transferencias_recibidas
  - transferencias_enviadas

ahorro_reservado = aportes_registrados

disponible_despues_ahorro =
  disponible_antes_ahorro - ahorro_reservado

disponible_proyectado =
  disponible_despues_ahorro
  + ingresos_programados
  - gastos_programados
  - aportes_programados
  + transferencias_programadas_recibidas
  - transferencias_programadas_enviadas
```

### RN-16

El disponible se calcula para el periodo seleccionado; no representa el saldo bancario ni el patrimonio total.

### RN-17

El ahorro reservado reduce lo disponible para gastar, pero no se clasifica como gasto.

### RN-18

Los resultados negativos se muestran como deficit. Nunca se limitan artificialmente a cero.

### RN-19

La proyeccion indica fecha horizonte y diferencia visualmente registrado y programado.

### Escenario verificable

Con ingresos registrados de RD$15,000, gastos registrados de RD$3,000, aporte registrado de RD$2,000, ingreso programado de RD$4,000 y gasto programado de RD$1,500:

- Disponible antes de ahorro: RD$12,000.
- Disponible despues de ahorro: RD$10,000.
- Disponible proyectado: RD$12,500.

## 6. Transferencias internas

### RN-20

Una transferencia requiere espacio de origen distinto al destino, importe, fecha y estado.

### RN-21

La operacion reduce el disponible del origen y aumenta el destino de forma atomica.

### RN-22

No cuenta como ingreso operativo, gasto, ahorro ni consumo de presupuesto consolidado.

### RN-23

En Negocio se etiqueta como aporte o retiro del propietario solo con fines de presentacion.

### RN-24

Editar o anular la transferencia actualiza ambos espacios. Nunca puede quedar un solo efecto guardado.

## 7. Categorias

### RN-25

Cada categoria pertenece a un espacio y naturaleza ingreso o gasto.

### RN-26

No puede haber nombres duplicados dentro del mismo espacio y naturaleza, ignorando mayusculas y espacios laterales.

### RN-27

Una categoria utilizada se archiva en vez de eliminarse. Sigue visible en historicos y deja de aparecer en nuevos formularios.

### RN-28

Un gasto no puede usar una categoria de ingreso ni viceversa.

## 8. Presupuestos

### RN-29

Cada presupuesto pertenece a un espacio y periodo, y contiene limites por categoria de gasto.

### RN-30

Consumo real es la suma de gastos registrados. Consumo comprometido agrega gastos programados dentro del periodo.

### RN-31

Aportes y transferencias internas no consumen presupuesto.

### RN-32

Estados: Sin consumo 0%, Dentro 1-79%, Cerca 80-99%, Limite 100% y Excedido mas de 100%.

### RN-33

Exceder un presupuesto genera advertencia, pero nunca bloquea el gasto.

### RN-34

Copiar un presupuesto copia limites y categorias, no movimientos.

### Escenario verificable

Con limite RD$5,000, gasto registrado RD$4,000 y gasto programado RD$1,500:

- Consumo real: RD$4,000 y 80%.
- Consumo comprometido: RD$5,500 y 110%.
- Estado real: Cerca.
- Estado comprometido: Excedido.

## 9. Metas y aportes

### RN-35

Una meta requiere espacio, nombre y monto objetivo mayor que cero. Fecha y prioridad son opcionales.

### RN-36

Estados: activa, pausada, completada y archivada.

### RN-37

Progreso real es aportes registrados netos dividido entre monto objetivo.

### RN-38

Un aporte programado afecta la proyeccion, no el progreso real.

### RN-39

El progreso puede superar 100%. Se muestra el excedente y se propone completar la meta.

### RN-40

Retirar o anular un aporte recalcula la meta y aumenta el disponible despues del ahorro.

### RN-41

Sin fecha objetivo no se calcula aporte periodico requerido.

### Aporte sugerido

```text
aporte_requerido = (monto_objetivo - aportes_registrados) / periodos_restantes
```

Si el monto restante es menor o igual a cero, no se calcula aporte requerido.

## 10. Fechas y periodos

### RN-42

Zona horaria inicial: `America/Santo_Domingo`.

### RN-43

Semana: lunes a domingo. Quincena: dias 1-15 y 16-ultimo dia. Mes: primer a ultimo dia calendario.

### RN-44

Los rangos incluyen fecha inicial y final; la inicial no puede ser posterior a la final.

### RN-45

Un movimiento pertenece al periodo de su fecha efectiva, no al dia en que fue creado.

## 11. Moneda

### RN-46

La unica moneda del MVP es `DOP`.

### RN-47

Presentacion: `RD$ 1,234.56`. La base de datos almacena centavos enteros.

### RN-48

No existe conversion. Una operacion originalmente extranjera se registra manualmente por su equivalente en DOP.

## 12. Reportes y filtros

### RN-49

Filtros minimos: espacio, periodo, tipo, estado, categoria, meta y texto.

### RN-50

Filtros combinados usan interseccion y pueden limpiarse individualmente o todos juntos.

### RN-51

Todo reporte indica periodo, espacio, moneda, estado de los datos y fecha de actualizacion.

### RN-52

Registrado y proyectado usan estilos diferentes y no se agregan silenciosamente.

### RN-53

Una tasa con denominador cero se muestra `No calculable`.

### RN-54

CSV respeta filtros, usa UTF-8, fechas `AAAA-MM-DD`, importes numericos y columnas de moneda, tipo, estado, categoria y espacio.

### RN-55

Los totales exportados coinciden con el reporte visible para los mismos filtros.

## 13. Offline

### RN-56

Despues de una carga autenticada, se conserva localmente el ultimo resumen necesario para consulta.

### RN-57

Sin conexion, el MVP es de solo lectura. No permite crear, editar, anular ni exportar desde datos que requieran servidor.

### RN-58

La interfaz muestra fecha y hora de la ultima actualizacion y nunca presenta datos locales como actuales sin advertencia.

### RN-59

Cerrar sesion elimina la copia financiera local del dispositivo.

## 14. Escenarios Given/When/Then

```gherkin
Dado un disponible despues de ahorro de RD$10,000
Cuando registro un gasto de RD$1,500 con fecha de hoy
Entonces el nuevo disponible despues de ahorro es RD$8,500
Y el gasto aparece en su categoria y periodo
```

```gherkin
Dado un gasto programado de RD$2,000 para manana
Cuando consulto los datos registrados de hoy
Entonces el disponible despues de ahorro no cambia
Y el disponible proyectado disminuye RD$2,000
```

```gherkin
Dado una meta de RD$20,000 con aportes registrados de RD$5,000
Cuando consulto su detalle
Entonces el progreso es 25%
Y el monto restante es RD$15,000
```

```gherkin
Dado un presupuesto de RD$5,000 con consumo real de RD$5,000
Cuando consulto la categoria
Entonces muestra 100% y estado Limite
Y no muestra Excedido
```

```gherkin
Dado una transferencia de RD$2,000 de Negocio a Personal
Cuando consulto Vista general
Entonces el total combinado no cambia
Y la transferencia no aparece como ingreso ni gasto operativo
```

```gherkin
Dado que estoy sin conexion
Cuando intento registrar un gasto
Entonces la aplicacion no abre un flujo editable
Y explica que necesito conexion
Y mantiene visible el ultimo resumen guardado
```

```gherkin
Dado un usuario autenticado
Cuando solicita un movimiento de otro propietario
Entonces el servidor rechaza la operacion
Y no revela si el movimiento existe
```

## 15. Casos limite obligatorios

- Fecha 29 de febrero solo en ano bisiesto.
- Recurrencia del dia 31 en meses cortos.
- Periodos que cruzan cambio de ano.
- Disponible y proyeccion negativos.
- Categoria archivada con historico.
- Meta completada que pierde progreso por aporte anulado.
- Aporte mayor que el monto restante.
- Presupuesto exactamente en 100%.
- Transferencia anulada sin dejar efecto parcial.
- Confirmacion repetida de una recurrencia sin duplicar.
- Exportacion sin resultados con encabezados y cero filas.
- Acceso por identificador de otro usuario.
- Division por cero en tasas y porcentajes.
