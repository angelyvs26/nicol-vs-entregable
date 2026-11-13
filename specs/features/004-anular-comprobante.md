# Feature Specification: Anulación de comprobante electrónico

- **ID**: `FEAT-004`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Target Release / Milestone**: `Pendiente de definir`
- **Created**: `2026-11-12`
- **Last Updated**: `2026-11-12`

---

## 1. Context & Problem Statement

ABC Software Corp necesita gestionar la anulación de comprobantes emitidos y conservar evidencia del resultado comunicado a SUNAT/OSE. Según el caso de uso documentado, la factura utiliza comunicación de baja y la boleta se comunica mediante resumen diario. Los plazos para solicitar, enviar y obtener respuesta están **Pendiente de verificar**. No debe inferirse que un comprobante está anulado solo porque se registró una solicitud local.

El mecanismo, los catálogos y los elementos UBL aplicables deben contrastarse con la normativa y el perfil SUNAT vigentes antes de aprobar la feature.

## 2. Goals & Non-Goals

### Goals

- [ ] Especificar la solicitud y el seguimiento de anulación de una factura o boleta.
- [ ] Enrutar facturas a comunicación de baja y boletas a resumen diario.
- [ ] Mantener explícitamente pendientes de verificar los plazos, códigos y detalles normativos no confirmados.
- [ ] Cambiar el estado del comprobante a `ANULADO` solo tras respuesta válida que confirme la operación.

### Non-Goals

- Emitir notas de crédito o débito: especificadas en `003-emitir-nota-credito-debito.md`.
- Definir el catálogo de motivos o los plazos de anulación antes de verificar la normativa.
- Especificar la estructura completa del XML de comunicación de baja o resumen diario: **Pendiente de verificar**.

## 3. User Personas & Use Cases

### Personas

- **Administrador:** solicita la anulación y supervisa el resultado.
- **Contador:** consulta la comunicación y la respuesta asociada al comprobante.

### User Stories & Scenarios

- **US-1:** Como administrador, quiero solicitar la anulación de una factura para comunicar su baja por el mecanismo correspondiente.
  - **Escenario 1.1:** El sistema identifica una factura y prepara una comunicación de baja.
- **US-2:** Como administrador, quiero solicitar la anulación de una boleta para incorporarla al resumen diario correspondiente.
  - **Escenario 2.1:** El sistema identifica una boleta y prepara su inclusión en un resumen diario.
- **US-3:** Como contador, quiero conocer el estado real de la anulación para distinguir una solicitud pendiente de una baja confirmada.
  - **Escenario 3.1:** El destino no responde; el comprobante no pasa a `ANULADO`.

## 4. Detailed Requirements & Behavior

### Functional Requirements

- **FR-1 — Comprobante objetivo:** requerir un comprobante existente y elegible para anulación. Los estados de origen admitidos y restricciones por tipo están **Pendiente de verificar**.
- **FR-2 — Mecanismo por tipo:** para una factura, preparar comunicación de baja; para una boleta, preparar el resumen diario aplicable. La estructura de ambos documentos y el transporte SUNAT/OSE están **Pendiente de verificar**.
- **FR-3 — Plazos:** verificar y aplicar los plazos normativos para solicitar, comunicar y rectificar la baja o resumen. Todos los plazos concretos están **Pendiente de verificar**; no se define una ventana ni un SLA asumido.
- **FR-4 — Motivo:** conservar el motivo indicado por el administrador. Catálogo, códigos aceptados y campo UBL/SUNAT correspondiente están **Pendiente de verificar**.
- **FR-5 — Estado:** registrar solicitud y resultado de envío de forma separada. Mantener el comprobante sin estado `ANULADO` mientras no haya confirmación válida; aplicar `ANULADO` solo después de la respuesta que confirme la baja/resumen según reglas por verificar.
- **FR-6 — Idempotencia y conflictos:** impedir solicitudes incompatibles con el estado actual y registrar cada intento para evitar duplicar una operación ya confirmada. La política exacta de repetición y rectificación está **Pendiente de verificar**.
- **FR-7 — Errores:** si el comprobante no existe o su tipo no está soportado, responder con error claro sin cambiar su estado.

### Non-Functional Requirements

- **Trazabilidad:** conservar tipo de mecanismo, motivo, marcas de tiempo, identificadores de comunicación y respuestas disponibles.
- **Disponibilidad:** si SUNAT/OSE no responde, conservar la solicitud pendiente para consulta y reintento conforme a reglas verificadas.
- **Seguridad:** proteger credenciales y certificados; nunca exponerlos en la respuesta.
- **Plazos:** umbrales y vencimientos regulatorios **Pendiente de verificar**.

## 5. Technical Contracts & Data Schemas

### API / Interface Contract

Contrato formal: `specs/contracts/api.yaml`, operación `requestComprobanteCancellation`.

- **Método y ruta:** `POST /api/v1/comprobantes/{id}/anulaciones`
- **Request:** `cancel-comprobante.request.schema.json`; `{id}` identifica el comprobante original.
- **Response:** `cancellation.response.schema.json`; identifica el mecanismo usado y estado de la solicitud/comprobante.
- **Resultado esperado:** `202 Accepted` cuando queda registrada para procesamiento; `400` por request inválido; `404` si el comprobante no existe; `409` por estado incompatible; `422` por una regla de negocio no satisfecha.

Una respuesta `202` no significa que SUNAT haya confirmado la anulación. El mecanismo comunicado depende del tipo de comprobante: factura → comunicación de baja; boleta → resumen diario.

### Architecture

Monolito MVC desacoplado: **Controller → Service de aplicación → Dominio → puerto de cancelación/envío → adaptadores SUNAT/OSE**. El dominio determina el mecanismo por tipo de documento; el adaptador encapsula el protocolo y devuelve un resultado que se persiste para consulta.

### Data Model & Persistence

La solicitud de anulación y sus intentos/respuestas se asocian al agregado `Comprobante`. Entidades y persistencia detalladas quedan sujetas a la actualización de `specs/domain/modelo-dominio.md` y a la verificación normativa.

## 6. Acceptance Criteria (Given-When-Then / BDD)

```gherkin
Feature: Anular comprobante electrónico

  Scenario: Preparar comunicación de baja para factura
    Given que existe una factura elegible para anulación
    When el administrador solicita su anulación
    Then el mecanismo seleccionado es comunicación de baja
    And la solicitud queda registrada para envío
    And el plazo de comunicación permanece Pendiente de verificar

  Scenario: Preparar resumen diario para boleta
    Given que existe una boleta elegible para anulación
    When el administrador solicita su anulación
    Then el mecanismo seleccionado es resumen diario
    And la solicitud queda registrada para procesamiento
    And el plazo aplicable permanece Pendiente de verificar

  Scenario: No marcar anulado sin confirmación
    Given un comprobante con solicitud de anulación pendiente
    And SUNAT/OSE no ha devuelto confirmación válida
    When se consulta el comprobante
    Then su estado no es "ANULADO"
    And la solicitud se muestra como pendiente o sin respuesta

  Scenario: Rechazar comprobante inexistente
    Given un identificador de comprobante que no existe
    When se solicita su anulación
    Then la respuesta es 404
    And no se crea una comunicación de baja ni un resumen diario
```

## 7. Verification & Test Plan

- **Unit Tests:** verificar el enrutamiento factura/boleta, transiciones de estado y rechazo de comprobante inexistente. Plazos, motivos, rectificación e idempotencia requieren reglas verificadas.
- **Integration Tests:** comprobar el registro de solicitudes e intentos y la asociación de resultados simulados de SUNAT/OSE, sin credenciales reales.
- **Acceptance / Contract Tests:** previstos en `backend/test/004-anular-comprobante.e2e-spec.ts` (no crear todavía); contrastar respuesta `202` y manejo de falta de confirmación.

## 8. Rollout & Rollback Strategy

- **Feature flags / toggles:** Pendiente de definir.
- **Rollout phases:** Pendiente de definir.
- **Failure triggers and rollback procedure:** Pendiente de definir; no habilitar en producción antes de verificar los mecanismos, plazos y criterios de aceptación normativa.

## 9. Review & Sign-Off

| Role | Reviewer | Status | Date |
|------|----------|--------|------|
| Engineering Lead | | Pending | |
| Product / Stakeholder | | Pending | |
| QA / Testing | | Pending | |