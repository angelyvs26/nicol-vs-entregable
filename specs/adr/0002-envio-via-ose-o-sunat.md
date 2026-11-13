# ADR-0002: Envío de comprobantes vía SUNAT directo u OSE/PSE detrás de un puerto

- **Status**: `Accepted`
- **Date**: `2026-10-22`
- **Deciders**: `Campos Flores Elida Andrea`
- **Consulted**: `Documentación pública de Nubefact (specs/use-cases/investigacion-nubefact.md)`
- **Informed**: `Gerencia de ABC Software Corp`

---

## Context and Problem Statement

Cada comprobante debe enviarse a SUNAT u a un OSE/PSE y su respuesta (CDR, `ApplicationResponse`) determina si pasa a `ACEPTADO` o `RECHAZADO` (FR-10, INV-15). Si el destino no responde, el comprobante queda en `PENDIENTE_ENVIO` y debe poder reintentarse (UC-06).

Evidencia de `specs/use-cases/investigacion-nubefact.md`:

- Nubefact se presenta como PSE/OSE autorizado por SUNAT (§4).
- Su integración es una **API REST**: HTTP POST a una URL asignada, con **token** por entorno (pruebas/producción), y una **trama JSON o TXT** con emisor, cliente, ítems, impuestos y totales (§3).
- La plataforma **genera XML y PDF**, valida ante SUNAT u OSE y almacena el CDR (§3).
- Riesgo no verificado: posibles demoras o interrupciones en alta demanda (§5.2), que justifican una cola de reenvío (§6).

Elegir un único canal ata el sistema a un proveedor o a la complejidad de la integración directa. ¿Cómo integrar el envío sin acoplar el dominio a un canal?

## Decision Drivers

- Cumplimiento de FR-10: nunca marcar `ACEPTADO` sin CDR.
- Disponibilidad: los fallos del destino no deben perder comprobantes (UC-06, NFR de disponibilidad).
- Seguridad: tokens OSE y certificados fuera del código fuente (NFR de seguridad).
- Independencia de proveedor y capacidad de cambiar de canal por configuración.
- Esfuerzo inicial: la integración por API REST con trama JSON es menos costosa que la integración directa.

## Considered Options

1. **Solo SUNAT directo**: el sistema genera y firma el XML UBL y lo envía al servicio de SUNAT.
2. **Solo OSE/PSE (Nubefact)**: el sistema envía la trama JSON a Nubefact y este genera XML, PDF y obtiene el CDR.
3. **Puerto `EnviadorComprobantes` con dos adaptadores** (SUNAT directo y OSE/PSE Nubefact), elegidos por configuración, más una cola de reenvío.

## Decision Outcome

Opción elegida: **3. Puerto con dos adaptadores + cola de reenvío**, porque desacopla el dominio del canal, permite empezar con el canal de menor esfuerzo y cambiar sin tocar las reglas tributarias.

### Puerto

```text
EnviadorComprobantes
  enviar(xmlFirmado | null, comprobante): RespuestaEnvio
  consultarTicket(ticket): RespuestaEnvio

RespuestaEnvio = { resultado: SIN_RESPUESTA | RECIBIDO | ACEPTADO | RECHAZADO,
                   ticket?, codigoRespuesta?, descripcionRespuesta?, observaciones[], cdr?, xml?, pdf?, detalleError? }
```

`EnvioComprobante.canal` registra el adaptador usado: `SUNAT_DIRECTO` u `OSE_PSE` (modelo-dominio.md §1.8; `submission.response.schema.json`).

### Adaptadores

| Adaptador | Entrada | Qué hace el sistema | Qué hace el destino | Pendiente |
|-----------|---------|---------------------|---------------------|-----------|
| `SunatDirectoAdapter` (`SUNAT_DIRECTO`) | XML UBL firmado | Genera (`GeneradorXmlUbl`) y firma (`FirmadorXml`) el XML; lo envía; guarda el CDR. | Valida y devuelve el CDR. | Protocolo, URLs, empaquetado y credenciales del servicio SUNAT: **Pendiente de verificar**. |
| `NubefactAdapter` (`OSE_PSE`) | Trama JSON construida desde `Comprobante` | Mapea el agregado a la trama; envía con token; guarda XML, PDF y CDR devueltos como `ArchivoComprobante`. | Genera XML y PDF, valida ante SUNAT u OSE, devuelve el CDR. | Formato exacto de la trama, campos de respuesta, si firma con el certificado del emisor o el del proveedor y si acepta XML propio: **Pendiente de verificar**. |

Consecuencia para el flujo de emisión: con `SUNAT_DIRECTO`, el servicio de aplicación genera y firma el XML antes de `enviar`; con `OSE_PSE` por trama, se omiten `GeneradorXmlUbl` y `FirmadorXml` y se pasa `xmlFirmado = null`. En ambos casos, el comprobante validado y numerado pasa a `PENDIENTE_ENVIO` antes del primer envío (modelo-dominio.md §3).

### Configuración y secretos

- Canal activo por entorno o por emisor: `ENVIO_CANAL = SUNAT_DIRECTO | OSE_PSE`.
- Token Nubefact, URL asignada y referencia del certificado: variables de entorno o almacén de secretos; nunca en el código, el repositorio, el MSI o el APK (ADR-0003).
- Entornos de prueba y producción separados, con credenciales distintas.

### Cola de reenvío (UC-06)

- **Persistida en PostgreSQL**: la cola son los comprobantes en `PENDIENTE_ENVIO` o `ENVIADO` (`ComprobanteRepository.listarPorEstado`). No se pierde nada si el proceso se reinicia.
- Un **job programado** en el backend reintenta cada comprobante y registra un `EnvioComprobante` por intento (`numeroIntento`).
- **Reintento manual**: `POST /api/v1/comprobantes/{id}/envios` (`resendComprobante`).
- **Idempotencia**: si existe `ticket`, se usa `consultarTicket` antes de reenviar, para no duplicar el envío.
- Intervalo, número máximo de intentos, *backoff* y alertas: **Pendiente de definir**. Plazo normativo máximo para enviar: **Pendiente de verificar**.

### Positive Consequences

- El dominio no conoce SUNAT ni Nubefact.
- Se puede iniciar con Nubefact (menor esfuerzo) y migrar a SUNAT directo, o al revés, cambiando configuración.
- Ningún comprobante se pierde por una caída del destino.

### Negative Consequences / Trade-offs

- Dos adaptadores que mantener y probar. Mitigación: pruebas de contrato del puerto compartidas por ambos adaptadores, con dobles de prueba (sin credenciales reales).
- Con Nubefact, el XML y la firma los produce el proveedor: el sistema depende de su disponibilidad. Mitigación: cola de reenvío y posibilidad de cambiar a SUNAT directo.
- Un mismo comprobante podría llegar dos veces al destino si se reintenta sin control. Mitigación: idempotencia por ticket y por serie-correlativo.

## Pros and Cons of Considered Options

### Option 1: Solo SUNAT directo
- Good, because no depende de terceros ni de su costo.
- Bad, because exige implementar generación, firma, empaquetado y protocolo SUNAT desde el inicio (varios puntos **Pendiente de verificar**).

### Option 2: Solo OSE/PSE (Nubefact)
- Good, because el proveedor resuelve XML, firma, PDF y CDR; integración REST simple.
- Bad, because ata el sistema a un proveedor y a su formato de trama.

### Option 3: Puerto con dos adaptadores + cola (elegida)
- Good, because combina el arranque rápido de la opción 2 con la salida de la opción 1.
- Bad, because duplica el esfuerzo de pruebas de integración.

## Implementation & Follow-up Actions

- [ ] Obtener la especificación oficial de la trama Nubefact y de su respuesta.
- [ ] Verificar el protocolo del servicio SUNAT para envío directo.
- [ ] Definir intervalo, máximo de intentos y alertas de la cola de reenvío.
- [ ] Agregar escenarios Gherkin de CDR aceptado y rechazado (matriz TR-32 a TR-34).
