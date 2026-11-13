# Feature Specification: Emisión de notas de crédito y débito

- **ID**: `FEAT-003`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Target Release / Milestone**: `Pendiente de definir`
- **Created**: `2026-11-12`
- **Last Updated**: `2026-11-12`

---

## 1. Context & Problem Statement

ABC Software Corp necesita emitir notas de crédito y débito vinculadas a un comprobante electrónico original. Cada nota corrige o ajusta ese comprobante y se registra para envío a SUNAT/OSE. La nota de crédito se estructura como UBL 2.1 `CreditNote` y la nota de débito como UBL 2.1 `DebitNote`, según sus XSD locales.

Los motivos de nota dependen del Catálogo 09 para crédito (códigos `01`–`13`, RS N.° 000165-2021/SUNAT) y del Catálogo 10 para débito (códigos `01`–`03`, RS N.° 245-2017/SUNAT). Ambos se consignan en `cac:DiscrepancyResponse/cbc:ResponseCode`. Las tablas y fuentes están en `specs/domain/catalogos-sunat.md`.

## 2. Goals & Non-Goals

### Goals

- [ ] Especificar la emisión de notas de crédito y débito asociadas a un comprobante original existente.
- [ ] Exigir la referencia original y usarla para preparar `cac:BillingReference` en UBL.
- [ ] Mantener separados los documentos UBL `CreditNote` y `DebitNote` y sus respectivos totales.
- [ ] Capturar y validar el motivo de la nota contra los Catálogos 09 y 10 oficiales.
- [ ] Registrar el resultado del envío y no inferir aceptación sin respuesta válida.

### Non-Goals

- Emisión de facturas y boletas: especificadas en `001-emitir-factura.md` y `002-emitir-boleta.md`.
- Anulación o comunicación de baja: especificada en `004-anular-comprobante.md`.
- Reglas de compatibilidad entre cada motivo y los importes de la nota (por ejemplo, que una devolución total iguale el total del original): feature futura.
- Especificación detallada de la firma digital: feature futura.

## 3. User Personas & Use Cases

### Personas

- **Vendedor/cajero:** solicita corregir o ajustar un comprobante mediante una nota.
- **Administrador:** verifica el comprobante original y supervisa el envío.
- **Contador:** consulta el vínculo entre el documento original, la nota y su resultado.

### User Stories & Scenarios

- **US-1:** Como vendedor/cajero, quiero emitir una nota de crédito referida a un comprobante original para documentar una reducción o corrección.
  - **Escenario 1.1:** El comprobante original existe y la solicitud incluye un motivo; el sistema prepara una `CreditNote` y la registra para envío.
  - **Escenario 1.2:** No se identifica el comprobante original; el sistema rechaza la solicitud.
- **US-2:** Como vendedor/cajero, quiero emitir una nota de débito referida a un comprobante original para documentar un ajuste.
  - **Escenario 2.1:** El comprobante original existe y la solicitud incluye un motivo; el sistema prepara una `DebitNote` y la registra para envío.
  - **Escenario 2.2:** El motivo no pertenece al Catálogo 10 verificado; esa validación queda **Pendiente de verificar** y no se presume un código aceptable.

## 4. Detailed Requirements & Behavior

### Functional Requirements

- **FR-1 — Referencia obligatoria:** toda nota debe identificar un comprobante original existente mediante `originalDocumentId`. El sistema resuelve el identificador interno y genera la referencia UBL del documento original; no debe aceptar una nota huérfana.
- **FR-2 — Referencia UBL:** asociar el original mediante `cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID` cuando corresponda al perfil SUNAT. En los XSD UBL 2.1 `cac:BillingReference` tiene cardinalidad `0..n`, su `cac:InvoiceDocumentReference` `0..1` y el `cbc:ID` de `DocumentReference` `1..1`. La feature exige al menos una referencia, por encima de la cardinalidad mínima del XSD. Confirmar la ruta y los datos requeridos por el perfil SUNAT: **Pendiente de verificar**.
- **FR-3 — Tipo documental:** generar una nota de crédito como documento UBL `CreditNote` y una nota de débito como `DebitNote`. Los tipos de comprobante SUNAT aportados son Catálogo 01 códigos `07` y `08`, respectivamente; su confirmación oficial queda **Pendiente de verificar**.
- **FR-4 — Motivo de crédito:** requerir un motivo del Catálogo 09 (`01`–`13`) y su sustento. UBL: `CreditNote/cac:DiscrepancyResponse` con `cbc:ReferenceID` (serie-correlativo del original), `cbc:ResponseCode` (código del motivo) y `cbc:Description` (sustento). El código `13` solo aplica a correcciones de la forma de pago al crédito; el `03` exige la descripción correcta o la atención del reclamo. Uso de `cbc:CreditNoteTypeCode` en el perfil SUNAT: **Pendiente de verificar**.
- **FR-5 — Motivo de débito:** requerir un motivo del Catálogo 10 (`01` intereses por mora, `02` aumento en el valor, `03` penalidades/otros conceptos) y su sustento, en `DebitNote/cac:DiscrepancyResponse` con la misma estructura de FR-4. Códigos agregados después de 2017: **Pendiente de verificar**.
- **FR-6 — Líneas y totales:** la nota debe tener al menos una línea y los totales deben derivarse de sus líneas y del comprobante original. El XSD CreditNote requiere `cac:LegalMonetaryTotal`; DebitNote requiere `cac:RequestedMonetaryTotal`. Reglas SUNAT de importes, signos, impuestos y límites respecto al original: **Pendiente de verificar**.
- **FR-7 — Envío y estado:** registrar la nota antes o junto con el intento de envío, asociar el resultado y mantenerla `PENDIENTE_ENVIO` si SUNAT/OSE no responde. No marcarla `ACEPTADO` sin respuesta válida.
- **FR-8 — Errores:** si el original no existe, el tipo de original no es admitido o faltan datos requeridos, responder con un error claro y no registrar una nota válida para envío.

### Non-Functional Requirements

- **Usabilidad:** los mensajes de validación deben identificar el comprobante original o dato que requiere corrección.
- **Trazabilidad:** conservar una relación consultable entre original, nota y cada intento/CDR.
- **Seguridad:** proteger tokens OSE y certificados digitales y no incluirlos en el código fuente.
- **Rendimiento:** umbrales de generación y envío **Pendiente de definir**.

## 5. Technical Contracts & Data Schemas

### API / Interface Contract

Contrato formal: `specs/contracts/api.yaml`, operaciones `createCreditNote` y `createDebitNote`.

- **Nota de crédito:** `POST /api/v1/comprobantes/notas-credito`, request `create-credit-note.request.schema.json`, response `note.response.schema.json`.
- **Nota de débito:** `POST /api/v1/comprobantes/notas-debito`, request `create-debit-note.request.schema.json`, response `note.response.schema.json`.
- **Resultado esperado:** `201 Created` cuando la nota queda registrada; `400` por estructura inválida; `404` si no existe el original; `409` por conflicto de estado/correlativo; `422` por regla tributaria o de negocio incumplida.

Los requests reciben un identificador interno `originalDocumentId`; el sistema obtiene del comprobante original el identificador UBL que se coloca en la referencia. El campo `reasonCode` es un enum con los códigos de los Catálogos 09 (crédito) y 10 (débito). Los totales y el XML los calcula el sistema.

### Architecture

Monolito MVC desacoplado: **Controller → Service de aplicación → Dominio → puertos `ComprobanteRepository`, `FirmadorXml` y `EnviadorComprobantes` → adaptadores de persistencia y SUNAT/OSE**. El servicio verifica el original y coordina la generación del tipo documental correcto; las reglas de motivo y cálculo permanecen en el dominio.

### Data Model & Persistence

La nota conserva una referencia al agregado `Comprobante` original y sus propios datos, líneas, totales y envíos. No se define aquí un esquema físico; el modelo de dominio vigente está en `specs/domain/modelo-dominio.md`.

## 6. Acceptance Criteria (Given-When-Then / BDD)

```gherkin
Feature: Emitir notas de crédito y débito

  Scenario: Emitir nota de crédito vinculada al original
    Given que existe un comprobante original
    And la solicitud identifica el original y proporciona el motivo "07" (devolución por ítem) del Catálogo 09
    And la solicitud incluye al menos una línea válida
    When se solicita emitir una nota de crédito
    Then se prepara un documento UBL CreditNote
    And se incluye la referencia UBL al comprobante original
    And el documento usa el tipo Catálogo 01 código "07"
    And la nota queda registrada para envío

  Scenario: Emitir nota de débito vinculada al original
    Given que existe un comprobante original
    And la solicitud identifica el original y proporciona el motivo "01" (intereses por mora) del Catálogo 10
    And la solicitud incluye al menos una línea válida
    When se solicita emitir una nota de débito
    Then se prepara un documento UBL DebitNote
    And se incluye la referencia UBL al comprobante original
    And el documento usa el tipo Catálogo 01 código "08"
    And la nota queda registrada para envío

  Scenario: Rechazar nota sin comprobante original
    Given una solicitud de nota sin originalDocumentId válido
    When se solicita emitir una nota de crédito o débito
    Then la respuesta indica que el comprobante original es obligatorio
    And no se registra una nota válida para envío

  Scenario: Mantener nota pendiente si el destino no responde
    Given una nota válida y registrada para envío
    And SUNAT/OSE no responde
    When finaliza el intento de envío
    Then la nota permanece en estado "PENDIENTE_ENVIO"
    And no se marca como "ACEPTADO"

  Scenario: Rechazar nota con motivo fuera del catálogo
    Given que existe un comprobante original
    And la solicitud de nota de débito tiene el motivo "13"
    When se solicita emitir la nota de débito
    Then la respuesta indica que el motivo no pertenece al Catálogo 10
    And no se registra una nota válida para envío
```

## 7. Verification & Test Plan

- **Unit Tests:** verificar la obligatoriedad y resolución del original, tipo documental y selección del XSD, líneas no vacías y estados. Validar que cada motivo pertenezca a su catálogo; las reglas de importes por motivo quedan pendientes de verificación oficial.
- **Integration Tests:** comprobar el vínculo persistido entre la nota y su original, y el registro de respuestas de SUNAT/OSE.
- **Acceptance / Contract Tests:** previstos en `backend/test/003-emitir-nota-credito-debito.e2e-spec.ts` (no crear todavía); contrastar ambos endpoints con sus esquemas y escenarios Gherkin.

## 8. Rollout & Rollback Strategy

- **Feature flags / toggles:** Pendiente de definir.
- **Rollout phases:** Pendiente de definir.
- **Failure triggers and rollback procedure:** Pendiente de definir; no habilitar emisión productiva antes de verificar motivos y reglas SUNAT.

## 9. Review & Sign-Off

| Role | Reviewer | Status | Date |
|------|----------|--------|------|
| Engineering Lead | | Pending | |
| Product / Stakeholder | | Pending | |
| QA / Testing | | Pending | |