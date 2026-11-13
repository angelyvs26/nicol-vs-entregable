# Resumen de entrega — SDD

**Proyecto:** Facturación electrónica SUNAT para ABC Software Corp  
**Fase:** Paso 5 de SDD — especificaciones finales  
**Estado general:** documentación Draft; ADR-0001 a ADR-0003 Accepted. No se modificó código de `backend/` ni `frontend/`.

## Entregables

1. **Dominio y contratos de datos:** modelo con agregados, invariantes y puertos; mapeo del legado; catálogos SUNAT aportados; schemas JSON de request de factura/boleta, cliente/producto/serie y respuestas de comprobante/error/envío/migración. Incluye casos de uso e investigación Nubefact como fuentes de requisitos, más FEAT-001 para emisión de factura.
2. **Arquitectura:** diagramas MVC, Hexagonal, evolución futura a microservicios y despliegue Windows MSI / Android APK con backend central. Los ADR registran MVC con puertos, adaptadores SUNAT/OSE con cola de reenvío y empaquetado Tauri 2.
3. **API:** contrato OpenAPI 3.1 en `contracts/api.yaml`; emisión en `POST /api/v1/comprobantes/facturas`, operación `createInvoice`.
4. **Trazabilidad:** matriz SUNAT ↔ UBL enlaza catálogos, elementos UBL, campos DTO, reglas del dominio (INV), requisitos de feature (FR) y escenarios (ESC). TR-30 enlaza explícitamente ESC-01 con el total 118.00. La matriz del enunciado relaciona además sus exigencias con los documentos y estados.

El índice con archivos y estados está en [README.md](./README.md).

## Decisiones clave

- Monolito NestJS MVC con dominio separado de TypeORM y adaptadores, preparado para puertos y Arquitectura Hexagonal (ADR-0001).
- Puerto `EnviadorComprobantes` con adaptadores SUNAT directo y OSE/PSE Nubefact; comprobantes sin respuesta permanecen `PENDIENTE_ENVIO` y se reintentan desde una cola (ADR-0002).
- Frontend React empaquetado como MSI/APK con Tauri 2 y backend NestJS central para custodiar secretos y coordinar correlativos; versiones de tooling pendientes (ADR-0003).
- Los nombres de propiedades JSON usan inglés `camelCase`; nombres del dominio, español; códigos SUNAT y estados se conservan literalmente.

## Pendiente de verificación externa

- Cotejar con las publicaciones oficiales SUNAT la vigencia, alcance y detalle de las resoluciones y catálogos 01, 05, 06, 07 y 08 usados por el proyecto; los catálogos 09/10 ya se verificaron con anexos oficiales (RS 245-2017 y RS 000165-2021); verificar también las reglas de factura/boleta, serie y correlativo, identificación del RUC, anulaciones y plazos de envío/baja.
- Confirmar las reglas tributarias que no se desprenden del XSD: tasas y bases aplicables a ISC e IGV, redondeo, valores ICBPER, tratamiento por código de afectación y contenido SUNAT obligatorio de los XML.
- Contrastar el perfil SUNAT de UBL (valores y obligatoriedad de `UBLVersionID`/`CustomizationID`, datos requeridos, firma y códigos/estados de CDR). El XSD OASIS local confirma estructura UBL, no la conformidad con SUNAT.
- Verificar con documentación vigente el formato, autenticación, ambientes, respuestas y reintentos del proveedor OSE/PSE elegido, así como el protocolo de envío directo a SUNAT.
- Validar versiones y compatibilidad de Tauri, Rust, WiX, SDK/NDK, Windows/WebView2 y Android; producir y probar los paquetes MSI/APK y su firma.

## Pendiente de decisión de diseño

- Elegir hosting, almacén de secretos, respaldo/continuidad, retención de XML/PDF/CDR y política de trabajo sin conexión; definir máximos y backoff de reintentos.
- Acordar requisitos de rendimiento, autorización, límites de tasa, paginación y estrategia de despliegue/rollback.
- Completar escenarios de aceptación que aún no estén documentados y resolver qué campos se exponen en las respuestas.

## Trazabilidad y ejemplos

- [Matriz de requisitos del enunciado](./traceability/matriz-requisitos-enunciado.md) desglosa las exigencias del caso y su estado documental.
- [Ejemplos de requests](./examples/README.md) registra los ejemplos y el resultado de validarlos contra sus JSON Schema.
- Los diagramas [de casos de uso](./diagrams/casos-de-uso.md) y [C4 de contexto](./diagrams/c4-contexto.md) completan la vista del sistema.
