# Feature Specification: Emisión de factura electrónica

- **ID**: `FEAT-001`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Target Release / Milestone**: `Pendiente de definir`
- **Created**: `2026-10-22`
- **Last Updated**: `2026-10-22`

---

## 1. Context & Problem Statement

ABC Software Corp requiere registrar ventas mayoristas y minoristas como facturas electrónicas estructuradas en UBL 2.1. El sistema debe validar cliente, serie, correlativo, moneda e impuestos antes de persistir y enviar el comprobante a SUNAT u OSE/PSE. Esta especificación desarrolla UC-01 y se apoya en UC-05 (envío y CDR), UC-10 (productos e impuestos) y UC-11 (series y correlativos).

Los datos de los catálogos y reglas tributarias de `specs/domain/catalogos-sunat.md` fueron aportados para esta fase y deben contrastarse con el anexo SUNAT oficial antes de la entrega final.

## 2. Goals & Non-Goals

### Goals

- [ ] Especificar la preparación y validación de una factura electrónica antes del envío.
- [ ] Validar los datos del cliente, tipo de comprobante, moneda, serie, correlativo y tributos usando las referencias SUNAT y UBL indicadas.
- [ ] Especificar el estado del comprobante cuando SUNAT/OSE no responde, sin presentarlo como aceptado.
- [ ] Mantener separadas las reglas de dominio de los adaptadores de persistencia y envío.

### Non-Goals

- Emisión de boletas: feature futura.
- Emisión de notas de crédito y débito: especificada en `003-emitir-nota-credito-debito.md`.
- Anulación de comprobantes: especificada en `004-anular-comprobante.md`.
- Emisión de guías de remisión: feature futura.
- Especificación detallada de la firma digital: feature futura.
- Implementación del contrato OpenAPI (definido en `specs/contracts/api.yaml`, operación `createInvoice`).

## 3. User Personas & Use Cases

### Personas

- **Vendedor/cajero:** registra la venta y solicita emitir la factura.
- **Administrador:** configura productos, impuestos, series y correlativos.
- **Contador:** consulta el comprobante y sus documentos resultantes.

### User Stories & Scenarios

- **US-1:** Como vendedor/cajero, quiero emitir una factura con datos validados para registrar la venta y enviarla a SUNAT/OSE.
  - **Escenario 1.1:** La factura y sus líneas cumplen las validaciones; el sistema calcula los tributos y registra el comprobante.
  - **Escenario 1.2:** Un RUC o código tributario no es válido; el sistema explica el error y no registra la factura.
- **US-2:** Como administrador, quiero configurar la afectación IGV e ISC de los productos para que el cálculo de cada línea use los datos tributarios configurados.
  - **Escenario 2.1:** Una línea incluye ISC con su sistema de cálculo Catálogo 08; el ISC forma parte de la base de cálculo IGV según la regla aportada.
  - **Escenario 2.2:** Una línea tiene ISC, pero no tiene sistema de cálculo; el sistema rechaza la solicitud con un error claro.
- **US-3:** Como vendedor/cajero, quiero conocer el estado del envío para distinguir una factura pendiente de una aceptada.
  - **Escenario 3.1:** SUNAT/OSE no responde; el comprobante queda `PENDIENTE_ENVIO` y puede reintentarse mediante el caso de uso de reenvío.

## 4. Detailed Requirements & Behavior

### Functional Requirements

- **FR-1 — Tipo de comprobante:** la factura debe identificarse como código `01` del Catálogo 01 en `cbc:InvoiceTypeCode`.
- **FR-2 — Identificación del cliente:** el cliente de factura debe tener tipo de documento RUC, código `6` del Catálogo 06, representado en `schemeID` del `cbc:ID` del cliente. El RUC debe tener 11 dígitos e incluir dígito verificador. El algoritmo de comprobación del dígito verificador está **Pendiente de verificar**.
- **FR-3 — Serie y correlativo:** validar la serie de factura `F` seguida de 3 caracteres alfanuméricos y, si se proporciona, un correlativo numérico de hasta 8 dígitos. Si se omite, asignar el siguiente de la serie activa, conforme a `create-invoice.request.schema.json`. Serie y correlativo forman el identificador del comprobante en `cbc:ID`; la secuencia, unicidad normativa y estructura XML exacta están **Pendiente de verificar**.
- **FR-4 — Moneda:** aceptar los códigos `PEN` y `USD` aportados de ISO 4217 en `cbc:DocumentCurrencyCode`. La moneda seleccionada debe aplicarse uniformemente a los importes de la factura.
- **FR-5 — Afectación IGV:** cada línea debe incluir un código existente del Catálogo 07 en `cbc:TaxExemptionReasonCode`, ubicado en `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory`. Un código que no pertenezca al catálogo se rechaza.
- **FR-6 — Sistema ISC:** si una línea está afecta al ISC, debe proporcionar un código del Catálogo 08 en `cbc:TierRange` (`cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory`) y el tributo ISC se identifica mediante Catálogo 05 código `2000` en `cac:TaxScheme/cbc:ID`. Tasas y parámetros para calcular ISC están **Pendiente de verificar**.
- **FR-7 — Base IGV con ISC:** cuando una línea incluye ISC, calcular la base IGV como `valor de venta + ISC`, conforme a la regla documentada junto con el Catálogo 08. No inferir tasa ni monto ISC sin una configuración verificada.
- **FR-8 — Cálculo IGV:** para una operación gravada con Catálogo 07 código `10`, calcular IGV al 18% de la base IGV. Identificar el tributo como Catálogo 05 código `1000` en `cac:TaxScheme/cbc:ID`. La ubicación XML exacta del porcentaje permanece **Pendiente de verificar**.
- **FR-9 — Totales:** calcular y devolver, como mínimo, base imponible, importe IGV, importe ISC si aplica y total de la factura, en la moneda indicada por `cbc:DocumentCurrencyCode`. Reglas de redondeo y tratamiento de otras afectaciones del Catálogo 07: **Pendiente de verificar**.
- **FR-10 — Envío y estado:** solicitar el envío a SUNAT/OSE y asociar la respuesta o CDR disponible al comprobante. Si el destino no responde, conservar el comprobante con estado `PENDIENTE_ENVIO`; no cambiarlo a `ACEPTADO` sin una respuesta válida. La integración sigue UC-05.
- **FR-11 — Errores de validación:** ante datos inválidos, responder con error de validación y mensaje claro que identifique el dato que debe corregirse; no crear una factura válida como resultado de una solicitud rechazada.
- **FR-12 — ICBPER:** si una línea corresponde a bolsas plásticas, el tributo ICBPER se identifica con Catálogo 05 código `7152` en `cac:TaxScheme/cbc:ID` (`cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme`). La cantidad de bolsas se informa en la línea (`icbperQuantity`). Según la RS 150-2019/SUNAT (Anexo I), la cantidad de bolsas va en `cac:TaxSubtotal/cbc:BaseUnitMeasure` y la tasa por bolsa en `cac:TaxSubtotal/cac:TaxCategory/cbc:PerUnitAmount`; el ICBPER suma al monto total de tributos. Monto vigente por bolsa y si el ICBPER integra o no la base IGV: **Pendiente de verificar**.

### Non-Functional Requirements

- **Usabilidad:** los mensajes de error deben ser claros y ayudar a corregir los datos.
- **Disponibilidad:** si SUNAT/OSE no responde, mantener el comprobante pendiente y disponible para la cola de reenvío; alineado con UC-06.
- **Rendimiento:** generar PDF/XML sin bloquear el flujo de emisión. Los umbrales de rendimiento están **Pendiente de definir**.
- **Seguridad:** proteger tokens OSE y certificados digitales y nunca incluirlos en el código fuente.

## 5. Technical Contracts & Data Schemas

### API / Interface Contract

Resumen de la interfaz. El contrato formal es `specs/contracts/api.yaml` (OpenAPI 3.1, operación `createInvoice`); ante una discrepancia, prevalece el contrato.

**Convención de nombres:** los nombres de campos JSON de la API se mantienen en inglés `camelCase` (por ejemplo, `documentNumber`, `igvAffectationCode`). Los valores de catálogo SUNAT se conservan como códigos literales (`"6"`, `"10"`, `"01"`) y los estados del comprobante en español (`PENDIENTE_ENVIO`). Los DTOs formales están en `specs/contracts/schemas/` (`create-invoice.request.schema.json`, `invoice.response.schema.json`, `customer.schema.json`, `product.schema.json`, `error.response.schema.json`).

- **Método y ruta:** `POST /api/v1/comprobantes/facturas`
- **Propósito:** validar y registrar una factura, asignar el siguiente correlativo de la serie si no se proporciona, iniciar su envío y devolver el identificador, estado y totales calculados.
- **Resultado esperado:** `201 Created` cuando la solicitud válida crea el comprobante. Errores de validación: `400 Bad Request`; correlativo duplicado: `409 Conflict`; regla tributaria o de negocio incumplida: `422 Unprocessable Entity`. Autenticación `bearerAuth` y errores con `error.response.schema.json`, según `specs/contracts/api.yaml`.

**Ejemplo ilustrativo de request JSON** — los importes y datos identificatorios son datos de ejemplo, no una regla ni una credencial real:

```json
{
  "customer": {
    "documentType": "6",
    "documentNumber": "20123456789",
    "legalName": "Cliente de ejemplo"
  },
  "series": "F001",
  "correlative": "123",
  "currency": "PEN",
  "items": [
    {
      "description": "Producto gravado",
      "quantity": 1,
      "unitSaleValue": 100.00,
      "igvAffectationCode": "10"
    }
  ]
}
```

El número de RUC del ejemplo es ilustrativo; no se afirma que pase la validación del dígito verificador.

**Ejemplo ilustrativo de response JSON**:

```json
{
  "id": "comprobante-ejemplo",
  "documentType": "01",
  "series": "F001",
  "correlative": "123",
  "currency": "PEN",
  "totals": {
    "taxableBase": 100.00,
    "igvAmount": 18.00,
    "iscAmount": 0.00,
    "totalAmount": 118.00
  },
  "status": "PENDIENTE_ENVIO"
}
```

Los identificadores anteriores son datos de ejemplo, no valores SUNAT.

### Architecture

Monolito MVC desacoplado, con una separación que permita evolucionar hacia Arquitectura Hexagonal:

**Controller (MVC) → Service de aplicación → Dominio (cálculo de impuestos y validaciones) → Puertos (`ComprobanteRepository`, `FirmadorXml`, `EnviadorComprobantes`) → Adaptadores (TypeORM, SUNAT directo, Nubefact).**

El controlador recibe la solicitud y coordina el flujo mediante el servicio de aplicación. El dominio aplica las reglas; los puertos expresan las dependencias y los adaptadores concretos integran persistencia y proveedores externos. El detalle de firma digital queda fuera del alcance de esta feature.

### Data Model & Persistence

Esta especificación no define entidades ni esquemas de persistencia. El modelo de dominio (entidades, objetos de valor, estados e invariantes) está en `specs/domain/modelo-dominio.md`; el mapeo de datos históricos, en `specs/domain/mapeo-legado.md`.

## 6. Acceptance Criteria (Given-When-Then / BDD)

```gherkin
Feature: Emitir factura electrónica

  Scenario: Emitir factura válida con producto gravado
    Given un cliente con RUC válido de 11 dígitos y tipo de documento Catálogo 06 código "6"
    And una serie "F001", un correlativo numérico de hasta 8 dígitos y moneda "PEN"
    And una línea con afectación IGV Catálogo 07 código "10" y valor de venta 100.00
    When se solicita emitir la factura identificada como Catálogo 01 código "01"
    Then la respuesta es 201
    And el IGV calculado es 18.00, equivalente al 18% de la base imponible de 100.00
    And el tributo IGV se identifica con Catálogo 05 código "1000"
    And el importe total es 118.00

  Scenario: Calcular IGV sobre valor de venta más ISC
    Given una línea gravada con Catálogo 07 código "10" y valor de venta 100.00
    And la línea tiene ISC con un sistema de cálculo Catálogo 08 configurado
    And el cálculo configurado de ISC para esta prueba produce 10.00
    When el sistema calcula los tributos de la factura
    Then la base IGV es 110.00, igual al valor de venta más el ISC
    And el IGV es 19.80, equivalente al 18% de 110.00
    And el tributo ISC se identifica con Catálogo 05 código "2000"

  Scenario: Rechazar RUC de cliente inválido
    Given una solicitud de factura cuyo cliente tiene un RUC con menos de 11 dígitos
    When se solicita emitir la factura
    Then la respuesta es 400
    And el mensaje indica claramente que el RUC debe tener 11 dígitos y un dígito verificador válido
    And no se registra la factura como válida

  Scenario: Rechazar código de afectación inexistente
    Given una solicitud de factura con un código de afectación que no existe en el Catálogo 07
    When se solicita emitir la factura
    Then la respuesta es 400
    And el mensaje identifica el código de afectación inválido y el Catálogo 07
    And no se registra la factura como válida

  Scenario: Rechazar producto con ISC sin sistema de cálculo
    Given una línea de factura marcada como afecta al ISC
    And la línea no incluye un sistema de cálculo del Catálogo 08 en cbc:TierRange
    When se solicita emitir la factura
    Then la respuesta es 400
    And el mensaje indica que falta el sistema de cálculo ISC
    And no se registra la factura como válida

  Scenario: Mantener factura pendiente cuando SUNAT u OSE no responde
    Given una factura válida y registrada para envío
    And SUNAT/OSE no responde a la solicitud
    When finaliza el intento de envío
    Then el estado del comprobante es "PENDIENTE_ENVIO"
    And el estado no es "ACEPTADO"
    And el comprobante queda disponible para reintento según UC-06
```

## 7. Verification & Test Plan

- **Unit Tests:** verificar validación de RUC, formato de serie y correlativo, moneda permitida, códigos de Catálogo 07/08, cálculo IGV y totales. Algoritmo del dígito verificador, redondeo y tasas ISC requieren definición verificada antes de probarse como regla normativa.
- **Integration Tests:** verificar persistencia por el puerto `ComprobanteRepository` y manejo de respuestas/no respuesta de los adaptadores de envío, sin depender de credenciales reales en las pruebas.
- **Acceptance / Contract Tests:** test de aceptación previsto en `backend/test/001-emitir-factura.e2e-spec.ts` (no crear todavía). Debe cubrir los escenarios Gherkin y contrastarse con `specs/contracts/api.yaml`.

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
