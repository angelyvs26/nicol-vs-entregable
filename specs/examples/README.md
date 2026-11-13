# Ejemplos de requests

Los ejemplos válidos e inválidos se validan con JSON Schema Draft 2020-12. Los importes y tasas de ISC son ilustrativos; no representan una liquidación tributaria validada.

| Archivo | Esquema | Resultado esperado |
|---|---|---|
| [factura-gravada.json](./factura-gravada.json) | [create-invoice.request.schema.json](../contracts/schemas/create-invoice.request.schema.json) | Válido |
| [factura-con-isc.json](./factura-con-isc.json) | [create-invoice.request.schema.json](../contracts/schemas/create-invoice.request.schema.json) | Válido |
| [boleta-con-icbper.json](./boleta-con-icbper.json) | [create-receipt.request.schema.json](../contracts/schemas/create-receipt.request.schema.json) | Válido |
| [invalido-factura-cliente-dni.json](./invalido-factura-cliente-dni.json) | [create-invoice.request.schema.json](../contracts/schemas/create-invoice.request.schema.json) | Inválido: la factura exige RUC (Catálogo 06, código `6`) |
| [invalido-afectacion-inexistente.json](./invalido-afectacion-inexistente.json) | [create-invoice.request.schema.json](../contracts/schemas/create-invoice.request.schema.json) | Inválido: `99` no está en el enum declarado del Catálogo 07 |
| [invalido-isc-sin-sistema.json](./invalido-isc-sin-sistema.json) | [create-invoice.request.schema.json](../contracts/schemas/create-invoice.request.schema.json) | Inválido: falta `iscSystem` cuando se informa `iscRate` |
| [nota-credito-devolucion.json](./nota-credito-devolucion.json) | [create-credit-note.request.schema.json](../contracts/schemas/create-credit-note.request.schema.json) | Válido: motivo `07` (devolución por ítem) del Catálogo 09 |
| [invalido-nota-debito-motivo-13.json](./invalido-nota-debito-motivo-13.json) | [create-debit-note.request.schema.json](../contracts/schemas/create-debit-note.request.schema.json) | Inválido: `13` existe en el Catálogo 09, pero no en el Catálogo 10 |

El esquema de boleta reutiliza el esquema de cliente y la definición de línea de factura. La serie se valida con `^B[A-Z0-9]{3}$`; la operación está definida en `POST /api/v1/comprobantes/boletas` y la feature asociada es `specs/features/002-emitir-boleta.md`. El cliente puede identificarse con DNI (Catálogo 06 código `1`) o sin documento (código `0`, omitiendo `documentNumber`). La representación UBL del cliente sin documento y la confirmación normativa del patrón de serie siguen **Pendiente de verificar**.

## Resultado de validación

Validación ejecutada con Ajv 8 (JSON Schema Draft 2020-12) y `ajv-formats`:

| Archivo | Resultado observado |
|---|---|
| `factura-gravada.json` | Válido |
| `factura-con-isc.json` | Válido |
| `boleta-con-icbper.json` | Válido |
| `invalido-factura-cliente-dni.json` | Rechazado: `customer.documentType` no es el valor requerido `6` |
| `invalido-afectacion-inexistente.json` | Rechazado: `igvAffectationCode` no pertenece al enum |
| `invalido-isc-sin-sistema.json` | Rechazado: falta `iscSystem` cuando se informa `iscRate` |
| `nota-credito-devolucion.json` | Válido |
| `invalido-nota-debito-motivo-13.json` | Rechazado: `reasonCode` no pertenece al enum del Catálogo 10 |

**Resultado total: 8/8 expectativas satisfechas.**

## XML generado (UBL 2.1)

| Archivo | Contenido |
|---|---|
| [factura-generador-input.json](./factura-generador-input.json) | Datos de entrada del generador `backend/src/ubl-invoice-xml-generator.ts`. |
| [factura-generada-F001-123.xml](./factura-generada-F001-123.xml) | XML `Invoice` UBL 2.1 generado (ISO-8859-1, `CustomizationID` 2.0 de SUNAT). Válido contra [`UBL-Invoice-2.1.xsd`](../reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd). |
| [R-20512345671-01-F001-123.xml](./R-20512345671-01-F001-123.xml) | CDR (`ApplicationResponse`) de SUNAT beta: factura aceptada. |
