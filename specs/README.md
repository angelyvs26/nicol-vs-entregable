# Índice final de especificaciones

Índice de los cuatro entregables técnicos del caso descrito en [caso-de-estudio.md](./caso-de-estudio.md). Las especificaciones siguen en fase documental. La única implementación es el generador del XML `Invoice` UBL 2.1 en [`backend/src/ubl-invoice-xml-generator.ts`](../backend/src/ubl-invoice-xml-generator.ts) (ver [README raíz](../README.md)).

## Análisis y marco normativo

| Archivo | Contenido |
|---|---|
| [01-analisis-del-caso.md](./docs/01-analisis-del-caso.md) | Brechas, supuestos, riesgos, glosario y uso de IA/verificación de fuentes. |
| [02-marco-normativo.md](./docs/02-marco-normativo.md) | RS 097-2012/SUNAT, RS 234-2006/SUNAT, formatos 14.1 y 12.1, análisis de UBL-Invoice-2.1.xsd y Catálogo 08. |
| [INFORME-FINAL.md](./docs/INFORME-FINAL.md) | Informe académico consolidado de la fase 1: análisis, marco normativo, casos de uso, funcionalidades, arquitectura, contratos, trazabilidad y pendientes. |

## Entregables

### 1. Modelo de dominio y contratos de datos

**Estado:** Draft — documentación y contratos especificados; reglas SUNAT pendientes de contraste oficial.

| Archivo | Contenido |
|---|---|
| [modelo-dominio.md](./domain/modelo-dominio.md) | Agregados, entidades, objetos de valor, puertos e invariantes INV. |
| [catalogos-sunat.md](./domain/catalogos-sunat.md) | Catálogos 01, 05, 06, 07 y 08, monedas y reglas de emisión aportadas. |
| [mapeo-legado.md](./domain/mapeo-legado.md) | Correspondencia de los datos históricos con el dominio. |
| [create-invoice.request.schema.json](./contracts/schemas/create-invoice.request.schema.json) | DTO JSON de emisión de factura. |
| [create-receipt.request.schema.json](./contracts/schemas/create-receipt.request.schema.json) | DTO JSON de request de boleta, utilizado por `POST /api/v1/comprobantes/boletas`. |
| [create-credit-note.request.schema.json](./contracts/schemas/create-credit-note.request.schema.json) | DTO JSON de request para nota de crédito con referencia obligatoria al original. |
| [create-debit-note.request.schema.json](./contracts/schemas/create-debit-note.request.schema.json) | DTO JSON de request para nota de débito con referencia obligatoria al original. |
| [note.response.schema.json](./contracts/schemas/note.response.schema.json) | DTO JSON de respuesta para notas de crédito y débito. |
| [cancel-comprobante.request.schema.json](./contracts/schemas/cancel-comprobante.request.schema.json) | DTO JSON para solicitar la anulación de un comprobante. |
| [cancellation.response.schema.json](./contracts/schemas/cancellation.response.schema.json) | DTO JSON del resultado de la solicitud de anulación y mecanismo seleccionado. |
| [invoice.response.schema.json](./contracts/schemas/invoice.response.schema.json) | DTO JSON de respuesta de factura y totales. |
| [receipt.response.schema.json](./contracts/schemas/receipt.response.schema.json) | DTO JSON de respuesta de boleta y totales. |
| [customer.schema.json](./contracts/schemas/customer.schema.json) | DTO JSON de cliente. |
| [product.schema.json](./contracts/schemas/product.schema.json) | DTO JSON de producto e impuestos. |
| [series.schema.json](./contracts/schemas/series.schema.json) | DTO JSON de series y correlativos. |
| [error.response.schema.json](./contracts/schemas/error.response.schema.json) | DTO JSON de errores. |
| [submission.response.schema.json](./contracts/schemas/submission.response.schema.json) | DTO JSON de resultado de envío/CDR. |
| [migration.response.schema.json](./contracts/schemas/migration.response.schema.json) | DTO JSON del resultado de migración del legado. |
| [casos-de-uso.md](./use-cases/casos-de-uso.md) | Actores, UC-01 a UC-18 y flujos de prioridad alta. |
| [investigacion-nubefact.md](./use-cases/investigacion-nubefact.md) | Investigación de referencia para integración y requisitos derivados. |
| [001-emitir-factura.md](./features/001-emitir-factura.md) | Feature FEAT-001; estado Draft, basada en UC-01, UC-05, UC-10 y UC-11. |
| [002-emitir-boleta.md](./features/002-emitir-boleta.md) | Feature FEAT-002; estado Draft, basada en UC-02, UC-05, UC-10 y UC-11. |
| [003-emitir-nota-credito-debito.md](./features/003-emitir-nota-credito-debito.md) | Feature FEAT-003; notas UBL CreditNote/DebitNote vinculadas al original; motivos Cat. 09 (01–13) y Cat. 10 (01–03) verificados con fuente SUNAT. |
| [004-anular-comprobante.md](./features/004-anular-comprobante.md) | Feature FEAT-004; comunicación de baja para factura y resumen diario para boleta; plazos pendientes de verificar. |

### 2. Diagramas de arquitectura MVC con visión a Hexagonal

**Estado:** Draft — diagramas y arquitectura objetivo documentados; decisiones ADR aceptadas.

| Archivo | Contenido |
|---|---|
| [arquitectura-mvc.md](./diagrams/arquitectura-mvc.md) | Capas MVC, flujo de emisión y manejo de respuesta SUNAT/OSE. |
| [arquitectura-hexagonal.md](./diagrams/arquitectura-hexagonal.md) | Dominio, puertos, adaptadores y transición MVC → Hexagonal. |
| [casos-de-uso.md](./diagrams/casos-de-uso.md) | Diagrama Mermaid de actores y casos de uso. |
| [c4-contexto.md](./diagrams/c4-contexto.md) | Diagrama Mermaid C4 de contexto del sistema. |
| [evolucion-microservicios.md](./diagrams/evolucion-microservicios.md) | Separación futura por servicios y comunicación por eventos. |
| [despliegue.md](./diagrams/despliegue.md) | MSI Windows, APK Android, backend central, PostgreSQL y proveedores. |
| [0001-mvc-con-vision-hexagonal.md](./adr/0001-mvc-con-vision-hexagonal.md) | ADR Accepted: monolito MVC con puertos. |
| [0002-envio-via-ose-o-sunat.md](./adr/0002-envio-via-ose-o-sunat.md) | ADR Accepted: puerto de envío, adaptadores y cola de reenvío. |
| [0003-empaquetado-msi-apk.md](./adr/0003-empaquetado-msi-apk.md) | ADR Accepted: Tauri 2 y backend central. |

### 3. Especificación de endpoints / servicios

**Estado:** Draft.

- [api.yaml](./contracts/api.yaml) — contrato OpenAPI 3.1 para facturas, boletas, notas de crédito/débito y solicitudes de anulación.

### 4. Matriz de trazabilidad normativa SUNAT ↔ UBL

**Estado:** Draft — referencias a XSD UBL revisadas; obligatoriedad y códigos SUNAT deben contrastarse con la fuente oficial.

- [matriz-sunat-ubl.md](./traceability/matriz-sunat-ubl.md) — requisitos, catálogos, elementos UBL, DTOs, invariantes INV y escenarios ESC.
- [matriz-requisitos-enunciado.md](./traceability/matriz-requisitos-enunciado.md) — exigencias del caso de estudio, documentos que las cubren y estado.

### Ejemplos de contrato

- [examples/](./examples/) — requests JSON válidos e inválidos con sus esquemas y resultados de validación.

## Referencias y plantillas

- [README de UBL 2.1](./reference/ubl-2.1/README.md) — referencia local de esquemas y ejemplo UBL.
- Plantillas en [`templates/`](./templates/).
- [ADR-0000: uso de ADR](./adr/0000-use-adr.md).
