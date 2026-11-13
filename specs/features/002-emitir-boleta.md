# Feature Specification: Emisión de boleta electrónica

- **ID**: `FEAT-002`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Target Release / Milestone**: `Pendiente de definir`
- **Created**: `2026-11-11`
- **Last Updated**: `2026-11-11`

---

## 1. Context & Problem Statement

ABC Software Corp requiere registrar ventas minoristas como boletas electrónicas estructuradas en UBL 2.1. Esta especificación desarrolla UC-02 y comparte con FEAT-001 las validaciones de moneda, líneas e impuestos, el registro y el envío a SUNAT u OSE/PSE. A diferencia de la factura, la boleta admite cliente con DNI (Catálogo 06, código `1`) o sin documento (código `0`).

Los catálogos de `specs/domain/catalogos-sunat.md` se contrastaron con los anexos oficiales SUNAT (RS 245-2017 y RS 150-2019). Ese contraste mostró que el Catálogo 06 código `0` significa "documento tributario de no domiciliado sin RUC", no "sin documento"; por eso el uso de `0` para un cliente de boleta sin documento es un **supuesto provisional** y el código correcto queda **Pendiente de verificar**. El formato de serie de boleta también debe confirmarse contra la fuente oficial.

## 2. Goals & Non-Goals

### Goals

- [ ] Especificar la preparación, validación y registro de una boleta electrónica antes del envío.
- [ ] Identificar la boleta con Catálogo 01 código `03` y validar una serie `B` seguida de 3 caracteres alfanuméricos.
- [ ] Admitir clientes con DNI (Catálogo 06 código `1`) o sin documento (supuesto provisional: código `0`).
- [ ] Especificar tributos compartidos con la factura, incluido ICBPER Catálogo 05 código `7152`.
- [ ] Mantener separadas las reglas de dominio de los adaptadores de persistencia y envío.

### Non-Goals

- Emisión de facturas: especificada en `001-emitir-factura.md`.
- Emisión de notas de crédito y débito: especificada en `003-emitir-nota-credito-debito.md`.
- Anulación de comprobantes: especificada en `004-anular-comprobante.md`.
- Emisión de guías de remisión: feature futura.
- Especificación detallada de la firma digital: feature futura.
- Implementación del contrato OpenAPI (definido en `specs/contracts/api.yaml`, operación `createReceipt`).

## 3. User Personas & Use Cases

### Personas

- **Vendedor/cajero:** registra una venta minorista y solicita emitir la boleta.
- **Administrador:** configura productos, impuestos, series y correlativos.
- **Contador:** consulta el comprobante y sus documentos resultantes.

### User Stories & Scenarios

- **US-1:** Como vendedor/cajero, quiero emitir una boleta con datos validados para registrar la venta y enviarla a SUNAT/OSE.
  - **Escenario 1.1:** La boleta, el cliente y sus líneas cumplen las validaciones; el sistema calcula tributos y registra el comprobante.
  - **Escenario 1.2:** Se usa una serie de factura; el sistema rechaza la solicitud y no registra una boleta válida.
- **US-2:** Como vendedor/cajero, quiero incluir bolsas plásticas en la venta para que se calcule y declare el ICBPER correspondiente.
  - **Escenario 2.1:** Una línea informa la cantidad de bolsas y el monto unitario ICBPER está configurado; el sistema incluye el tributo Catálogo 05 código `7152` en los totales.
- **US-3:** Como vendedor/cajero, quiero emitir una boleta para un cliente con DNI o sin documento para registrar ventas minoristas.
  - **Escenario 3.1:** El cliente presenta DNI válido de 8 dígitos, Catálogo 06 código `1`.
  - **Escenario 3.2:** El cliente no presenta documento (supuesto provisional: Catálogo 06 código `0`); no se envía `documentNumber`. El código oficial para este caso queda **Pendiente de verificar**.

## 4. Detailed Requirements & Behavior

### Functional Requirements

- **FR-1 — Tipo de comprobante:** la boleta debe identificarse como código `03` del Catálogo 01 en `cbc:InvoiceTypeCode`.
- **FR-2 — Identificación del cliente:** admitir cliente con DNI, código `1` del Catálogo 06 y 8 dígitos, o sin documento, con el código `0` como supuesto provisional (oficialmente `0` = doc. tributario no domiciliado sin RUC). Para ese caso `documentNumber` se omite. El código oficial para un cliente sin documento y su representación UBL están **Pendiente de verificar**.
- **FR-3 — Serie y correlativo:** validar una serie de boleta que empiece con `B` y continúe con 3 caracteres alfanuméricos (`^B[A-Z0-9]{3}$`), y, si se proporciona, un correlativo numérico de hasta 8 dígitos. Si se omite, asignar el siguiente de la serie activa. La secuencia, unicidad normativa y estructura XML exacta están **Pendiente de verificar**. Una serie `F` de factura debe rechazarse.
- **FR-4 — Moneda:** aceptar los códigos `PEN` y `USD` aportados de ISO 4217 en `cbc:DocumentCurrencyCode`. La moneda seleccionada debe aplicarse uniformemente a los importes de la boleta.
- **FR-5 — Afectación IGV:** cada línea debe incluir un código existente del Catálogo 07 en `cbc:TaxExemptionReasonCode`, ubicado en `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory`. Un código que no pertenezca al catálogo se rechaza.
- **FR-6 — Sistema ISC:** si una línea está afecta al ISC, debe proporcionar un código del Catálogo 08 en `cbc:TierRange`; el tributo ISC se identifica mediante Catálogo 05 código `2000` en `cac:TaxScheme/cbc:ID`. Tasas y parámetros para calcular ISC están **Pendiente de verificar**. La regla detallada está en FEAT-001 (FR-6 y FR-7).
- **FR-7 — ICBPER:** si una línea corresponde a bolsas plásticas, registrar su cantidad (`icbperQuantity`) e identificar el tributo con Catálogo 05 código `7152` en `cac:TaxScheme/cbc:ID`. El sistema calcula el importe con el monto unitario configurado; si falta dicho parámetro, no debe inventar el importe. Monto unitario y ubicación XML exacta están **Pendiente de verificar**.
- **FR-8 — Totales:** calcular y devolver, como mínimo, base imponible, IGV, ISC si aplica, ICBPER si aplica e importe total, en la moneda indicada por `cbc:DocumentCurrencyCode`. Reglas de redondeo y tratamiento de otras afectaciones del Catálogo 07: **Pendiente de verificar**.
- **FR-9 — Envío y estado:** solicitar el envío a SUNAT/OSE y asociar la respuesta o CDR disponible a la boleta. Si el destino no responde, conservar el comprobante con estado `PENDIENTE_ENVIO`; no cambiarlo a `ACEPTADO` sin respuesta válida. La integración sigue UC-05.
- **FR-10 — Errores de validación:** ante datos inválidos, responder con error de validación claro que identifique el dato que debe corregirse; no crear una boleta válida como resultado de una solicitud rechazada.

### Non-Functional Requirements

- **Usabilidad:** los mensajes de error deben ser claros y ayudar a corregir los datos.
- **Disponibilidad:** si SUNAT/OSE no responde, mantener la boleta pendiente y disponible para la cola de reenvío; alineado con UC-06.
- **Rendimiento:** generar PDF/XML sin bloquear el flujo de emisión. Los umbrales de rendimiento están **Pendiente de definir**.
- **Seguridad:** proteger tokens OSE y certificados digitales y nunca incluirlos en el código fuente.

## 5. Technical Contracts & Data Schemas

### API / Interface Contract

Resumen de la interfaz. El contrato formal es `specs/contracts/api.yaml` (OpenAPI 3.1, operación `createReceipt`); ante una discrepancia, prevalece el contrato.

**Convención de nombres:** los nombres de campos JSON de la API se mantienen en inglés `camelCase`. Los valores de catálogo SUNAT se conservan como códigos literales (`"03"`, `"1"`, `"0"`, `"10"`, `"7152"`) y los estados del comprobante en español (`PENDIENTE_ENVIO`). El request se define en `create-receipt.request.schema.json`; la respuesta en `receipt.response.schema.json`.

- **Método y ruta:** `POST /api/v1/comprobantes/boletas`
- **Propósito:** validar y registrar una boleta, asignar el siguiente correlativo de la serie si no se proporciona, iniciar su envío y devolver identificador, estado y totales calculados.
- **Resultado esperado:** `201 Created` cuando la solicitud válida crea el comprobante. Errores de validación: `400 Bad Request`; correlativo duplicado: `409 Conflict`; regla tributaria o de negocio incumplida: `422 Unprocessable Entity`. Autenticación `bearerAuth` y errores con `error.response.schema.json`.

**Ejemplo ilustrativo de request JSON** — no afirma que el monto ICBPER ni otros importes sean valores tributarios oficiales:

```json
{
  "customer": {
    "documentType": "1",
    "documentNumber": "12345678",
    "legalName": "Cliente de ejemplo"
  },
  "series": "B001",
  "correlative": "125",
  "currency": "PEN",
  "items": [
    {
      "description": "Producto con bolsa plástica",
      "quantity": 1,
      "unitSaleValue": 10.00,
      "igvAffectationCode": "10",
      "icbperQuantity": 1
    }
  ]
}
```

Para un cliente sin documento, `documentType` es `"0"` (supuesto provisional) y se omite `documentNumber`; el código oficial y la representación XML están **Pendiente de verificar**.

### Architecture

Monolito MVC desacoplado, con una separación que permita evolucionar hacia Arquitectura Hexagonal:

**Controller (MVC) → Service de aplicación → Dominio (cálculo de impuestos y validaciones) → Puertos (`ComprobanteRepository`, `FirmadorXml`, `EnviadorComprobantes`) → Adaptadores (TypeORM, SUNAT directo, Nubefact).**

El controlador recibe la solicitud y coordina el flujo mediante el servicio de aplicación. El dominio aplica las reglas; los puertos expresan las dependencias y los adaptadores concretos integran persistencia y proveedores externos. El detalle de firma digital queda fuera del alcance de esta feature.

### Data Model & Persistence

Esta especificación no define entidades ni esquemas de persistencia. El modelo de dominio (entidades, objetos de valor, estados e invariantes) está en `specs/domain/modelo-dominio.md`; el mapeo de datos históricos, en `specs/domain/mapeo-legado.md`.

## 6. Acceptance Criteria (Given-When-Then / BDD)

```gherkin
Feature: Emitir boleta electrónica

  Scenario: Emitir boleta válida para cliente con DNI
    Given un cliente con DNI de 8 dígitos y tipo de documento Catálogo 06 código "1"
    And una serie "B001", un correlativo numérico de hasta 8 dígitos y moneda "PEN"
    And una línea con afectación IGV Catálogo 07 código "10" y valor de venta 100.00
    When se solicita emitir la boleta identificada como Catálogo 01 código "03"
    Then la respuesta es 201
    And el documento del cliente se representa con schemeID "1"
    And el IGV calculado es 18.00
    And el importe total es 118.00

  Scenario: Emitir boleta para cliente sin documento
    Given un cliente sin documento con tipo Catálogo 06 código "0" y nombre informado
    And no se envía el campo documentNumber
    And la serie de boleta es "B001"
    When se solicita emitir la boleta
    Then la solicitud admite el tipo de cliente sin documento
    And el comprobante se identifica como Catálogo 01 código "03"
    And la representación UBL del identificador del cliente queda Pendiente de verificar

  Scenario: Calcular ICBPER por bolsas plásticas
    Given una boleta válida con una línea gravada con Catálogo 07 código "10"
    And la línea informa icbperQuantity igual a 2
    And existe un monto unitario ICBPER configurado para la prueba
    When el sistema calcula los tributos de la boleta
    Then el ICBPER se identifica con Catálogo 05 código "7152"
    And el importe ICBPER corresponde a 2 veces el monto unitario configurado
    And el total incluye el importe ICBPER calculado

  Scenario: Rechazar boleta con serie de factura
    Given una solicitud de boleta con serie "F001"
    When se solicita emitir la boleta
    Then la respuesta es 400
    And el mensaje indica que la serie debe comenzar con "B" y tener 3 caracteres alfanuméricos adicionales
    And no se registra una boleta válida

  Scenario: Rechazar ICBPER sin monto unitario configurado
    Given una boleta con una línea que informa icbperQuantity
    And no existe monto unitario ICBPER configurado
    When el sistema calcula los tributos de la boleta
    Then la respuesta indica una regla tributaria no configurada
    And el sistema no inventa el importe ICBPER

  Scenario: Mantener boleta pendiente cuando SUNAT u OSE no responde
    Given una boleta válida y registrada para envío
    And SUNAT/OSE no responde a la solicitud
    When finaliza el intento de envío
    Then el estado del comprobante es "PENDIENTE_ENVIO"
    And el estado no es "ACEPTADO"
    And el comprobante queda disponible para reintento según UC-06
```

## 7. Verification & Test Plan

- **Unit Tests:** verificar Catálogo 01 código `03`, tipo de cliente `1` o `0`, formato de DNI, formato de serie y correlativo, moneda, códigos tributarios y totales. El código oficial del cliente sin documento, el monto unitario ICBPER y reglas de redondeo requieren definición verificada antes de probarse como regla normativa.
- **Integration Tests:** verificar persistencia por el puerto `ComprobanteRepository` y manejo de respuestas/no respuesta de los adaptadores de envío, sin depender de credenciales reales en las pruebas.
- **Acceptance / Contract Tests:** test de aceptación previsto en `backend/test/002-emitir-boleta.e2e-spec.ts` (no crear todavía). Debe cubrir los escenarios Gherkin y contrastarse con `specs/contracts/api.yaml`.

## 8. Rollout & Rollback Strategy

- **Feature flags / toggles:** Pendiente de definir.
- **Rollout phases:** Pendiente de definir.
- **Failure triggers and rollback procedure:** Pendiente de definir; no habilitar emisión productiva antes de verificar reglas SUNAT, conexión, certificados y pruebas de aceptación.

## 9. Review & Sign-Off

| Role | Reviewer | Status | Date |
|------|----------|--------|------|
| Engineering Lead | | Pending | |
| Product / Stakeholder | | Pending | |
| QA / Testing | | Pending | |