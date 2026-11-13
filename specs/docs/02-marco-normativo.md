# 02. Marco normativo y estudio de UBL

- **Estado:** Draft — Fase 1 (Spec-First). Las especificaciones son documentales; como primera implementación existe el generador del XML `Invoice` UBL 2.1 (`backend/src/ubl-invoice-xml-generator.ts`), válido contra `UBL-Invoice-2.1.xsd`.
- **Propósito:** registrar el alcance conocido de las resoluciones indicadas en el caso, su traducción preliminar a requisitos de sistema y el análisis del XSD UBL 2.1 local.
- **Límite:** no constituye dictamen legal ni certificación de cumplimiento. La aplicación vigente debe revisarse con el texto consolidado, anexos y modificaciones pertinentes.

## Convenciones de evidencia

| ID | Fuente |
|---|---|
| [N1] | SUNAT, [Resolución de Superintendencia N.° 097-2012/SUNAT, PDF oficial](https://www.sunat.gob.pe/legislacion/superin/2012/097-2012.pdf). |
| [N2] | SUNAT, [Resolución de Superintendencia N.° 234-2006/SUNAT, texto oficial](https://www.sunat.gob.pe/legislacion/superin/2006/234.htm). |
| [N3] | OASIS, [Universal Business Language Version 2.1](https://docs.oasis-open.org/ubl/os-UBL-2.1/UBL-2.1.html). |
| [N4] | XSD local [UBL-Invoice-2.1.xsd](../reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd) y componentes importados en [`common/`](../reference/ubl-2.1/common/). |
| [N5] | [Catálogos SUNAT de referencia del proyecto](../domain/catalogos-sunat.md), [modelo de dominio](../domain/modelo-dominio.md) y [matriz SUNAT ↔ UBL](../traceability/matriz-sunat-ubl.md). Sus reglas y mapeos se declaran pendientes de contraste oficial. |
| [N6] | [Caso de estudio](../caso-de-estudio.md), que solicita explícitamente estudiar las resoluciones y UBL. |
| [N7] | [README de la copia local de UBL 2.1](../reference/ubl-2.1/README.md), que identifica la copia, versión y referencia al estándar OASIS. |

**Confianza:** **Alta** = afirmación observable en una fuente primaria o esquema consultado directamente; **Media** = interpretación de su efecto o alcance para el sistema; **Baja** = hipótesis sin verificación suficiente. La confianza no es una calificación de la vigencia legal.

Cuando una regla tributaria se represente en el comprobante, se identifica el catálogo SUNAT y el elemento UBL propuestos por el proyecto; si el mapeo no está probado se marca **Pendiente de verificar**. Los formatos 14.1 y 12.1 son libros/registros y no se presume que tengan un único elemento UBL equivalente. Fuentes: [N2], [N4], [N5]. **Confianza: Alta** respecto del criterio documental.

## RS 097-2012/SUNAT — SEE desarrollado desde los sistemas del contribuyente

| Afirmación | Fuente | Efecto preliminar en el sistema | Confianza |
|---|---|---|---|
| La RS 097-2012/SUNAT corresponde al Sistema de Emisión Electrónica desarrollado desde los sistemas del contribuyente, según la denominación de la resolución oficial. | [N1] | El caso exige analizar la emisión electrónica desde el sistema propio, no solo registrar ventas en una pantalla. | Alta |
| El caso identifica esta resolución dentro del marco de emisión electrónica y describe brechas de validación, generación XML, firma y comunicación con SUNAT/OSE. La enumeración de brechas proviene del caso, no se atribuye como cita literal de la resolución. | [N6] | El diseño debe contemplar generación del documento, validaciones, firma e integración/seguimiento como capacidades a especificar. Protocolo, perfil XML y distribución de responsabilidades requieren verificación técnica y normativa específica. | Alta para lo que afirma el caso; Media para las capacidades derivadas. |
| La denominación y el texto de una resolución aislada no bastan para afirmar el conjunto de obligaciones vigentes, ni permiten fijar aquí plazos o procedimientos concretos. | [N1]; verificación de modificaciones y texto consolidado no realizada en esta fase. | Mantener como **Pendiente de verificar** los artículos aplicables, modificaciones, supuestos, requisitos de envío y plazos. No fijar valores por inferencia. | Alta como límite de este análisis. |
| La presencia de OSE en el alcance del proyecto no significa que todas sus reglas estén establecidas por la RS 097-2012. | [N1], [N6] | Citar y analizar por separado las normas posteriores aplicables al OSE antes de implementar ese adaptador. Norma exacta y vigencia: **Pendiente de verificar**. | Media |

### Decisiones documentales derivadas

1. Separar en la especificación la generación del XML, las reglas tributarias, la firma y el envío/recepción; el XSD solo cubre la estructura UBL y no certifica por sí solo los demás aspectos. Fuente: [N1], [N3], [N4], [N6]. **Confianza: Media**.
2. No incluir plazos de envío, aceptación, conservación o contingencia atribuidos a esta resolución sin cita concreta y revisión de su vigencia. Fuente: [N1]. **Confianza: Alta**.
3. Mantener el mecanismo de envío desacoplado de la lógica de negocio, como decisión de diseño ya documentada, sin interpretar ese desacoplamiento como exigencia literal de la resolución. Fuentes: [ADR 0002](../adr/0002-envio-via-ose-o-sunat.md), [N6]. **Confianza: Alta** respecto de que es una decisión del proyecto.

## RS 234-2006/SUNAT — libros y registros vinculados a asuntos tributarios

La fuente oficial consultada identifica información mínima y formatos de libros y registros; incluye referencias al Registro de Ventas e Ingresos y al Registro de Inventario Permanente en Unidades Físicas. La aplicabilidad de cada obligación depende de la situación del contribuyente y de la normativa consolidada. Fuente: [N2]. **Confianza: Alta** para el contenido publicado; la aplicabilidad actual a ABC Software Corp está **Pendiente de verificar**.

| Afirmación | Fuente | Efecto preliminar en el sistema | Confianza |
|---|---|---|---|
| La RS 234-2006/SUNAT regula aspectos de los libros y registros vinculados a asuntos tributarios, incluida información mínima y formatos. | [N2], en particular el capítulo sobre información mínima y formatos. | El sistema debe tratar la información de ventas e inventario como datos trazables y estructurados; no basta con generar el XML de factura. | Alta |
| El formato 14.1 se denomina “Registro de Ventas e Ingresos”. | [N2], sección del Registro de Ventas e Ingresos y mención expresa del “FORMATO 14.1”. | Diseñar una posible salida/reporte alimentado por los comprobantes emitidos y sus importes. El esquema exacto de columnas vigente requiere contrastar anexos y modificaciones. | Alta para denominación; Media para el requisito derivado. |
| El formato 12.1 se denomina “Registro del Inventario Permanente en Unidades Físicas”; el texto consultado indica registro mensual de información por tipo de existencia procedente de entradas y salidas físicas en cada almacén. | [N2], sección 12, apartados 12.1 y 12.2. | Los movimientos de inventario deben poder conservar fecha, producto/tipo de existencia, cantidad, sentido de movimiento y almacén con trazabilidad a la fuente. Estos campos son una consecuencia de diseño, no una transcripción exhaustiva de columnas exigidas. | Alta para el texto indicado; Media para la traducción al modelo. |
| Que el caso mencione los formatos 14.1 y 12.1 no demuestra que ambos sean obligatorios para este contribuyente en todo periodo ni que el formato vigente permanezca sin cambios. | [N2], [N6]; aplicabilidad y consolidación no examinadas en esta fase. | Confirmar régimen, umbrales, sistema de llevado, periodo y versión actual de cada formato antes de especificar la exportación final. | Alta como cautela; aplicación concreta **Pendiente de verificar**. |
| El número informal del documento legado no debe convertirse automáticamente en número de comprobante tributario. | [N6] y regla de migración ya documentada en [mapeo-legado.md](../domain/mapeo-legado.md). | Mantener separado el historial de almacén y la identificación formal de comprobantes; enlazarlos solo cuando exista una referencia verificable. | Alta |

### Implicaciones documentales

- El modelo de ventas debe permitir reconstruir los datos necesarios para el análisis del Registro de Ventas, incluyendo la relación de comprobantes, fechas y valores; la lista normativa definitiva de campos es **Pendiente de verificar**. Fuentes: [N2], [N5]. **Confianza: Media**.
- El modelo de movimientos debe distinguir entradas y salidas físicas por producto y almacén y preservar el origen legado, para evaluar el formato 12.1 sin perder auditoría. Fuentes: [N2], [mapeo-legado.md](../domain/mapeo-legado.md). **Confianza: Media**.
- No se declara implementado un generador de libros ni se concluye la obligatoriedad de llevarlos electrónicamente; esa decisión requiere confirmar el supuesto tributario de la empresa y las disposiciones vigentes. Fuente: [N2]. **Confianza: Alta** respecto del pendiente.

## Estudio de `UBL-Invoice-2.1.xsd`

### Identidad y alcance del esquema

| Afirmación | Fuente | Confianza |
|---|---|---|
| OASIS publica UBL 2.1 como estándar; el esquema local declara versión 2.1 y el espacio de nombres `Invoice-2`. | [N3], encabezado de [UBL-Invoice-2.1.xsd](../reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd), [N7]. | Alta |
| `Invoice` es el elemento raíz y el XSD importa componentes comunes Basic Components (`cbc`), Aggregate Components (`cac`) y Extension Components (`ext`). | [N4], declaraciones `xsd:element` e `xsd:import` del esquema. | Alta |
| El XSD organiza los elementos de cabecera y líneas en una secuencia; el XML debe respetar ese orden además de tipos y cardinalidades. | [N4], `InvoiceType` y su `xsd:sequence`. | Alta |

### Elementos y cardinalidades observados

Las cardinalidades siguientes describen el XSD UBL genérico, no la obligatoriedad SUNAT. Fuente de todas las filas: [`UBL-Invoice-2.1.xsd`](../reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd). **Confianza: Alta**.

| Elemento en `Invoice` | Cardinalidad XSD | Lectura |
|---|---:|---|
| `ext:UBLExtensions` | 0..1 | Contenedor opcional de extensiones. Su presencia no demuestra por sí misma que el XML esté firmado correctamente. |
| `cbc:UBLVersionID` | 0..1 | Identificador de versión UBL opcional en el esquema genérico. |
| `cbc:CustomizationID` | 0..1 | Identificador de personalización opcional. |
| `cbc:ID` | 1..1 | Identificador de factura requerido por el esquema. |
| `cbc:IssueDate` | 1..1 | Fecha de emisión requerida por el esquema. |
| `cbc:IssueTime` | 0..1 | Hora de emisión opcional. |
| `cbc:InvoiceTypeCode` | 0..1 | Código de tipo de factura opcional en el XSD genérico. |
| `cbc:DocumentCurrencyCode` | 0..1 | Código de moneda opcional en el XSD genérico. |
| `cac:AccountingSupplierParty` | 1..1 | Información de la parte proveedora requerida. |
| `cac:AccountingCustomerParty` | 1..1 | Información de la parte cliente requerida. |
| `cac:TaxTotal` | 0..n | Agregado de total de impuestos opcional y repetible. |
| `cac:LegalMonetaryTotal` | 1..1 | Totales monetarios legales requeridos. |
| `cac:InvoiceLine` | 1..n | Al menos una línea de factura. |

**Consecuencia:** que `InvoiceTypeCode` o `DocumentCurrencyCode` sean opcionales en el XSD no significa que SUNAT los considere opcionales; y que un elemento sea obligatorio en XSD no prueba todas las condiciones legales de su contenido. Fuente: [N4], [N5]. **Confianza: Alta**.

### Componentes de impuestos y límites de validación

| Afirmación | Fuente | Implicación | Confianza |
|---|---|---|---|
| `cac:TaxCategory` incluye `cbc:TierRange` con cardinalidad 0..1; su tipo básico en UBL es `TextType` y su documentación lo describe como rango de importes gravables que determina la tasa aplicable. | [UBL-CommonAggregateComponents-2.1.xsd](../reference/ubl-2.1/common/UBL-CommonAggregateComponents-2.1.xsd), [UBL-CommonBasicComponents-2.1.xsd](../reference/ubl-2.1/common/UBL-CommonBasicComponents-2.1.xsd), [N3]. | El XSD valida que el elemento exista en esa ubicación y que tenga contenido compatible con el tipo, pero no valida los códigos peruanos 01/02/03 ni que representen sistemas ISC. | Alta |
| El XSD genérico no contiene por sí mismo el catálogo SUNAT 08 ni la regla de cuándo es obligatorio seleccionar un sistema de cálculo. | [N4] (tipo textual y cardinalidad opcional), comparación con catálogo de proyecto [N5]. | La lista de códigos, el valor de cada método y las condiciones de uso requieren validación contra catálogo/anexo y guía técnica SUNAT. | Alta |
| La matriz y el catálogo del proyecto proponen colocar Catálogo 08 en `cbc:TierRange`, pero esa correspondencia no está demostrada únicamente por UBL 2.1 y requiere verificación específica. | [N5], [N4]. | No fijar todavía el serializador ISC ni aceptar esa correspondencia como regla normativa definitiva. Estado: **Pendiente de verificar**. | Alta |
| `cbc:TaxExemptionReasonCode` y `cbc:TierRange` son elementos semánticamente distintos en UBL; el primero se documenta como motivo de exención y el segundo como rango de impuesto por niveles. | [UBL-CommonAggregateComponents-2.1.xsd](../reference/ubl-2.1/common/UBL-CommonAggregateComponents-2.1.xsd), [N3]. | No intercambiar el código de afectación IGV del Catálogo 07 con el valor que finalmente corresponda a Catálogo 08. | Alta |
| La validación XSD no sustituye reglas de catálogo SUNAT, cálculo de tributos, reglas de serie/correlativo, firma criptográfica ni aceptación de un receptor. | [N3], [N4]; comparación con pendientes de [N5]. | Separar validadores estructurales, tributarios y de integración en las especificaciones. | Alta |

## Por qué el Catálogo 08 es el punto clave

| Afirmación | Fuente | Confianza |
|---|---|---|
| El proyecto identifica el Catálogo 08 como los tipos de sistema de cálculo del ISC y enumera tres alternativas: sistema al valor, monto fijo y sistema de precios de venta al público. Esa lista es el catálogo incorporado en el repositorio y no una transcripción ya certificada de la fuente oficial vigente. | [catalogos-sunat.md](../domain/catalogos-sunat.md). | Media; el propio catálogo requiere contraste oficial. |
| En una misma línea comercial pueden coexistir más de un tributo; el modelo debe representar la clasificación del tributo y los datos necesarios para calcularlo sin reducir todo a una única tasa. | [N5] como modelo preliminar; la obligación y reglas de cálculo están **Pendiente de verificar** en norma/guía oficial. | Media |
| La elección del sistema ISC afecta la información de cálculo requerida por producto/línea y puede interactuar con bases de otros tributos. Los importes, tasas, orden de cálculo y reglas aplicables no se establecen aquí. | [N5]; texto normativo aplicable **Pendiente de verificar**. | Media |
| UBL 2.1 permite un `cbc:TierRange` genérico, pero lo define como rango tributario, no como una enumeración SUNAT de métodos ISC. | [N3], [N4]. | Alta |
| Por tanto, Catálogo 08 es un punto crítico porque afecta tanto el cálculo del ISC como su representación serializada; el mapeo concreto a UBL debe validarse antes de codificar. | Síntesis de [N4] y [N5]. | Alta para la criticidad; **Pendiente de verificar** para el mapeo y reglas fiscales. |

**Acción requerida antes de cerrar el diseño:** confrontar la lista y descripción del Catálogo 08 con la fuente oficial SUNAT vigente y su guía de elaboración XML; verificar la ubicación del campo, las reglas de cálculo para cada método y la relación de ISC con la base del IGV. Hasta entonces, mantener estas decisiones como **Pendiente de verificar**. Fuentes: [N4], [N5]. **Confianza: Alta** respecto del pendiente.

## Pendientes de verificación normativa

| Pendiente | Qué debe verificarse | Estado / fuente de partida |
|---|---|---|
| Vigencia y modificaciones | Texto consolidado y disposiciones modificatorias aplicables a RS 097-2012 y RS 234-2006. | **Pendiente de verificar** en las publicaciones oficiales [N1], [N2]. |
| Aplicabilidad empresarial | Obligación de llevar formatos 14.1 y 12.1 para el contribuyente y periodo concretos. | **Pendiente de verificar**; no se conocen todos los datos tributarios de ABC Software Corp. |
| Contenido vigente de libros | Campos, formatos y medios/validaciones actuales de 14.1 y 12.1. | **Pendiente de verificar** con anexos, modificaciones y guías vigentes [N2]. |
| Reglas del SEE | Requisitos actuales de emisión, firma, envío, respuesta y contingencia, incluidos los que dependan de un OSE. | **Pendiente de verificar**; no se citan artículos ni plazos en este documento [N1]. |
| Perfil UBL SUNAT | Valores requeridos para `UBLVersionID`, `CustomizationID`, `InvoiceTypeCode`, moneda, secuencia de XML y demás restricciones nacionales. | **Pendiente de verificar** con guías y anexos técnicos SUNAT; el XSD genérico [N4] no los determina. |
| Catálogo 08 | Fuente oficial, códigos vigentes, semántica, condiciones de obligatoriedad y elemento/estructura UBL de destino. | **Pendiente de verificar**; el repositorio contiene una propuesta [N5], no validación oficial. |
| Cálculos tributarios | Tasas, bases, redondeos y reglas para IGV, ISC, ICBPER e IVAP. | **Pendiente de verificar** en normas y guías oficiales aplicables. |

## Método de verificación y uso de IA

- La lectura del XSD local se usa para afirmar nombres, tipos y cardinalidades estructurales; la referencia normativa de UBL es OASIS [N3]. **Confianza: Alta**.
- Los efectos descritos para ventas, inventario y emisión son traducciones de diseño a partir de las fuentes identificadas, no citas literales de una obligación adicional. Fuentes: [N1], [N2], [N6]. **Confianza: Alta** en la separación entre fuente y derivación.
- Las herramientas de IA pueden ayudar a localizar diferencias y resumir documentos, pero cada afirmación legal debe cotejarse con el texto oficial vigente y sus modificaciones. La IA no reemplaza a SUNAT, una fuente legal ni asesoría profesional. Fuentes de verificación citadas en [N1]–[N3]. **Confianza: Alta** como criterio de trabajo.
- No se inventan artículos, plazos ni obligaciones no contrastadas: cuando la fuente disponible no permite confirmarlos, se indica **Pendiente de verificar**. **Confianza: Alta** respecto del tratamiento aplicado en este documento.
