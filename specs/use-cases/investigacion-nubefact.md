# Investigación de Nubefact

## 1. Metodología

No fue posible crear un usuario DEMO porque el registro requiere un RUC activo. La investigación se realizó con la documentación oficial de Nubefact y reseñas de usuarios.

## 2. Funcionalidades

**Fuente:** Nubefact, [Integración API REST](https://www.nubefact.com/integracion), consultado el 22/10/2026.

Según la documentación revisada en las notas de investigación, Nubefact contempla:

- Emisión de facturas, boletas, notas de crédito, notas de débito y guías de remisión.
- Operaciones gravadas, exoneradas, inafectas, exportaciones y transferencias gratuitas.
- Consultas de ventas con filtros por fechas, número de documento, tipo de cliente y estado ante SUNAT.
- Descarga de representaciones PDF, archivos XML y CDR.

## 3. Arquitectura de integración API REST

**Fuente:** Nubefact, [Integración API REST](https://www.nubefact.com/integracion), consultado el 22/10/2026.

- **Ruta:** URL asignada por la plataforma para enviar peticiones HTTP POST.
- **Autorización:** token asociado al entorno de pruebas o producción.
- **Trama:** datos del emisor, cliente, ítems, impuestos y totales en formato JSON o TXT.
- **Flujo descrito en las notas:** el sistema cliente envía la trama; la plataforma la procesa, genera XML y PDF, despacha y valida el comprobante ante SUNAT u OSE y almacena la CDR.

## 4. Acreditaciones y compatibilidad

Según el proveedor, Nubefact es PSE/OSE autorizado por SUNAT y su API puede integrarse con PHP, C#, Java, Python, Ruby, Swift y Visual FoxPro.

- Certificación ISO 27001: **Pendiente de verificar fuente exacta**.
- Las notas señalan que el proveedor dispone de manuales de alta OSE/PSE y guías de conservación de archivos; alcance y requisitos: **Pendiente de verificar**.

## 5. Opiniones de usuarios

**Fuente:** reseñas de “NubeFacT - Factura electrónica PERU” en Google Maps, consultado el 22/10/2026. Síntesis consignada en las notas de investigación; no se incluyen citas textuales.

### 5.1 Ventajas encontradas en las reseñas

- Usuarios destacan el acompañamiento técnico paso a paso y la profesionalidad, paciencia y calidad humana de los asesores.
- Las reseñas mencionan capacidad para resolver incidencias y brindar soluciones oportunas.
- Se valora la rapidez y amabilidad ante consultas sobre facturación electrónica.

### 5.2 Riesgos generales del sector

Los siguientes puntos no provienen de las reseñas de Nubefact. Son observaciones del borrador sin una fuente de usuarios identificada y quedan **Pendiente de verificar**; no se atribuyen a Nubefact:

- Posibles demoras en periodos de alta demanda, generación masiva o descarga de archivos.
- Restricciones para realizar pruebas iniciales que dependan de validar un RUC o activar credenciales.
- Posibles limitaciones de personalización de formatos impresos sin configuración adicional o soporte.
- Posible congestión de canales de atención e impacto operativo ante interrupciones de una plataforma de emisión.

## 6. Hallazgo → Requisito / Caso de uso

| Hallazgo | Fuente | Requisito o UC derivado |
|---|---|---|
| La integración recibe una trama por API REST con token. | Nubefact, Integración API REST | Definir un contrato de integración configurable por entorno y proteger las credenciales. |
| La trama incluye emisor, cliente, ítems, impuestos y totales. | Nubefact, Integración API REST | Definir datos de emisión completos antes de integrar con el proveedor. |
| La plataforma procesa el comprobante y produce XML, PDF y CDR. | Nubefact, Integración API REST | UC-05: enviar comprobantes a SUNAT/OSE y recibir CDR; UC-13: descargar PDF/XML/CDR. |
| Se describen consultas filtradas de ventas. | Nubefact, Integración API REST | UC-12: consultar y reportar comprobantes con filtros. |
| Usuarios valoran el acompañamiento y la resolución de incidencias. | Reseñas de Google Maps | Requisito no funcional: mostrar mensajes claros que faciliten la resolución de errores. |
| El borrador menciona posibles demoras e interrupciones, sin fuente de reseñas. | Notas de investigación; riesgo no verificado | Evaluar UC-06: reintentar envíos pendientes; considerar una cola de reenvío cuando SUNAT/OSE no responda. |

## 7. Pendiente de verificar

- Si la anulación de boletas se realiza mediante resumen diario.
- El plazo de comunicación de baja.
- El plazo legal de conservación de PDF, XML y CDR.
- La certificación ISO 27001 y su fuente exacta.

