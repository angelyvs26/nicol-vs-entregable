# C4 — Diagrama de contexto

Contexto del sistema y sus usuarios, canales de operación e integraciones externas. Es un diagrama de nivel Contexto (C1); no define protocolos ni detalles de despliegue.

```mermaid
C4Context
    title Contexto del sistema de facturación electrónica ABC

    Person(vendedor, "Vendedor / cajero", "Registra ventas y consulta comprobantes.")
    Person(administrador, "Administrador", "Gestiona catálogos, series, migración y seguimiento de envíos.")
    Person(contador, "Contador", "Consulta reportes y descarga documentos tributarios.")
    Person(almacenero, "Almacenero", "Registra movimientos de mercadería.")

    System_Boundary(abc, "ABC Software Corp") {
        System(facturacion, "Sistema de facturación electrónica", "Gestiona comprobantes, impuestos, migración del legado y emisión estructurada en UBL 2.1.")
    }

    System_Ext(sunat, "SUNAT", "Recibe comprobantes electrónicos y devuelve respuestas/CDR.")
    System_Ext(ose, "OSE / PSE (p. ej., Nubefact)", "Alternativa externa para la validación o envío de comprobantes; el protocolo concreto está pendiente de verificar.")
    System_Ext(legado, "Sistema básico de almacén", "Origen de fecha, ingreso, salida, producto y número de documento interno.")

    Rel(vendedor, facturacion, "Emite y consulta comprobantes")
    Rel(administrador, facturacion, "Administra y supervisa")
    Rel(contador, facturacion, "Consulta reportes y documentos")
    Rel(almacenero, facturacion, "Registra movimientos")
    Rel(facturacion, sunat, "Envía comprobantes / recibe CDR", "Integración pendiente de verificar")
    Rel(facturacion, ose, "Envía comprobantes / recibe respuestas", "Integración pendiente de verificar")
    Rel(legado, facturacion, "Provee datos históricos para migración")
```

La selección entre envío directo a SUNAT y un proveedor OSE/PSE se registra en [ADR-0002](../adr/0002-envio-via-ose-o-sunat.md). El diagrama no implica que exista ya una integración implementada.
