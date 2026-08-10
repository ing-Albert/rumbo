# Plan del proyecto: aplicacion de planificacion de ahorro

## 1. Vision

Crear una aplicacion sencilla y confiable para que personas y emprendedores de Republica Dominicana conviertan sus ingresos, gastos y objetivos en un plan de ahorro realista, medible y ajustable.

La primera version sera una PWA instalable, funcionara en computadora y movil y no conectara bancos, movera dinero ni ofrecera asesoramiento financiero personalizado.

## 2. Decisiones iniciales

- Mercado inicial: Republica Dominicana.
- Moneda principal: peso dominicano (`DOP`), presentado como `RD$`.
- Usuarios: personas individuales y emprendedores.
- Plataforma inicial: PWA responsive e instalable.
- Operacion: planificacion y registros manuales.
- Idioma inicial: espanol.
- Zona horaria: `America/Santo_Domingo`.
- Fechas visibles: `DD/MM/AAAA`.
- Expansion: otros paises y una app nativa solo despues de validar el producto.

## 3. Problema que resuelve

Los usuarios necesitan responder con claridad:

1. Cuanto dinero pueden ahorrar realmente.
2. Cuanto deben aportar para alcanzar una meta en una fecha determinada.
3. Que deben ajustar si el plan no es viable.
4. Como manejar un ingreso variable sin crear expectativas irreales.
5. Como separar su dinero personal del dinero de su emprendimiento.
6. Si estan avanzando segun lo planificado.

## 4. Propuesta de valor

- Primera planificacion en menos de siete minutos.
- Metas de ahorro con aportes recomendados y supuestos visibles.
- Plan conservador para ingresos variables.
- Separacion basica entre finanzas personales y del negocio.
- Seguimiento sin necesidad de conectar una cuenta bancaria.
- Lenguaje educativo, claro y sin culpabilizar al usuario.
- Datos exportables y controlados por el usuario.

## 5. Alcance del MVP

### Cuenta y onboarding

- Registro, inicio de sesion, recuperacion y cierre de sesion.
- Perfil `Personal`, `Emprendedor` o `Mixto`.
- Configuracion inicial de moneda, frecuencia de ingresos y preferencias.
- Simulacion inicial con la menor cantidad posible de preguntas.

### Presupuesto ligero

- Sueldo e ingresos fijos por periodo de pago.
- Ingresos variables y extraordinarios.
- Gastos fijos y variables.
- Categorias sugeridas y personalizadas.
- Frecuencias diaria, semanal, quincenal, mensual y puntual.
- Espacios separados `Personal` y `Negocio`.
- Transferencia interna o retiro del negocio sin duplicar el ingreso personal.
- Saldo disponible estimado actualizado con cada ingreso y gasto registrado.
- Resumen de cuanto ingreso, cuanto gasto, cuanto separo para ahorrar y cuanto queda.
- Comparacion de gastos por categoria y periodo.
- Distincion entre gastos necesarios, compromisos y gastos discrecionales.
- Avisos cuando los gastos planificados superen el ingreso disponible.

El usuario podra empezar registrando su sueldo. Cada gasto reducira visualmente el saldo disponible del periodo, mientras que un ingreso adicional lo aumentara. Como los datos son manuales, la interfaz lo llamara `Disponible estimado` y mostrara la fecha de la ultima actualizacion; no se presentara como saldo bancario real.

```text
disponible_estimado = ingresos_registrados - gastos_registrados - ahorro_separado
porcentaje_gastado = gastos_registrados / ingresos_registrados * 100
capacidad_de_ahorro = max(0, ingresos_planificados - gastos_planificados)
```

Esto no sera contabilidad formal: no habra partida doble, conciliacion, estados financieros, inventario, nomina ni impuestos.

### Metas de ahorro

- Nombre, categoria, monto objetivo, saldo inicial y fecha deseada.
- Prioridad de la meta.
- Aportes manuales ordinarios y extraordinarios.
- Calculo del aporte requerido por periodo.
- Calculo de fecha estimada cuando el usuario define el aporte.
- Estado `En camino`, `Requiere ajuste`, `Pausada` o `Completada`.
- Recalculo al omitir un aporte o cambiar monto, fecha o capacidad.

### Ingresos variables

- Escenarios minimo, probable y maximo.
- Plan base calculado con el escenario minimo.
- Regla porcentual para distribuir excedentes entre metas.
- Comparacion entre escenario conservador y probable.

### Seguimiento

- Panel de metas, proximos aportes y capacidad mensual.
- Resumen visual con graficos de ingresos, gastos, ahorro, disponible, categorias, presupuesto y progreso de metas.
- Historial de aportes y revisiones.
- Resumen mensual.
- Explicacion de cada resultado y sus supuestos.
- Recordatorios configurables, discretos y sin mostrar saldos en la pantalla bloqueada.
- Exportacion en CSV; PDF legible como complemento.

### PWA

- Diseno mobile-first y adaptable a escritorio.
- Instalacion desde el navegador.
- Ultimo plan disponible sin conexion en modo de solo lectura.
- Indicador visible de datos desactualizados.
- Bajo consumo de datos y buen rendimiento en conexiones limitadas.

## 6. Fuera del MVP

- Conexion o sincronizacion bancaria.
- Pagos, transferencias, remesas o custodia de fondos.
- Facturacion electronica.
- Contabilidad completa y declaraciones fiscales.
- Creditos, inversiones, seguros o cambio de divisas.
- Recomendaciones personalizadas de productos financieros.
- Metas compartidas, familias o equipos.
- Aplicaciones nativas de iOS y Android.
- Recomendaciones generadas por inteligencia artificial.

## 7. Reglas financieras iniciales

Los calculos se realizaran con precision decimal; nunca con coma flotante binaria para importes. Se redondeara solo al presentar resultados.

### Sin rendimiento

```text
valor_futuro = saldo_inicial + aporte_periodico * numero_de_aportes
aporte_requerido = (meta - saldo_inicial) / numero_de_aportes
```

### Con rendimiento estimado opcional

Para aportes al final de cada periodo:

```text
VF = P(1+i)^n + A[((1+i)^n - 1) / i]
```

- `P`: saldo inicial.
- `A`: aporte periodico.
- `i`: tasa efectiva por periodo.
- `n`: cantidad de periodos.

Si la tasa es cero se usara la formula sin rendimiento. La interfaz separara siempre dinero aportado y rendimiento estimado, y aclarara que una proyeccion no es una garantia.

### Reglas de calendario

- Usar fechas reales, no asumir siempre doce aportes por ano.
- Contemplar pagos omitidos, aportes extraordinarios, retiros y fechas pasadas.
- Mantener timestamps en UTC y la zona horaria del usuario por separado.
- Guardar la moneda ISO 4217 en cada importe relevante.

## 8. Experiencia de usuario

### Flujo principal

1. Elegir perfil.
2. Registrar ingresos y gastos esenciales.
3. Crear una meta.
4. Obtener un aporte sugerido.
5. Ajustar monto, fecha o aporte si el plan no es viable.
6. Guardar el plan.
7. Registrar aportes y revisar el avance cada mes.

### Principios UX/UI

- Pedir solo la informacion necesaria en cada momento.
- Mostrar primero una respuesta y despues opciones avanzadas.
- No depender exclusivamente de colores para comunicar estados.
- Evitar mensajes como "fallaste"; usar "tu plan necesita un ajuste".
- Mostrar como se obtuvo cada cifra.
- Permitir pausar y reanudar una meta.
- Ofrecer tablas accesibles como alternativa a los graficos.
- Cumplir WCAG 2.2 nivel AA.

## 9. Arquitectura tecnica

### Estrategia

Empezar con un monolito modular. No se usaran microservicios ni Kubernetes mientras el volumen o una obligacion regulatoria no los justifique.

### Tecnologias propuestas

- Monorepo: `pnpm` workspaces.
- Web/PWA: React, TypeScript, Vite y React Router.
- UI: sistema de componentes propio con tokens de diseno y CSS moderno.
- Formularios y contratos: validacion de esquemas compartida.
- Backend: Node.js, TypeScript y Fastify o NestJS con Fastify.
- API: REST versionada y documentada con OpenAPI.
- Base de datos: PostgreSQL administrado.
- Autenticacion: proveedor compatible con OAuth 2.1 y OpenID Connect.
- Archivos y exportaciones: almacenamiento compatible con S3 cuando sea necesario.
- Observabilidad: logs estructurados, captura de errores y metricas.

La app nativa futura se desarrollaria con React Native y Expo. Compartiria reglas financieras, tipos, validaciones y cliente de API, pero no se forzaria a compartir todos los componentes visuales.

### Modulos del backend

- Identidad, sesiones y dispositivos.
- Perfiles y preferencias.
- Espacios personales y de negocio.
- Ingresos, gastos y categorias.
- Metas, aportes y calculo del plan.
- Presupuestos y recurrencias.
- Transferencias internas.
- Recordatorios y notificaciones.
- Exportaciones.
- Auditoria.

## 10. Modelo de datos preliminar

- `users`: identidad externa, estado y fechas.
- `profiles`: nombre visible, perfil, zona horaria y preferencias.
- `spaces`: propietario, moneda y tipo `personal` o `business`.
- `categories`: espacio, naturaleza y nombre.
- `movements`: ingreso, gasto o aporte; importe, fecha y estado.
- `internal_transfers`: salida y entrada enlazadas entre espacios.
- `recurrence_rules` y `scheduled_occurrences`: programacion sin duplicados.
- `budgets` y `budget_limits`: periodo y limites por categoria.
- `goals` y `contributions`: objetivo, estado y aportes enlazados.
- `notification_preferences`: categoria, canal, horario y estado.
- `audit_events`: actor, accion, recurso, fecha y metadatos no sensibles.

El plan del periodo y sus indicadores se calculan desde estos datos; no se guardan totales derivados como fuente de verdad. El detalle definitivo se encuentra en `DICCIONARIO_DATOS_MVP.md`.

Todas las entidades privadas deben estar vinculadas al usuario propietario. La autorizacion se verificara siempre en el backend.

## 11. Seguridad y privacidad

- Minimizar datos; no solicitar cedula ni RNC en el MVP.
- Cifrar trafico, base de datos, backups y almacenamiento.
- Usar cookies `HttpOnly`, `Secure` y `SameSite` en la PWA.
- Ofrecer passkeys o MFA cuando el proveedor lo permita.
- No incluir metas, ingresos, gastos ni saldos en logs o analitica.
- Validar entradas, limitar solicitudes y proteger contra XSS, CSRF, inyeccion y abuso de API.
- Registrar accesos y cambios sensibles sin copiar informacion financiera completa.
- Permitir exportar y eliminar la cuenta y sus datos.
- Definir tiempos de retencion por categoria de datos.
- Probar restauraciones de backups, no solo su creacion.
- Alinear pruebas con OWASP ASVS y, en una app nativa futura, OWASP MASVS.

En Republica Dominicana se debe validar el cumplimiento de la Ley 172-13 sobre datos personales y la Ley 358-05 de proteccion al consumidor con asesoria local antes del lanzamiento comercial.

## 12. Facturacion electronica y regulacion

La planificacion manual no equivale a una actividad bancaria ni a facturacion electronica. La aplicacion debe presentarse como herramienta educativa y organizativa, sin prometer rendimientos ni usar lenguaje que sugiera deposito, custodia o garantia.

La facturacion electronica dominicana `e-CF` es un posible producto futuro separado. Su implementacion requeriria cumplir los esquemas, certificados, procesos de certificacion y reglas vigentes de la DGII bajo la Ley 32-23. No se agregara un generador de PDF creyendo que eso constituye un comprobante fiscal electronico valido.

Cualquier futura conexion bancaria, pago, inversion o custodia exigira una nueva evaluacion legal, de seguridad y operativa.

## 13. Calidad y pruebas

- Pruebas unitarias exhaustivas del motor financiero, dinero, fechas y redondeos.
- Pruebas de integracion con PostgreSQL real.
- Pruebas de contrato de la API.
- Pruebas E2E de registro, presupuesto, meta, plan, aporte, exportacion y borrado.
- Pruebas que impidan acceso a datos de otro usuario.
- Pruebas de accesibilidad automatizadas y manuales.
- Pruebas de PWA, actualizaciones y lectura offline.
- Revision de seguridad y rendimiento antes del piloto.

## 14. Roadmap

### Fase 0: descubrimiento, 2 a 3 semanas

- Entrevistar a 15-20 personas y 10-15 emprendedores dominicanos.
- Validar lenguaje, categorias e ingresos variables.
- Probar prototipos de onboarding, meta y revision mensual.
- Definir identidad visual y sistema de diseno.
- Confirmar requisitos legales y politica de privacidad.

### Fase 1: construccion del MVP, 8 a 10 semanas

1. Base del monorepo, entornos, CI y autenticacion.
2. Perfiles y espacios personal/negocio.
3. Ingresos, gastos y capacidad de ahorro.
4. Motor financiero y metas.
5. Plan mensual y distribucion entre metas.
6. Aportes, progreso, panel e historial.
7. Exportacion, recordatorios y experiencia PWA.
8. Seguridad, accesibilidad, observabilidad y pruebas finales.

### Fase 2: piloto, 4 semanas

- Lanzar a 100-200 usuarios.
- Medir comprension, activacion, recurrencia y errores.
- Corregir friccion y calculos antes de ampliar funciones.

### Fase 3: lanzamiento publico, 4 a 6 semanas

- Mejorar onboarding y rendimiento.
- Incorporar aprendizajes del piloto.
- Establecer soporte y operacion de incidentes.
- Validar monetizacion freemium sin bloquear el valor esencial.

### Evolucion posterior

- Presupuestos compartidos y metas familiares.
- Mejor funcionamiento offline y sincronizacion multidispositivo.
- React Native con Expo si existe demanda de biometria, notificaciones fiables o tiendas.
- Plantillas para tipos de emprendimiento.
- Soporte para otros paises mediante configuracion regional.
- Asistente de IA para analizar patrones y proponer ajustes explicables.
- Integraciones bancarias mediante proveedores autorizados.
- Modulos contables o e-CF como productos separados.

### Fase futura: asistente de inteligencia artificial

La IA utilizara los ingresos, gastos, categorias, recurrencias y metas autorizados por el usuario para generar sugerencias como:

- Identificar categorias cuyo consumo esta aumentando.
- Detectar gastos recurrentes o suscripciones que conviene revisar.
- Proponer limites semanales o mensuales por categoria.
- Simular cuanto antes se alcanzaria una meta al reducir un gasto.
- Recomendar una distribucion conservadora del dinero disponible.
- Adaptar el plan cuando cambie el sueldo o aparezca un ingreso extraordinario.

La IA no movera dinero, no prohibira gastos ni decidira por el usuario. Cada recomendacion mostrara los datos que la originaron, el ahorro estimado y una accion para aceptar, modificar o ignorar la propuesta. Se evitaran mensajes culpabilizantes y recomendaciones absolutas sobre salud, inversiones, credito o impuestos.

Antes de implementarla se requerira:

- Tener suficientes datos historicos y categorias consistentes.
- Obtener consentimiento especifico para procesar datos con IA.
- Evitar enviar identificadores y datos financieros innecesarios a proveedores externos.
- Evaluar respuestas incorrectas, sesgos, privacidad y costo operativo.
- Mantener reglas deterministas para los calculos financieros; la IA explicara y recomendara, pero no reemplazara el motor de calculo.
- Registrar la version, datos de entrada y respuesta de cada recomendacion para poder auditarla.

## 15. Metricas de exito

- 60% completa el onboarding.
- 50% registra ingresos, gastos y una meta.
- 40% genera su primer plan en la sesion inicial.
- Tiempo mediano al primer plan menor de siete minutos.
- 30% vuelve a revisar el plan durante el segundo mes.
- 25% registra al menos un aporte durante los primeros 30 dias.
- 70% declara entender cuanto puede ahorrar y por que.
- Menos de 2% reporta resultados de calculo incorrectos.
- Cero incidentes criticos de privacidad o perdida de datos.

## 16. Riesgos principales

| Riesgo | Respuesta |
| --- | --- |
| El registro manual resulta tedioso | Entradas rapidas, categorias sugeridas y duplicacion del mes anterior |
| Los ingresos variables producen planes irreales | Usar el escenario minimo como base y separar los excedentes |
| Se confunde dinero personal y del negocio | Espacios visibles y retiros internos sin duplicar importes |
| El producto deriva hacia contabilidad completa | Mantener los limites del MVP y separar futuros modulos fiscales |
| El usuario desconfia del calculo | Mostrar formulas, supuestos y escenarios editables |
| El disponible manual no coincide con el banco | Indicar que es estimado, mostrar ultima actualizacion y facilitar correcciones |
| Hay poca recurrencia despues del primer plan | Revision mensual, progreso y recordatorios configurables |
| Se exponen datos financieros | Minimizacion, autorizacion estricta, cifrado y auditoria |
| La IA ofrece una recomendacion perjudicial | Explicaciones, limites tematicos, confirmacion humana y calculos deterministas |
| La conectividad movil es limitada | PWA ligera y ultimo plan disponible sin conexion |
| Se internacionaliza demasiado pronto | Validar Republica Dominicana antes de abstraer reglas de otros paises |

## 17. Referencias iniciales

- Banco Central de la Republica Dominicana: <https://www.bancentral.gov.do/>
- API del Banco Central: <https://apibcrd.bancentral.gov.do/>
- DGII, facturacion electronica: <https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscales/Paginas/facturacionElectronica.aspx>
- Ley 172-13 sobre datos personales: <https://proconsumidor.gob.do/transparencia/files/Ley_172_13_Proteccion_Datos_Caracter_Personal.pdf>
- Pro Consumidor: <https://proconsumidor.gob.do/>
- OWASP ASVS: <https://owasp.org/www-project-application-security-verification-standard/>
- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>

## 18. Proximo entregable

Antes de programar, el siguiente entregable debe ser la especificacion funcional y de UX del MVP: mapa de navegacion, flujos, wireframes, reglas de negocio, criterios de aceptacion y diccionario de datos. Despues se inicializara el monorepo y se implementara una primera vertical completa: registrar sueldo y gastos, visualizar el disponible, crear una meta, calcular el plan y registrar un aporte.
