# Casos de uso

## Actores

### Internos

- **Vendedor/cajero:** registra ventas, emite comprobantes y consulta su resultado.
- **Administrador:** configura la operación y administra series, correlativos y accesos.
- **Contador:** consulta comprobantes, reportes y documentos tributarios.
- **Almacenero:** registra movimientos de almacén y participa en la migración del legado.

### Externos

- **SUNAT:** recibe comprobantes y devuelve su estado o constancia de recepción.
- **OSE/PSE:** procesa comprobantes cuando se usa un proveedor de servicios electrónicos.
- **Cliente:** recibe el comprobante y sus archivos.

## Tabla de casos de uso

Las prioridades son preliminares para organizar la especificación, no compromisos de calendario. Las agrupaciones de features son futuras; la primera especificación de feature es [FEAT-001 — Emisión de factura](../features/001-emitir-factura.md).

| ID | Nombre | Actor principal | Descripción breve | Prioridad (Alta/Media/Baja) | Origen (Enunciado / Normativa SUNAT / Investigación Nubefact) | Feature futura |
|---|---|---|---|---|---|---|
| UC-01 | Emitir factura electrónica | Vendedor/cajero | Registrar una venta y preparar una factura en UBL 2.1 (`cbc:InvoiceTypeCode`, Catálogo 01 código 01) para su validación y envío. | Alta | Enunciado / Normativa SUNAT | Emisión de comprobantes |
| UC-02 | Emitir boleta electrónica | Vendedor/cajero | Registrar una venta y preparar una boleta en UBL 2.1 (`cbc:InvoiceTypeCode`, Catálogo 01 código 03) para su validación y envío. | Alta | Enunciado / Normativa SUNAT | Emisión de comprobantes |
| UC-03 | Emitir nota de crédito | Vendedor/cajero | Registrar una nota de crédito vinculada al comprobante de origen. Motivo según Catálogo 09 (códigos 01–13). | Alta | Enunciado / Investigación Nubefact / Normativa SUNAT | Notas de crédito y débito |
| UC-04 | Emitir nota de débito | Vendedor/cajero | Registrar una nota de débito vinculada al comprobante de origen. Motivo según Catálogo 10 (códigos 01–03). | Alta | Enunciado / Investigación Nubefact / Normativa SUNAT | Notas de crédito y débito |
| UC-05 | Enviar comprobante y recibir CDR | Sistema de emisión | Enviar el comprobante a SUNAT u OSE/PSE y registrar la respuesta o CDR recibida. | Alta | Enunciado / Investigación Nubefact | Integración electrónica |
| UC-06 | Reintentar envíos pendientes | Administrador | Reintentar los envíos pendientes cuando SUNAT/OSE no responda, conservando su estado para seguimiento. | Alta | Investigación Nubefact | Integración electrónica |
| UC-07 | Consultar estado de comprobante | Vendedor/cajero | Consultar el estado de envío y la respuesta asociada a un comprobante. | Alta | Enunciado / Investigación Nubefact | Consulta y seguimiento |
| UC-08 | Anular comprobante | Administrador | Gestionar la anulación. Comunicación de baja para facturas, resumen diario para boletas, catálogo y elementos UBL aplicables: **Pendiente de verificar**. | Alta | Enunciado / Investigación Nubefact / Normativa SUNAT | Anulación y bajas |
| UC-09 | Gestionar clientes | Vendedor/cajero | Registrar y consultar clientes; validar RUC de 11 dígitos con dígito verificador y DNI de 8 dígitos. Tipo de documento en Catálogo 06 (`schemeID` del `cbc:ID` del cliente); algoritmo del dígito verificador: **Pendiente de verificar**. | Alta | Enunciado / Normativa SUNAT | Gestión de clientes |
| UC-10 | Gestionar productos e impuestos | Administrador | Registrar productos con afectación IGV de Catálogo 07 (`cbc:TaxExemptionReasonCode`) y, cuando corresponda ISC, Catálogo 08 (`cbc:TierRange`). | Alta | Enunciado / Normativa SUNAT | Productos e impuestos |
| UC-11 | Gestionar series y correlativos | Administrador | Configurar series de factura `F` + 3 caracteres alfanuméricos y correlativos numéricos de hasta 8 dígitos, representados en el identificador `cbc:ID`; secuencia y unicidad: **Pendiente de verificar**. | Alta | Enunciado / Normativa SUNAT | Configuración de emisión |
| UC-12 | Consultar y generar reportes | Contador | Consultar ventas y comprobantes con filtros por fechas, número de documento, tipo de cliente y estado. | Media | Investigación Nubefact | Consulta y reportes |
| UC-13 | Descargar PDF, XML y CDR | Contador | Consultar y descargar la representación PDF, el XML y la CDR disponibles para un comprobante. | Alta | Investigación Nubefact | Documentos electrónicos |
| UC-14 | Almacenar y conservar PDF, XML y CDR | Administrador | Mantener disponibles los archivos asociados a los comprobantes durante el periodo definido. Plazo legal de conservación: **Pendiente de verificar**. | Media | Investigación Nubefact / Normativa SUNAT | Documentos electrónicos |
| UC-15 | Imprimir comprobante Ticket/A4 | Vendedor/cajero | Obtener una representación impresa en formato Ticket o A4. Alcance de personalización: **Pendiente de verificar**. | Media | Investigación Nubefact | Presentación de comprobantes |
| UC-16 | Migrar datos del legado | Administrador | Importar fecha, ingreso, salida, producto y número de documento interno sin perder trazabilidad. | Alta | Enunciado | Migración y trazabilidad |
| UC-17 | Registrar movimientos de almacén | Almacenero | Registrar los movimientos de ingreso y salida de productos del almacén. | Media | Enunciado | Gestión de almacén |
| UC-18 | Emitir guía de remisión | Almacenero | Preparar una guía de remisión electrónica. Tipos y reglas aplicables: **Pendiente de verificar**. | Baja | Enunciado / Investigación Nubefact / Normativa SUNAT | Guías de remisión |

## Flujos de los casos de prioridad Alta

### UC-01 — Emitir factura electrónica

**Flujo principal**

1. El vendedor/cajero selecciona al cliente y agrega los productos y cantidades.
2. El sistema calcula los importes e impuestos según la afectación declarada del producto.
3. El sistema valida los datos requeridos y prepara el comprobante estructurado en UBL 2.1.
4. El sistema registra la factura y la deja lista para envío.

**Alternativo/error:** si faltan datos obligatorios o la información del comprobante no pasa la validación, el sistema muestra los errores y no la deja lista para envío. El Catálogo 01 identifica la factura con `cbc:InvoiceTypeCode` código `01`; Catálogo 07 se mapea a `cbc:TaxExemptionReasonCode`; Catálogo 08, si corresponde ISC, a `cbc:TierRange`. La ubicación XML exacta de otros datos permanece sujeta a verificación.

### UC-02 — Emitir boleta electrónica

**Flujo principal**

1. El vendedor/cajero selecciona o registra al cliente y agrega productos y cantidades.
2. El sistema calcula los importes e impuestos con la afectación configurada.
3. El sistema valida los datos y prepara la boleta en UBL 2.1.
4. El sistema registra la boleta y la deja lista para envío.

**Alternativo/error:** si los datos necesarios están incompletos o no pasan las validaciones, el sistema presenta el detalle y no deja lista la boleta para envío. Catálogos 07 (`cbc:TaxExemptionReasonCode`) y 08 (`cbc:TierRange`), cuando correspondan. Catálogo 01 identifica la boleta con `cbc:InvoiceTypeCode` código `03`.

### UC-03 — Emitir nota de crédito

**Flujo principal**

1. El vendedor/cajero busca y selecciona el comprobante de origen.
2. Registra los datos de la nota y el motivo.
3. El sistema valida la relación con el comprobante y prepara la nota en UBL 2.1.
4. El sistema registra la nota para su envío.

**Alternativo/error:** si no se encuentra el comprobante de origen o el motivo no puede validarse, se informa el error y no se registra la nota para envío. Motivos: Catálogo 09 en `cac:DiscrepancyResponse/cbc:ResponseCode` (ver `specs/domain/catalogos-sunat.md`).

### UC-04 — Emitir nota de débito

**Flujo principal**

1. El vendedor/cajero busca y selecciona el comprobante de origen.
2. Registra los datos de la nota y el motivo.
3. El sistema valida la relación con el comprobante y prepara la nota en UBL 2.1.
4. El sistema registra la nota para su envío.

**Alternativo/error:** si no se encuentra el comprobante de origen o el motivo no puede validarse, se informa el error y no se registra la nota para envío. Motivos: Catálogo 10 en `cac:DiscrepancyResponse/cbc:ResponseCode` (ver `specs/domain/catalogos-sunat.md`).

### UC-05 — Enviar comprobante y recibir CDR

**Flujo principal**

1. El sistema selecciona un comprobante listo para envío.
2. Lo remite a SUNAT directamente o al OSE/PSE configurado.
3. Recibe la respuesta y la CDR, si está disponible.
4. Asocia y registra la respuesta con el comprobante para consulta posterior.

**Alternativo/error:** si el destino no responde o devuelve un error, se registra el resultado y el comprobante queda identificable para seguimiento y reintento; no se marca como aceptado sin respuesta válida.

### UC-06 — Reintentar envíos pendientes

**Flujo principal**

1. El administrador consulta los comprobantes pendientes de envío o con error reintentable.
2. Selecciona uno o más comprobantes para reintento, o el sistema los procesa desde la cola pendiente.
3. El sistema vuelve a enviar cada comprobante al destino configurado.
4. Registra el resultado para consulta.

**Alternativo/error:** si SUNAT/OSE vuelve a no responder, el comprobante permanece pendiente con el resultado del intento registrado, sin presentarlo como enviado correctamente.

### UC-07 — Consultar estado de comprobante

**Flujo principal**

1. El vendedor/cajero busca el comprobante por sus datos disponibles.
2. El sistema muestra el estado de envío y la respuesta registrada.
3. Si hay CDR disponible, permite consultar su asociación al comprobante.

**Alternativo/error:** si no existe el comprobante o todavía no hay respuesta del destino, el sistema informa esa situación y no muestra un estado de aceptación supuesto.

### UC-08 — Anular comprobante

**Flujo principal**

1. El administrador busca el comprobante y solicita gestionar su anulación.
2. El sistema identifica si corresponde a factura o boleta.
3. El sistema determina el mecanismo aplicable una vez verificado: comunicación de baja para factura o resumen diario para boleta.
4. El sistema registra la solicitud y el resultado disponible del envío, sin asumir un mecanismo no confirmado.

**Alternativo/error:** si no se puede determinar el mecanismo o plazo aplicable, se detiene la preparación y se informa que la regla está **Pendiente de verificar**. Comunicación de baja, resumen diario, plazos, catálogo y elementos UBL aplicables: **Pendiente de verificar**.

### UC-09 — Gestionar clientes

**Flujo principal**

1. El vendedor/cajero registra o busca un cliente.
2. Ingresa los datos de identificación disponibles, incluido RUC o DNI cuando corresponda.
3. El sistema valida formato y datos conforme a reglas por definir.
4. Guarda el cliente y lo deja disponible para una emisión.

**Alternativo/error:** si faltan datos o no pasan las validaciones definidas, el sistema informa qué debe corregirse y no confirma el registro. Catálogo 06 identifica RUC con `schemeID="6"` y DNI con `schemeID="1"` en el `cbc:ID` del cliente. Algoritmo de validación del dígito verificador del RUC: **Pendiente de verificar**.

### UC-10 — Gestionar productos e impuestos

**Flujo principal**

1. El administrador registra o selecciona un producto.
2. Configura su afectación IGV según Catálogo 07 (`cbc:TaxExemptionReasonCode`).
3. Si corresponde ISC, configura el sistema de cálculo según Catálogo 08 (`cbc:TierRange`).
4. El sistema guarda el producto para su uso en comprobantes.

**Alternativo/error:** si falta el tipo de afectación o, para una línea con ISC, el sistema de cálculo requerido por las notas del catálogo, el sistema informa el dato faltante y no guarda la configuración incompleta. Tasas y otras reglas tributarias están **Pendiente de verificar**.

### UC-11 — Gestionar series y correlativos

**Flujo principal**

1. El administrador consulta las series y correlativos configurados.
2. Registra o modifica una configuración autorizada.
3. El sistema valida los datos según las reglas de emisión verificadas.
4. La configuración queda disponible para nuevos comprobantes.

**Alternativo/error:** si la serie o el correlativo no pasan las reglas definidas, el sistema informa el problema y no aplica el cambio. Para facturas, validar `F` + 3 caracteres alfanuméricos y correlativo numérico de hasta 8 dígitos antes de asignar el identificador `cbc:ID`. Reglas de secuencia y unicidad: **Pendiente de verificar**.

### UC-13 — Descargar PDF, XML y CDR

**Flujo principal**

1. El contador consulta un comprobante.
2. El sistema muestra los archivos disponibles asociados.
3. El contador selecciona PDF, XML o CDR.
4. El sistema entrega el archivo seleccionado.

**Alternativo/error:** si el archivo seleccionado no está disponible, el sistema informa cuál falta y no entrega un archivo sustituto como si fuera el original.

### UC-16 — Migrar datos del legado

**Flujo principal**

1. El administrador prepara los datos históricos de fecha, ingreso, salida, producto y número de documento interno.
2. El sistema importa los registros y conserva su referencia de origen.
3. El sistema informa los registros importados y los que requieren revisión.
4. El administrador revisa los resultados y completa la migración.

**Alternativo/error:** si un registro no puede mapearse o está incompleto, queda identificado para revisión y no se descarta silenciosamente.

## Requisitos no funcionales derivados de la investigación

- **Usabilidad:** mostrar mensajes de error claros que ayuden a corregir los datos o resolver incidencias.
- **Disponibilidad:** mantener una cola de reenvío cuando SUNAT/OSE no responda y permitir seguir el estado de los comprobantes pendientes.
- **Rendimiento:** generar PDF/XML sin bloquear el flujo de emisión.
- **Seguridad:** proteger tokens de OSE y certificados digitales; nunca incluirlos en el código fuente.

Estos requisitos son objetivos para especificar y validar en fases posteriores; la investigación no aporta métricas cuantitativas.

## Pendiente de verificar

- Códigos del Catálogo 10 agregados después de 2017 (los 09 y 10 base ya están verificados).
- Algoritmo oficial de validación del dígito verificador del RUC.
- Reglas de secuencia y unicidad de series/correlativos y ubicación XML exacta de sus componentes.
- Reglas y códigos SUNAT de estados, envío y recepción de CDR.
- Mecanismo de anulación de facturas y boletas, incluido resumen diario para boletas y plazos de comunicación de baja.
- Plazo legal de conservación de PDF/XML/CDR.
- Guías de remisión: tipos, reglas y elemento UBL aplicable.
- Tasas y reglas tributarias no verificadas. Catálogo 07 identifica `cbc:TaxExemptionReasonCode` para afectación IGV y Catálogo 08 identifica `cbc:TierRange` para sistema de cálculo ISC; confirmar las reglas oficiales antes de fijar validaciones.
- Afirmaciones del borrador sobre ISO 27001, pruebas, demoras, personalización de impresos, canales de soporte e interrupciones que no cuentan con fuente de usuario identificada.
