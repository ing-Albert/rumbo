# Diccionario de datos del MVP

## 1. Convenciones

### Identificadores

- UUID generado antes de persistir para facilitar PWA y futuras sincronizaciones.
- Nunca se reutiliza un identificador.

### Dinero

- Todos los importes se guardan como enteros de 64 bits en centavos.
- `100` representa RD$1.00.
- Moneda fija del MVP: `DOP`.
- No se usa punto flotante.

### Fechas

- Fechas financieras: fecha civil `AAAA-MM-DD` sin hora.
- Auditoria y sesiones: timestamp UTC.
- Zona de presentacion inicial: `America/Santo_Domingo`.

### Ciclo de vida

- `creado_en` y `actualizado_en` en entidades editables.
- `archivado_en` para entidades historicas que dejan de usarse.
- `anulado_en` para movimientos que dejan de afectar calculos.
- No se eliminan fisicamente movimientos registrados ni auditoria.

## 2. Relaciones

```text
Usuario 1 --- 1 Perfil
Usuario 1 --- N Espacio

Espacio 1 --- N Categoria
Espacio 1 --- N Movimiento
Espacio 1 --- N Presupuesto
Espacio 1 --- N Meta
Espacio 1 --- N ReglaRecurrente

Presupuesto 1 --- N LimitePresupuesto
Categoria 1 --- N LimitePresupuesto

Meta 1 --- N Aporte
Movimiento 1 --- 0..1 Aporte

TransferenciaInterna N --- 1 Espacio origen
TransferenciaInterna N --- 1 Espacio destino

ReglaRecurrente 1 --- N OcurrenciaProgramada

Usuario 1 --- N EventoAuditoria
```

## 3. Usuario

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico e inmutable |
| `email` | Correo normalizado | Si | Unico entre usuarios activos |
| `estado` | Enum | Si | ACTIVO, BLOQUEADO, DESACTIVADO |
| `email_verificado_en` | Timestamp | No | Nulo hasta confirmar |
| `ultimo_acceso_en` | Timestamp | No | Ultimo acceso valido |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `eliminado_en` | Timestamp | No | Eliminacion logica |

La autenticacion, contrasenas, passkeys y recuperacion pertenecen al proveedor de identidad, no al dominio financiero.

## 4. Perfil

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `usuario_id` | UUID | Si | Un perfil por usuario |
| `nombre_mostrado` | Texto 1-100 | Si | Nombre de interfaz |
| `tipo_perfil` | Enum | Si | PERSONAL, EMPRENDEDOR, MIXTO |
| `zona_horaria` | IANA timezone | Si | America/Santo_Domingo inicial |
| `idioma` | Codigo | Si | es-DO inicial |
| `formato_fecha` | Enum | Si | DD/MM/AAAA inicial |
| `onboarding_completo` | Booleano | Si | Control de acceso al MVP |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |

Constraint: `usuario_id` unico.

## 5. Espacio

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `usuario_id` | UUID | Si | Propietario unico |
| `tipo` | Enum | Si | PERSONAL o NEGOCIO |
| `nombre` | Texto 1-100 | Si | Personal o nombre del negocio |
| `moneda` | ISO 4217 | Si | DOP en MVP |
| `estado` | Enum | Si | ACTIVO o ARCHIVADO |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `archivado_en` | Timestamp | No | Requerido al archivar |

Indices: `(usuario_id, estado)` y unicidad de `(usuario_id, nombre_normalizado)` entre activos.

## 6. Categoria

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `espacio_id` | UUID | Si | Propietario financiero |
| `nombre` | Texto 1-80 | Si | Unico normalizado por naturaleza |
| `naturaleza` | Enum | Si | INGRESO o GASTO |
| `clasificacion_gasto` | Enum | No | NECESARIO, COMPROMISO, DISCRECIONAL |
| `icono` | Clave | No | Catalogo controlado de UI |
| `color` | Hex | No | Presentacion, nunca significado unico |
| `es_sistema` | Booleano | Si | Categoria inicial sugerida |
| `orden` | Entero | Si | Orden visible |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `archivado_en` | Timestamp | No | Conserva historico |

Indices: `(espacio_id, naturaleza, archivado_en)`. No se incluyen subcategorias en el MVP.

## 7. Movimiento

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `espacio_id` | UUID | Si | Espacio propietario |
| `tipo` | Enum | Si | INGRESO, GASTO o APORTE |
| `estado` | Enum | Si | REGISTRADO, PROGRAMADO, ANULADO |
| `categoria_id` | UUID | Cond. | Obligatoria en ingreso y gasto |
| `importe_centavos` | Entero 64-bit | Si | Mayor que cero |
| `moneda` | ISO 4217 | Si | DOP |
| `fecha_efectiva` | Fecha | Si | Periodo financiero |
| `descripcion` | Texto 1-160 | Si | Valor sugerido desde categoria |
| `notas` | Texto 0-1000 | No | No se incluye en PDF por defecto |
| `es_recurrente` | Booleano | Si | Indica origen recurrente |
| `regla_recurrente_id` | UUID | No | Serie que genero el registro |
| `ocurrencia_id` | UUID | No | Evita duplicar una ocurrencia |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `anulado_en` | Timestamp | No | Obligatorio si ANULADO |

Reglas:

- Categoria y movimiento deben compartir espacio.
- Naturaleza de categoria compatible con tipo.
- Un APORTE requiere un registro Aporte enlazado.
- Solo REGISTRADO afecta cifras reales.
- PROGRAMADO afecta proyecciones.
- ANULADO no afecta calculos.

Indices prioritarios:

- `(espacio_id, fecha_efectiva)`.
- `(espacio_id, estado, fecha_efectiva)`.
- `(espacio_id, tipo, fecha_efectiva)`.
- `categoria_id`.
- Unicidad de `ocurrencia_id` cuando no sea nulo.

## 8. Transferencia interna

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `usuario_id` | UUID | Si | Mismo propietario de ambos espacios |
| `espacio_origen_id` | UUID | Si | Distinto al destino |
| `espacio_destino_id` | UUID | Si | Distinto al origen |
| `importe_centavos` | Entero 64-bit | Si | Mayor que cero |
| `moneda` | ISO 4217 | Si | DOP |
| `fecha_efectiva` | Fecha | Si | Misma para ambos efectos |
| `estado` | Enum | Si | REGISTRADA, PROGRAMADA, ANULADA |
| `motivo` | Texto 0-160 | No | Ej. retiro del propietario |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `anulado_en` | Timestamp | No | Obligatorio si anulada |

La transferencia es una sola entidad para garantizar atomicidad. Las consultas derivan salida y entrada sin crear dos movimientos independientes que puedan separarse.

Indices: `(espacio_origen_id, fecha_efectiva)`, `(espacio_destino_id, fecha_efectiva)` y `(usuario_id, estado)`.

## 9. Regla recurrente

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `espacio_id` | UUID | Si | Espacio propietario |
| `tipo_movimiento` | Enum | Si | INGRESO, GASTO o APORTE |
| `categoria_id` | UUID | Cond. | Obligatoria en ingreso/gasto |
| `meta_id` | UUID | Cond. | Obligatoria en aporte |
| `importe_centavos` | Entero 64-bit | Si | Mayor que cero |
| `descripcion` | Texto 1-160 | Si | Plantilla visible |
| `frecuencia` | Enum | Si | SEMANAL, QUINCENAL, MENSUAL, ANUAL |
| `fecha_inicio` | Fecha | Si | Primera ocurrencia |
| `fecha_fin` | Fecha | No | Igual o posterior al inicio |
| `estado` | Enum | Si | ACTIVA, PAUSADA, FINALIZADA |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |

## 10. Ocurrencia programada

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `regla_recurrente_id` | UUID | Si | Serie padre |
| `fecha_prevista` | Fecha | Si | Unica por serie |
| `estado` | Enum | Si | PENDIENTE, REALIZADA, OMITIDA, VENCIDA |
| `movimiento_id` | UUID | No | Unico cuando se realiza |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |

Constraints: `(regla_recurrente_id, fecha_prevista)` unico y `movimiento_id` unico cuando exista.

## 11. Presupuesto

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `espacio_id` | UUID | Si | Espacio propietario |
| `fecha_inicio` | Fecha | Si | Inclusiva |
| `fecha_fin` | Fecha | Si | Inclusiva y no anterior al inicio |
| `estado` | Enum | Si | BORRADOR, ACTIVO, CERRADO |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `archivado_en` | Timestamp | No | Conserva historico |

Constraint inicial: no mas de un presupuesto ACTIVO solapado por espacio.

## 12. Limite de presupuesto

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `presupuesto_id` | UUID | Si | Presupuesto padre |
| `categoria_id` | UUID | Si | Categoria de gasto del mismo espacio |
| `limite_centavos` | Entero 64-bit | Si | Mayor o igual que cero |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |

Constraint: `(presupuesto_id, categoria_id)` unico. El consumo se calcula desde movimientos y no se almacena.

## 13. Meta

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `espacio_id` | UUID | Si | Espacio propietario |
| `nombre` | Texto 1-120 | Si | Nombre visible |
| `descripcion` | Texto 0-1000 | No | Detalle opcional |
| `objetivo_centavos` | Entero 64-bit | Si | Mayor que cero |
| `fecha_objetivo` | Fecha | No | Posterior a fecha de inicio al crear |
| `prioridad` | Enum | Si | ALTA, MEDIA, BAJA |
| `estado` | Enum | Si | ACTIVA, PAUSADA, COMPLETADA, ARCHIVADA |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |
| `completada_en` | Timestamp | No | Requerido si completada |
| `archivado_en` | Timestamp | No | Requerido si archivada |

Indices: `(espacio_id, estado)` y `(espacio_id, fecha_objetivo)`.

El progreso se calcula desde aportes y no se guarda como valor mutable.

## 14. Aporte

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `meta_id` | UUID | Si | Meta receptora |
| `movimiento_id` | UUID | Si | Movimiento tipo APORTE |
| `creado_en` | Timestamp | Si | Inmutable |

Constraints:

- `movimiento_id` unico.
- Meta y movimiento comparten espacio.
- Importe, fecha y estado proceden del movimiento para no duplicar datos.

## 15. Preferencia de notificacion

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `usuario_id` | UUID | Si | Propietario |
| `tipo` | Enum | Si | APORTE, REVISION, PRESUPUESTO, SEGURIDAD |
| `canal` | Enum | Si | EN_APP, WEB_PUSH, EMAIL |
| `activa` | Booleano | Si | Consentimiento por categoria y canal |
| `hora_local` | Hora | No | Hora preferida |
| `creado_en` | Timestamp | Si | Inmutable |
| `actualizado_en` | Timestamp | Si | Ultimo cambio |

Constraint: `(usuario_id, tipo, canal)` unico.

## 16. Evento de auditoria

| Campo | Tipo conceptual | Req. | Regla |
| --- | --- | --- | --- |
| `id` | UUID | Si | Unico |
| `usuario_id` | UUID | No | Nulo para proceso de sistema |
| `espacio_id` | UUID | No | Nulo para acciones globales |
| `accion` | Codigo | Si | Ej. MOVIMIENTO_ANULADO |
| `entidad_tipo` | Codigo | Si | MOVIMIENTO, META, etc. |
| `entidad_id` | UUID | No | Recurso afectado |
| `cambios` | Documento estructurado | No | Solo campos relevantes no secretos |
| `ocurrido_en` | Timestamp | Si | Inmutable |

Indices: `(espacio_id, ocurrido_en)`, `(usuario_id, ocurrido_en)` y `(entidad_tipo, entidad_id)`.

No admite actualizacion o eliminacion y no almacena contrasenas, tokens ni notas financieras completas.

## 17. Datos derivados

No se almacenan como fuente de verdad:

- Disponible.
- Totales de ingresos o gastos.
- Consumo de presupuesto.
- Progreso de meta.
- Tasa de ahorro.
- Totales por categoria.

Se calculan desde movimientos registrados, programados, aportes y transferencias. Podran optimizarse con vistas o agregados solo cuando mediciones reales lo justifiquen.

## 18. Integridad y operaciones atomicas

- Crear un APORTE y su relacion con Meta ocurre en una transaccion.
- Crear, editar o anular una transferencia actualiza ambos espacios en una transaccion.
- Realizar una ocurrencia y crear su movimiento ocurre una sola vez.
- Archivar una categoria no cambia movimientos existentes.
- Anular un movimiento recalcula sus efectos sin eliminar el historico.
- Toda relacion financiera valida el espacio y propietario en servidor.

## 19. Fuera del modelo MVP

- Cuentas bancarias y conciliacion.
- Saldos por cuenta.
- Multimoneda y tasas de cambio.
- Colaboradores, miembros y roles.
- Contabilidad de doble partida.
- Subcategorias arbitrarias.
- Division de un movimiento entre categorias.
- Adjuntos y comprobantes.
- Facturas y e-CF.
- Prestamos, inversiones e intereses.
- Etiquetas libres.
- Sincronizacion offline de escrituras.
- Integraciones externas.
- Datos o recomendaciones de IA.

## 20. Orden de implementacion de datos

1. Usuario y Perfil.
2. Espacio y Categoria.
3. Movimiento.
4. Meta y Aporte.
5. Presupuesto y LimitePresupuesto.
6. TransferenciaInterna.
7. ReglaRecurrente y OcurrenciaProgramada.
8. Preferencias de notificacion.
9. EventoAuditoria.
