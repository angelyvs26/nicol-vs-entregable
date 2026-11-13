# Diagrama de casos de uso

Alcance funcional de los casos de uso identificados para el sistema de facturación y almacén. Las relaciones con SUNAT/OSE aplican a las operaciones de emisión y envío.

```mermaid
flowchart LR
    vendedor([Vendedor / cajero])
    admin([Administrador])
    contador([Contador])
    almacen([Almacenero])
    sunat([SUNAT])
    ose([OSE / PSE])

    subgraph sistema["Sistema de facturación electrónica ABC"]
        emitirFactura([Emitir factura])
        emitirBoleta([Emitir boleta])
        emitirNota([Emitir nota de crédito o débito])
        enviar([Enviar comprobante y recibir CDR])
        reintentar([Reintentar envíos pendientes])
        consultar([Consultar comprobantes y estado])
        anular([Anular comprobante])
        clientes([Gestionar clientes])
        productos([Gestionar productos e impuestos])
        series([Gestionar series y correlativos])
        reportes([Consultar reportes])
        archivos([Descargar PDF, XML y CDR])
        conservar([Almacenar y conservar PDF, XML y CDR])
        imprimir([Imprimir ticket o A4])
        migrar([Migrar datos del legado])
        movimientos([Registrar movimientos de almacén])
        guia([Emitir guía de remisión])
    end

    vendedor --> emitirFactura
    vendedor --> emitirBoleta
    vendedor --> consultar
    vendedor --> imprimir
    vendedor --> emitirNota
    admin --> reintentar
    admin --> anular
    vendedor --> clientes
    admin --> productos
    admin --> series
    admin --> migrar
    contador --> reportes
    contador --> archivos
    admin --> conservar
    almacen --> movimientos
    almacen --> guia
    emitirFactura --> enviar
    emitirBoleta --> enviar
    emitirNota --> enviar
    enviar --> sunat
    enviar --> ose
    reintentar --> sunat
    reintentar --> ose
```

Los nombres y actores corresponden a UC-01–UC-18 de [casos-de-uso.md](../use-cases/casos-de-uso.md). Los casos de emisión de notas y guías se mantienen en el mapa de alcance; sus reglas normativas todavía requieren verificación.
