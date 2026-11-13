# Matriz de trazabilidad normativa SUNAT ↔ UBL 2.1

- **ID**: `TRZ-001`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Created**: `2026-10-22`
- **Last Updated**: `2026-10-22`
- **Entregable**: 4 — Matriz de Trazabilidad Normativa (caso de estudio, sección 4).
- **Fuentes**: `specs/domain/catalogos-sunat.md` (catálogos aportados, pendientes de contraste con el anexo oficial), `specs/features/001-emitir-factura.md` a `specs/features/004-anular-comprobante.md` (FR, escenarios), `specs/domain/modelo-dominio.md` (entidades, INV), `specs/contracts/schemas/` (DTO), `specs/reference/ubl-2.1/` (XSD OASIS UBL 2.1).

---

## 0. Convenciones

- **Elemento UBL**: ruta completa desde la raíz del documento (`Invoice` o `ApplicationResponse`). Prefijos `cbc:`, `cac:`, `ext:`.
- **Cardinalidad en XSD**: `minOccurs..maxOccurs` de cada paso de la ruta, verificados el 2026-11-12 en `maindoc/UBL-Invoice-2.1.xsd`, `maindoc/UBL-ApplicationResponse-2.1.xsd`, `maindoc/UBL-CreditNote-2.1.xsd`, `maindoc/UBL-DebitNote-2.1.xsd` y `common/UBL-CommonAggregateComponents-2.1.xsd`. `n` = `unbounded`. Atributos: `use` según `common/UBL-UnqualifiedDataTypes-2.1.xsd` y `common/CCTS_CCT_SchemaModule-2.1.xsd`.
- **Obligatoriedad SUNAT**: `Obligatorio` / `Condicional` solo cuando lo exige un FR o regla aportada en los catálogos. Toda obligatoriedad que no tenga cita al anexo o guía oficial SUNAT lleva **Pendiente de verificar**.
- **Campo DTO**: JSONPath sobre `create-invoice.request.schema.json` (`req`) o `invoice.response.schema.json` (`res`). `—` = no se expone en la API.
- **Escenarios Gherkin** (de `001-emitir-factura.md` a `004-anular-comprobante.md`, sección 6):

| ID | Escenario |
|----|-----------|
| ESC-01 | Emitir factura válida con producto gravado |
| ESC-02 | Calcular IGV sobre valor de venta más ISC |
| ESC-03 | Rechazar RUC de cliente inválido |
| ESC-04 | Rechazar código de afectación inexistente |
| ESC-05 | Rechazar producto con ISC sin sistema de cálculo |
| ESC-06 | Mantener factura pendiente cuando SUNAT u OSE no responde |
| ESC-07 | Emitir boleta válida para cliente con DNI |
| ESC-08 | Emitir boleta para cliente sin documento |
| ESC-09 | Calcular ICBPER por bolsas plásticas en boleta |
| ESC-10 | Rechazar boleta con serie de factura |
| ESC-11 | Rechazar ICBPER sin monto unitario configurado |
| ESC-12 | Mantener boleta pendiente cuando SUNAT u OSE no responde |
| ESC-13 | Emitir nota de crédito vinculada al original |
| ESC-14 | Emitir nota de débito vinculada al original |
| ESC-15 | Rechazar nota sin comprobante original |
| ESC-16 | Preparar comunicación de baja para factura |
| ESC-17 | Preparar resumen diario para boleta |
| ESC-18 | No marcar anulado sin confirmación |

## 1. Tabla principal

| ID | Requisito SUNAT | Catálogo SUNAT | Elemento UBL (ruta completa) | Cardinalidad en XSD | Obligatoriedad SUNAT | Entidad.atributo del dominio | Campo DTO (JSON path) | Regla / invariante | Escenario Gherkin |
|----|-----------------|----------------|------------------------------|---------------------|----------------------|------------------------------|-----------------------|--------------------|-------------------|
| TR-01 | Tipo de comprobante: factura = `01` | Cat. 01 | `Invoice/cbc:InvoiceTypeCode` (+ `@listAgencyName`, `@listName`, `@listURI` …catalogo01) | `0..1` | **Obligatorio** ([G] numeral 9) | `Comprobante.tipoComprobante` | `res $.documentType` (en `req` lo fija la ruta `/facturas`) | FR-1, INV-01 | ESC-01 |
| TR-02 | Serie (`F` + 3 alfanuméricos) y correlativo (hasta 8 dígitos, inicia en 1) identifican el comprobante | Cat. 01 (serie según tipo) | `Invoice/cbc:ID` | `1..1` | **Obligatorio**, formato `F###-NNNNNNNN` ([G] numeral 5). Unicidad: **Pendiente de verificar** | `Comprobante.serieCorrelativo` (`SerieCorrelativo.serie`, `.correlativo`); `Serie.codigo`, `Serie.ultimoCorrelativo` | `req $.series`, `req $.correlative`; `res $.series`, `res $.correlative` | FR-3, INV-04 | ESC-01 |
| TR-03 | Fecha de emisión | — | `Invoice/cbc:IssueDate` | `1..1` | **Obligatorio**, `yyyy-mm-dd` ([G] numeral 6) | `Comprobante.fechaEmision` | — (asignada por el sistema; no expuesta) | — (sin FR) | — (sin escenario) |
| TR-04 | Hora de emisión | — | `Invoice/cbc:IssueTime` | `0..1` | **Obligatorio**, `hh:mm:ss` ([G] numeral 7) | `Comprobante.horaEmision` | — (asignada por el sistema) | — (sin FR) | — (sin escenario) |
| TR-05 | Moneda del comprobante `PEN` o `USD` | Cat. 02 (ISO 4217) | `Invoice/cbc:DocumentCurrencyCode` (+ `@listID="ISO 4217 Alpha"`, `@listName`, `@listAgencyName`) | `0..1` | **Obligatorio** ([G] numeral 11) | `Comprobante.moneda` | `req $.currency`; `res $.currency` | FR-4, INV-05 | ESC-01 |
| TR-06 | Todos los importes en la moneda del comprobante | ISO 4217 | `@currencyID` de cada `cbc:*Amount` (p. ej. `Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount/@currencyID`) | `use="required"` (`AmountType`) | Obligatorio (XSD); igualdad con `DocumentCurrencyCode` (FR-4) | `Dinero.moneda` | — (implícito por `$.currency`) | FR-4, INV-05 | — (sin escenario) |
| TR-07 | RUC del emisor (tipo siempre `6`) | Cat. 06 código `6` | `Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID` (+ `@schemeID`, `@schemeName`, `@schemeAgencyName`, `@schemeURI` …catalogo06) | `0..n` › `0..1` | **Obligatorio** ([G] numeral 16) | `Emisor.ruc` | — (configuración del emisor) | INV-03 | — (sin escenario) |
| TR-08 | Razón social del emisor | — | `Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName` | `0..n` › `0..1` | **Obligatorio** ([G] numeral 15). Nombre comercial opcional en `cac:PartyName/cbc:Name` (numeral 14); código de domicilio fiscal en `cac:PartyLegalEntity/cac:RegistrationAddress/cbc:AddressTypeCode`, `0000` = domicilio fiscal (numeral 17) | `Emisor.razonSocial` | — | — (sin FR) | — (sin escenario) |
| TR-09 | Tipo de documento del cliente: factura exige RUC (`6`) | Cat. 06 | `Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID/@schemeID` | `0..n` › `0..1`; `@schemeID` opcional | **Obligatorio**: RUC, salvo exportación (`-`) ([G] numeral 18) | `Cliente.tipoDocumento`; `Comprobante.datosCliente.tipoDocumento` | `req $.customer.documentType` | FR-2, INV-02 | ESC-01, ESC-03 |
| TR-10 | Número de documento del cliente: RUC 11 dígitos con DV | Cat. 06 código `6` | `Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID` | `0..n` › `0..1` | **Obligatorio** ([G] numeral 18). Algoritmo del DV: **Pendiente de verificar** | `Cliente.numeroDocumento` (`Ruc`); `Comprobante.datosCliente.numeroDocumento` | `req $.customer.documentNumber` | FR-2, INV-02 | ESC-03 |
| TR-11 | Razón social del cliente | — | `Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName` | `0..n` › `0..1` | **Obligatorio** ([G] numeral 19) | `Cliente.razonSocial`; `Comprobante.datosCliente.razonSocial` | `req $.customer.legalName` | — (sin FR) | — (sin escenario) |
| TR-12 | El comprobante tiene al menos una línea | — | `Invoice/cac:InvoiceLine` (+ `cbc:ID` de línea) | `1..n` (`cbc:ID` `1..1`) | Obligatorio (XSD) | `Comprobante.lineas`, `LineaComprobante.numeroLinea` | `req $.items` (`minItems: 1`) | INV-06 | ESC-01 |
| TR-13 | Cantidad de la línea | — | `Invoice/cac:InvoiceLine/cbc:InvoicedQuantity` | `0..1` | **Obligatorio**; servicios = `1` ([G] numeral 36) | `LineaComprobante.cantidad` | `req $.items[*].quantity` | INV-06 | ESC-01 |
| TR-14 | Unidad de medida de la línea | Cat. 03 (UN/ECE rec 20) | `Invoice/cac:InvoiceLine/cbc:InvoicedQuantity/@unitCode` (+ `@unitCodeListID="UN/ECE rec 20"`, `@unitCodeListAgencyName`) | `use` opcional (`QuantityType`) | **Obligatorio** con la cantidad ([G] numeral 36). El generador usa `NIU` por defecto | `LineaComprobante.unidadMedida`; `Producto.unidadMedida` | — en `req` (solo `product $.unitCode`) | — (sin FR) | — (sin escenario) |
| TR-15 | Valor unitario sin impuestos | — | `Invoice/cac:InvoiceLine/cac:Price/cbc:PriceAmount` | `0..1` › `1..1` | **Obligatorio**, no incluye tributos ([G] numeral 48). Además, el precio de venta unitario con tributos va en `cac:PricingReference/cac:AlternativeConditionPrice/cbc:PriceAmount` con `cbc:PriceTypeCode` = `01` (Cat. 16), obligatorio ([G] numeral 38) | `LineaComprobante.valorUnitario`; `LineaComprobante.precioUnitario` | `req $.items[*].unitSaleValue` | INV-06 | ESC-01 |
| TR-16 | Valor de venta de la línea (`cantidad × valor unitario`) | — | `Invoice/cac:InvoiceLine/cbc:LineExtensionAmount` | `1..1` | Obligatorio (XSD) | `LineaComprobante.valorVenta` | — (calculado; no expuesto por línea) | FR-7, FR-9 | ESC-02 |
| TR-17 | Afectación IGV de cada línea | Cat. 07 | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:TaxExemptionReasonCode` | `0..n` › `0..n` › `1..1` › `0..1` | Obligatorio por línea (FR-5); cita oficial: **Pendiente de verificar** | `LineaComprobante.codigoAfectacionIgv`; `TributoLinea.codigoAfectacionIgv` | `req $.items[*].igvAffectationCode` | FR-5, INV-07 | ESC-01, ESC-04 |
| TR-18 | Sistema de cálculo ISC si la línea tiene ISC | Cat. 08 | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:TierRange` | `0..n` › `0..n` › `1..1` › `0..1` | Condicional: obligatorio si hay ISC (FR-6) | `TributoLinea.sistemaCalculoIsc`; `Producto.sistemaCalculoIsc` | `req $.items[*].iscSystem` | FR-6, INV-08 | ESC-02, ESC-05 |
| TR-19 | Tributo IGV | Cat. 05 código `1000` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:ID` | `0..n` › `0..n` › `1..1` › `1..1` › `0..1` | Obligatorio para líneas gravadas (FR-8) | `TributoLinea.codigoTributo` | — (derivado de `igvAffectationCode`) | FR-8, INV-09 | ESC-01 |
| TR-20 | Tributo ISC | Cat. 05 código `2000` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:ID` | `0..n` › `0..n` › `1..1` › `1..1` › `0..1` | Condicional: si hay ISC (FR-6) | `TributoLinea.codigoTributo` | — (derivado de `iscSystem`) | FR-6, INV-08 | ESC-02 |
| TR-21 | Tributo ICBPER (bolsas plásticas) | Cat. 05 código `7152` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:ID` | `0..n` › `0..n` › `1..1` › `1..1` › `0..1` | Condicional: si la línea es de bolsas (FR-12) | `TributoLinea.codigoTributo`; `LineaComprobante.cantidadBolsasIcbper` | `req $.items[*].icbperQuantity` | FR-12, INV-11 | — (sin escenario para FEAT-001) |
| TR-22 | Tributo de líneas exoneradas / inafectas / exportación | Cat. 05 `9997`, `9998`, `9995`; Cat. 07 grupos 2x, 3x, `40` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:ID` | `0..n` › `0..n` › `1..1` › `1..1` › `0..1` | Correspondencia Cat. 07 → Cat. 05: **Pendiente de verificar** | `TributoLinea.codigoTributo` | — (derivado de `igvAffectationCode`) | INV-10 | — (sin escenario) |
| TR-23 | Base imponible del tributo (IGV: valor de venta + ISC) | Cat. 05 (`1000`) | Línea: `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount`; cabecera: `Invoice/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxableAmount` | Línea: `0..n` › `0..n` › `0..1`; cabecera: `0..n` › `0..n` › `0..1` | **Pendiente de verificar** | `TributoLinea.baseImponible`; `Comprobante.totalBaseImponibleIgv` | `res $.totals.taxableBase` | FR-7, INV-09 | ESC-02 |
| TR-24 | Monto del tributo por línea | Cat. 05 | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `0..n` › `0..n` › `1..1` | Obligatorio si existe el subtotal (XSD) | `TributoLinea.monto` | `req $.items[*].iscAmount` (solo ISC informado) | FR-7, FR-8, INV-09 | ESC-01, ESC-02 |
| TR-25 | Monto por tributo en cabecera (IGV, ISC, ICBPER) | Cat. 05 `1000`, `2000`, `7152` | `Invoice/cac:TaxTotal/cac:TaxSubtotal/cbc:TaxAmount` | `0..n` › `0..n` › `1..1` | **Pendiente de verificar** | `Comprobante.totalIgv`, `.totalIsc`, `.totalIcbper` | `res $.totals.igvAmount`, `res $.totals.iscAmount`, `res $.totals.icbperAmount` | FR-9, INV-12 | ESC-01, ESC-02 |
| TR-26 | Porcentaje del tributo (IGV 18 %; tasa ISC) | Cat. 05; Cat. 08 (sistemas `01`, `03`) | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:Percent` **o** `.../cac:TaxSubtotal/cac:TaxCategory/cbc:Percent` | `0..1` en ambos niveles | Ubicación y obligatoriedad: **Pendiente de verificar** | `TributoLinea.tasa`; `Producto.tasaIsc` | `req $.items[*].iscRate` (ISC) | FR-8, INV-09 | ESC-01, ESC-02 |
| TR-27 | Tasa ICBPER por bolsa | Cat. 05 `7152` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:PerUnitAmount`; cantidad de bolsas en `.../cac:TaxSubtotal/cbc:BaseUnitMeasure` | `0..1` | Ubicación verificada (RS 150-2019, Anexo I). Monto vigente por bolsa: **Pendiente de verificar** | `TributoLinea.montoPorUnidad` | — (configuración) | FR-12, INV-11 | — (sin escenario) |
| TR-28 | Total de tributos del comprobante | Cat. 05 | `Invoice/cac:TaxTotal/cbc:TaxAmount` | `0..n` › `1..1` | **Pendiente de verificar** | `Comprobante.totalTributos` | — (no expuesto) | FR-9, INV-12 | — (sin escenario) |
| TR-29 | Total valor de venta | — | `Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount` | `1..1` › `0..1` | **Pendiente de verificar** | `Comprobante.totalValorVenta` | — (no expuesto) | FR-9, INV-12 | — (sin escenario) |
| TR-30 | Importe total a pagar | — | `Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount` | `1..1` › `1..1` | Obligatorio (XSD). Relación con `cbc:TaxInclusiveAmount`: **Pendiente de verificar** | `Comprobante.importeTotal` | `res $.totals.totalAmount` | FR-9, INV-12 | ESC-01: `And el importe total es 118.00` |
| TR-31 | Firma digital del XML | — | `Invoice/ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent/ds:Signature` y `Invoice/cac:Signature` (referencia `#SignatureSP`) | `0..1`; `0..n` | **Obligatorio**, con el certificado comunicado a SUNAT ([G] numeral 1). El generador emite `cac:Signature`; `ds:Signature` la inserta el puerto `FirmadorXml` | `ArchivoComprobante(tipo=XML)`; `Emisor.certificadoRef` | — (descarga `GET /comprobantes/{id}/archivos/XML`) | INV-14 | — (sin escenario) |
| TR-32 | Código de respuesta del CDR | Valores: **Pendiente de verificar** | `ApplicationResponse/cac:DocumentResponse/cac:Response/cbc:ResponseCode` | `0..n` › `1..1` › `0..1` | **Pendiente de verificar** | `EnvioComprobante.codigoRespuesta` | `res $.status` (derivado); `submission $.responseCode` | FR-10, INV-15 | ESC-06 (caso sin CDR) |
| TR-33 | Descripción de respuesta del CDR | — | `ApplicationResponse/cac:DocumentResponse/cac:Response/cbc:Description` | `0..n` › `1..1` › `0..n` | **Pendiente de verificar** | `EnvioComprobante.descripcionRespuesta` | `submission $.responseDescription` | FR-10, INV-15 | — (sin escenario) |
| TR-34 | El CDR referencia al comprobante enviado | — | `ApplicationResponse/cac:DocumentResponse/cac:DocumentReference/cbc:ID` | `0..n` › `1..n` › `1..1` | **Pendiente de verificar** | `EnvioComprobante.comprobanteReferido` | — | FR-10, INV-15 | — (sin escenario) |

`submission` = `specs/contracts/schemas/submission.response.schema.json`.

### Filas específicas de boleta (FEAT-002)

| ID | Requisito SUNAT | Catálogo SUNAT | Elemento UBL (ruta completa) | Cardinalidad en XSD | Obligatoriedad SUNAT | Entidad.atributo del dominio | Campo DTO (JSON path) | Regla / invariante | Escenario Gherkin |
|----|-----------------|----------------|------------------------------|---------------------|----------------------|------------------------------|-----------------------|--------------------|-------------------|
| TR-35 | Tipo de comprobante: boleta = `03` | Cat. 01 | `Invoice/cbc:InvoiceTypeCode` | `0..1` | Obligatorio (FEAT-002 FR-1); cita oficial: **Pendiente de verificar** | `Comprobante.tipoComprobante` | `res $.documentType` (en `req` lo fija la ruta `/boletas`) | FEAT-002 FR-1 | ESC-07 |
| TR-36 | Serie de boleta (`B` + 3 alfanuméricos) y correlativo identifican el comprobante | Cat. 01 (serie según tipo) | `Invoice/cbc:ID` | `1..1` | Obligatorio (XSD). Formato `serie-correlativo`, secuencia y unicidad: **Pendiente de verificar** | `Comprobante.serieCorrelativo`; `Serie.codigo` | `req $.series`, `req $.correlative`; `res $.series`, `res $.correlative` | FEAT-002 FR-3, INV-04 | ESC-07, ESC-10 |
| TR-37 | Cliente con DNI: 8 dígitos, Catálogo 06 código `1` | Cat. 06 | `Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID/@schemeID` | `1..1` › `0..1` › `0..n` › `1..1`; `@schemeID` opcional | Condicional: DNI con 8 dígitos (FEAT-002 FR-2); cita oficial: **Pendiente de verificar** | `Cliente.tipoDocumento`; `Cliente.numeroDocumento` (`Dni`) | `req $.customer.documentType`, `req $.customer.documentNumber` | FEAT-002 FR-2 | ESC-07 |
| TR-38 | Cliente sin documento; `documentNumber` omitido. Supuesto provisional: Catálogo 06 código `0` | Cat. 06 (oficialmente `0` = doc. tributario no domiciliado sin RUC, RS 245-2017) | `Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID` (+ `@schemeID`) | `1..1` › `0..1` › `0..n` › `1..1`; `@schemeID` opcional | El código `0` no significa "sin documento" en el anexo oficial; el código correcto para boleta "varios": **Pendiente de verificar** | `Cliente.tipoDocumento`; `Comprobante.datosCliente.tipoDocumento` | `req $.customer.documentType`; `documentNumber` omitido | FEAT-002 FR-2 | ESC-08 |
| TR-39 | Tributo ICBPER en boleta por cantidad de bolsas | Cat. 05 código `7152` | `Invoice/cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:ID` | `0..n` › `0..n` › `1..1` › `1..1` › `0..1` | Condicional: si la línea incluye bolsas; monto unitario y ubicación: **Pendiente de verificar** | `TributoLinea.codigoTributo`; `LineaComprobante.cantidadBolsasIcbper` | `req $.items[*].icbperQuantity`; `res $.totals.icbperAmount` | FEAT-002 FR-7 | ESC-09, ESC-11 |

### Notas de crédito y débito

Cardinalidades verificadas el 2026-11-12 contra [UBL-CreditNote-2.1.xsd](../reference/ubl-2.1/maindoc/UBL-CreditNote-2.1.xsd), [UBL-DebitNote-2.1.xsd](../reference/ubl-2.1/maindoc/UBL-DebitNote-2.1.xsd) y los tipos comunes en [UBL-CommonAggregateComponents-2.1.xsd](../reference/ubl-2.1/common/UBL-CommonAggregateComponents-2.1.xsd). En esta tabla las cardinalidades son las del XSD, no una declaración de obligatoriedad SUNAT.

| ID | Requisito / dato | Catálogo SUNAT | Elemento UBL (ruta completa) | Cardinalidad XSD real | Regla de la feature / verificación | Campo DTO | Escenario |
|----|------------------|----------------|------------------------------|-----------------------|------------------------------------|-----------|-----------|
| ND-01 | Identificador de la nota de crédito | — | `CreditNote/cbc:ID` | `1..1` | Obligatorio por XSD | `res $.id` (identificador interno); ID UBL se genera en XML | ESC-13 |
| ND-02 | Fecha de emisión de la nota de crédito | — | `CreditNote/cbc:IssueDate` | `1..1` | Obligatorio por XSD | Asignada por el sistema | ESC-13 |
| ND-03 | Código del tipo de nota de crédito en el documento UBL | Cat. 01 `07` identifica tipo de comprobante en los datos aportados; relación con este elemento: **Pendiente de verificar** | `CreditNote/cbc:CreditNoteTypeCode` | `0..1` | El XSD lo permite opcionalmente. No confundir con Cat. 01 ni fijar equivalencia sin verificar perfil SUNAT | — (derivado de la ruta y del tipo de solicitud) | ESC-13 |
| ND-04 | Referencia obligatoria al comprobante original | — | `CreditNote/cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID` | `0..n` › `0..1` › `1..1` | La ruta del original es opcional en XSD; FEAT-003 la exige en el contrato de negocio. Uso exacto en perfil SUNAT: **Pendiente de verificar** | `req $.originalDocumentId` (ID interno resuelto al ID UBL del original) | ESC-13, ESC-15 |
| ND-05 | Motivo de la nota de crédito | Cat. 09, códigos `01`–`13` (RS 000165-2021) | `CreditNote/cac:DiscrepancyResponse/cbc:ResponseCode` (+ `cbc:ReferenceID`, `cbc:Description`) | `0..n` › `0..1` (`Description` `0..n`) | Opcional en XSD; SUNAT exige los tres elementos (guía XML, ítem 8). Validado por enum en el contrato | `req $.reasonCode`, `req $.reasonDescription` | ESC-13 |
| ND-06 | Emisor y cliente | — | `CreditNote/cac:AccountingSupplierParty`; `CreditNote/cac:AccountingCustomerParty` | `1..1` cada uno | Obligatorios por XSD; requisitos adicionales SUNAT: **Pendiente de verificar** | Datos del original; no se repiten en request | ESC-13 |
| ND-07 | Totales tributarios | Catálogos tributarios aplicables; perfil de nota: **Pendiente de verificar** | `CreditNote/cac:TaxTotal` | `0..n` | Opcional por XSD; cálculo y obligatoriedad SUNAT: **Pendiente de verificar** | Calculado a partir de `req $.items` | ESC-13 |
| ND-08 | Total monetario de crédito | — | `CreditNote/cac:LegalMonetaryTotal` | `1..1` | Obligatorio por XSD | Calculado por el sistema | ESC-13 |
| ND-09 | Líneas de nota de crédito | — | `CreditNote/cac:CreditNoteLine` | `1..n` | Al menos una línea obligatoria por XSD | `req $.items` | ESC-13 |
| ND-10 | Identificador de la nota de débito | — | `DebitNote/cbc:ID` | `1..1` | Obligatorio por XSD | `res $.id` (identificador interno); ID UBL se genera en XML | ESC-14 |
| ND-11 | Fecha de emisión de la nota de débito | — | `DebitNote/cbc:IssueDate` | `1..1` | Obligatorio por XSD | Asignada por el sistema | ESC-14 |
| ND-12 | Tipo de nota de débito | Cat. 01 `08` identifica tipo de comprobante en los datos aportados; no existe `cbc:DebitNoteTypeCode` en el XSD local | Raíz `DebitNote` | Elemento raíz `1..1` | Documento UBL `DebitNote`; Catálogo 01 y perfil SUNAT: **Pendiente de verificar** | Derivado de la ruta `createDebitNote` | ESC-14 |
| ND-13 | Referencia obligatoria al comprobante original | — | `DebitNote/cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID` | `0..n` › `0..1` › `1..1` | La ruta del original es opcional en XSD; FEAT-003 la exige en el contrato de negocio. Uso exacto en perfil SUNAT: **Pendiente de verificar** | `req $.originalDocumentId` (ID interno resuelto al ID UBL del original) | ESC-14, ESC-15 |
| ND-14 | Motivo de la nota de débito | Cat. 10, códigos `01`–`03` (RS 245-2017) | `DebitNote/cac:DiscrepancyResponse/cbc:ResponseCode` (+ `cbc:ReferenceID`, `cbc:Description`) | `0..n` › `0..1` (`Description` `0..n`) | Opcional en XSD; SUNAT exige los tres elementos (guía XML ND UBL 2.1, ítem 8). Códigos posteriores a 2017: **Pendiente de verificar** | `req $.reasonCode`, `req $.reasonDescription` | ESC-14 |
| ND-15 | Emisor y cliente | — | `DebitNote/cac:AccountingSupplierParty`; `DebitNote/cac:AccountingCustomerParty` | `1..1` cada uno | Obligatorios por XSD; requisitos adicionales SUNAT: **Pendiente de verificar** | Datos del original; no se repiten en request | ESC-14 |
| ND-16 | Totales tributarios | Catálogos tributarios aplicables; perfil de nota: **Pendiente de verificar** | `DebitNote/cac:TaxTotal` | `0..n` | Opcional por XSD; cálculo y obligatoriedad SUNAT: **Pendiente de verificar** | Calculado a partir de `req $.items` | ESC-14 |
| ND-17 | Total monetario de débito | — | `DebitNote/cac:RequestedMonetaryTotal` | `1..1` | Obligatorio por XSD; no es `cac:LegalMonetaryTotal` en este documento | Calculado por el sistema | ESC-14 |
| ND-18 | Líneas de nota de débito | — | `DebitNote/cac:DebitNoteLine` | `1..n` | Al menos una línea obligatoria por XSD | `req $.items` | ESC-14 |

Los documentos XSD declaran `cac:BillingReference` con cardinalidad `0..n` tanto en `CreditNote` como en `DebitNote`. Cada `cac:BillingReference` puede contener `cac:InvoiceDocumentReference` `0..1`; el `cbc:ID` de `DocumentReferenceType` es `1..1`. FEAT-003 refuerza el mínimo de negocio a una referencia original. La mención `InvoiceDocumentReference` describe el tipo UBL común y no confirma por sí sola el perfil SUNAT aplicable.

### Anulación de comprobantes

FEAT-004 enruta las facturas a comunicación de baja y las boletas a resumen diario. Los plazos, códigos, estructura de los documentos de comunicación, elementos UBL y cardinalidades correspondientes están **Pendiente de verificar** contra la normativa y esquemas SUNAT aplicables; no se atribuyen aquí elementos de `CreditNote` o `DebitNote` a la anulación.

## 2. Brechas UBL vs SUNAT

Elementos opcionales en el XSD UBL 2.1 (`minOccurs="0"` o atributo `use="optional"`) que el proyecto trata como obligatorios o condicionales por un requisito SUNAT. Para el proyecto, la regla SUNAT prevalece sobre el XSD. Las validaciones las hacen el dominio y el generador XML; el XSD no las garantiza.

| Elemento UBL | XSD | Exigencia en el proyecto | Fuente | Estado |
|--------------|-----|--------------------------|--------|--------|
| `Invoice/cbc:InvoiceTypeCode` | `0..1` | Obligatorio (`01`) | FR-1, Cat. 01 | ✅ [G] numeral 9 |
| `Invoice/cbc:DocumentCurrencyCode` | `0..1` | Obligatorio (`PEN`/`USD`) | FR-4 | ✅ [G] numeral 11 |
| `Invoice/cbc:IssueTime` | `0..1` | Obligatorio | [G] numeral 7 | ✅ |
| `Invoice/cbc:UBLVersionID`, `Invoice/cbc:CustomizationID` | `0..1` | Obligatorios: `2.1` y `2.0` | [G] numerales 2 y 3 | ✅ |
| `Invoice/ext:UBLExtensions`, `Invoice/cac:Signature` | `0..1`, `0..n` | Obligatorio (XML firmado) | [G] numeral 1; INV-14 | ✅ ubicación; algoritmo y certificado: feature futura |
| `cac:AccountingSupplierParty/cac:Party` y `cac:AccountingCustomerParty/cac:Party` | `0..1` | Obligatorio | FR-2, INV-02, INV-03 | — |
| `cac:Party/cac:PartyIdentification` y `cac:PartyLegalEntity` (emisor y cliente) | `0..n` | Obligatorios, 1 ocurrencia | [A] numerales 10, 12, 17 y 18 | ✅ |
| `cac:PartyIdentification/cbc:ID/@schemeID` | opcional | Obligatorio (código Cat. 06) | [G] numerales 16 y 18 | ✅ |
| `cac:Party/cac:PartyLegalEntity/cbc:RegistrationName` | `0..1` | Obligatorio (DTO exige `legalName`) | [G] numerales 15 y 19 | ✅ |
| `cac:InvoiceLine/cbc:InvoicedQuantity` | `0..1` | Obligatorio (`quantity > 0`) | [G] numeral 36 | ✅ |
| `cbc:InvoicedQuantity/@unitCode` | opcional | Obligatorio (Cat. 03) | [G] numeral 36 | ✅; lista de códigos del Cat. 03: **Pendiente de verificar** |
| `cac:InvoiceLine/cac:Price` y `cac:PricingReference` | `0..1`; `0..1` | Obligatorios | [G] numerales 38 y 48 | ✅ |
| `cac:InvoiceLine/cac:TaxTotal`, `cac:TaxTotal/cac:TaxSubtotal` | `0..n` | Obligatorio, ≥ 1 subtotal por línea | FR-5 | **Pendiente de verificar** |
| `cac:TaxCategory/cbc:TaxExemptionReasonCode` | `0..1` | Obligatorio en la línea (no en la cabecera) | [G] numeral 42, Cat. 07 | ✅ |
| `cac:TaxCategory/cbc:TierRange` | `0..1` | Condicional: con ISC, en la línea | [G] numeral 43, Cat. 08 | ✅ |
| `cac:TaxScheme/cbc:ID`, `cbc:Name`, `cbc:TaxTypeCode` | `0..1` c/u | Obligatorios (Cat. 05: `1000`/`IGV`/`VAT`, `2000`/`ISC`/`EXC`) | [G] numerales 23 a 28 y 42 a 43 | ✅ |
| `cac:TaxSubtotal/cbc:TaxableAmount` | `0..1` | Se genera siempre | FR-7 | **Pendiente de verificar** |
| `cbc:Percent` (`TaxSubtotal` o `TaxCategory`) | `0..1` | Se genera para IGV/ISC | FR-8 | Ubicación: **Pendiente de verificar** |
| `cbc:PerUnitAmount` | `0..1` | Condicional: ICBPER | FR-12 | Ubicación verificada: `cac:TaxSubtotal/cac:TaxCategory` (RS 150-2019). Monto: **Pendiente de verificar** |
| `Invoice/cac:TaxTotal` | `0..n` | Obligatorio | FR-9 | **Pendiente de verificar** |
| `cac:LegalMonetaryTotal/cbc:LineExtensionAmount`, `cbc:TaxInclusiveAmount` | `0..1` | Se genera `LineExtensionAmount`; `TaxInclusiveAmount` sin definir | FR-9 | **Pendiente de verificar** |
| `ApplicationResponse/cac:DocumentResponse` y `cac:Response/cbc:ResponseCode` | `0..n`, `0..1` | Necesarios para pasar a `ACEPTADO`/`RECHAZADO` | FR-10, INV-15 | Valores de `ResponseCode`: **Pendiente de verificar** |

Caso inverso (obligatorio en XSD): `Invoice/cbc:ID`, `Invoice/cbc:IssueDate`, `Invoice/cac:AccountingSupplierParty`, `Invoice/cac:AccountingCustomerParty`, `Invoice/cac:LegalMonetaryTotal` (con `cbc:PayableAmount`), `Invoice/cac:InvoiceLine` (con `cbc:ID`, `cbc:LineExtensionAmount`, `cac:Item`), `cac:TaxSubtotal/cbc:TaxAmount`, `cac:TaxSubtotal/cac:TaxCategory`, `cac:TaxCategory/cac:TaxScheme`, `cac:Price/cbc:PriceAmount` y `@currencyID` en todo importe. El generador XML debe producirlos siempre.

## 3. Comparación ejemplo OASIS vs SUNAT

Ejemplo: `specs/reference/ubl-2.1/examples/UBL-Invoice-2.1-Example.xml` (factura europea). Muestra que el XSD admite códigos de cualquier lista; la elección de catálogos SUNAT es una regla del proyecto, no del estándar.

| Elemento | Valor en el ejemplo (Europa) | Valor esperado SUNAT |
|----------|------------------------------|----------------------|
| `cbc:UBLVersionID` | `2.1` | `2.1` (versión UBL del proyecto). Obligatoriedad: **Pendiente de verificar** |
| `cbc:CustomizationID` | (ausente) | **Pendiente de verificar** |
| `cbc:ID` | `TOSL108` | Serie + correlativo, p. ej. `F001` y `123`. Formato de concatenación: **Pendiente de verificar** |
| `cbc:IssueDate` | `2009-12-15` | Mismo formato `YYYY-MM-DD` |
| `cbc:IssueTime` | (ausente) | Hora de emisión. Obligatoriedad: **Pendiente de verificar** |
| `cbc:InvoiceTypeCode` | `380` (`listID="UN/ECE 1001 Subset"`) | `01` (Cat. 01). Atributos `listID`/`listAgencyID` SUNAT: **Pendiente de verificar** |
| `cbc:DocumentCurrencyCode` | `EUR` (`listID="ISO 4217 Alpha"`) | `PEN` o `USD` (ISO 4217) |
| `@currencyID` de los importes | `EUR` | Igual a `cbc:DocumentCurrencyCode` (`PEN`/`USD`) |
| Identificación del emisor | `cac:PartyIdentification/cbc:ID schemeID="ZZZ"` (`Supp123`) y `cac:PartyIdentification/cbc:ID schemeID="DKVAT"` | `cac:PartyIdentification/cbc:ID` = RUC, `schemeID="6"` (Cat. 06). Uso en emisor: **Pendiente de verificar** |
| Identificación del cliente | `cac:PartyIdentification/cbc:ID schemeID="BEVAT"`; `cac:PartyLegalEntity/cbc:CompanyID schemeID="ZZZ"` | `cac:PartyIdentification/cbc:ID` = RUC con `schemeID="6"` (Cat. 06) para factura |
| `cac:TaxCategory/cbc:ID` | `S`, `AA`, `E` (`UN/ECE 5305`) | **Pendiente de verificar** (el proyecto aún no usa este elemento) |
| `cac:TaxCategory/cbc:Percent` | `20`, `10`, `0` | `18` para IGV con Cat. 07 `10`; tasa ISC: **Pendiente de verificar** |
| `cac:TaxScheme/cbc:ID` | `VAT` (`UN/ECE 5153`) | `1000` IGV, `2000` ISC, `7152` ICBPER, `9995`–`9998` (Cat. 05) |
| `cac:TaxCategory/cbc:TaxExemptionReasonCode` | `AAM` (`listID="CWA 15577"`), solo en la categoría exenta | Código Cat. 07 (`10`, `20`, `30`, `40`, …) en **todas** las líneas |
| `cac:TaxCategory/cbc:TierRange` | (ausente) | Código Cat. 08 (`01`, `02`, `03`) cuando la línea tiene ISC |
| `cbc:InvoicedQuantity/@unitCode` | `C62` | Catálogo SUNAT de unidades: **Pendiente de verificar** |
| Impuesto a nivel de ítem | `cac:Item/cac:ClassifiedTaxCategory` | El proyecto usa `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal`. Uso SUNAT de `ClassifiedTaxCategory`: **Pendiente de verificar** |
| `cac:LegalMonetaryTotal` | `LineExtensionAmount`, `TaxExclusiveAmount`, `TaxInclusiveAmount`, `AllowanceTotalAmount`, `ChargeTotalAmount`, `PrepaidAmount`, `PayableRoundingAmount`, `PayableAmount` | El proyecto genera `LineExtensionAmount` y `PayableAmount`; descuentos, cargos, anticipos y redondeo: **Pendiente de verificar** |
| `cac:Signature` / `ext:UBLExtensions` | (ausentes) | XML firmado obligatorio (INV-14) |

## 4. Cobertura

### 4.1 Requisitos funcionales (`001-emitir-factura.md`)

| FR | Filas TR | Estado |
|----|----------|--------|
| FR-1 Tipo de comprobante | TR-01 | ✅ Cubierto |
| FR-2 Identificación del cliente | TR-09, TR-10 | ✅ Cubierto |
| FR-3 Serie y correlativo | TR-02 | ✅ Cubierto |
| FR-4 Moneda | TR-05, TR-06 | ✅ Cubierto |
| FR-5 Afectación IGV | TR-17 | ✅ Cubierto |
| FR-6 Sistema ISC | TR-18, TR-20 | ✅ Cubierto |
| FR-7 Base IGV con ISC | TR-16, TR-23, TR-24 | ✅ Cubierto |
| FR-8 Cálculo IGV | TR-19, TR-24, TR-26 | ✅ Cubierto |
| FR-9 Totales | TR-16, TR-25, TR-28, TR-29, TR-30 | ✅ Cubierto |
| FR-10 Envío y estado | TR-32, TR-33, TR-34 | ✅ Cubierto |
| FR-11 Errores de validación | — | ❌ **Sin fila TR**: no corresponde a un dato UBL. Se cubre con `error.response.schema.json` y ESC-03, ESC-04, ESC-05 |
| FR-12 ICBPER | TR-21, TR-27 | ✅ Cubierto (sin escenario Gherkin) |

### 4.2 Invariantes (`modelo-dominio.md`)

| INV | Filas TR | Estado |
|-----|----------|--------|
| INV-01 | TR-01 | ✅ |
| INV-02 | TR-09, TR-10 | ✅ |
| INV-03 | TR-07 | ✅ (sin escenario) |
| INV-04 | TR-02 | ✅ |
| INV-05 | TR-05, TR-06 | ✅ |
| INV-06 | TR-12, TR-13, TR-15 | ✅ |
| INV-07 | TR-17 | ✅ |
| INV-08 | TR-18, TR-20 | ✅ |
| INV-09 | TR-19, TR-23, TR-24, TR-26 | ✅ |
| INV-10 | TR-22 | ✅ (sin escenario) |
| INV-11 | TR-21, TR-27 | ✅ (sin escenario) |
| INV-12 | TR-25, TR-28, TR-29, TR-30 | ✅ |
| INV-13 | — | ❌ **Sin fila TR**: regla de diseño (inmutabilidad), no normativa |
| INV-14 | TR-31 | ✅ (sin escenario) |
| INV-15 | TR-32, TR-33, TR-34 | ✅ |
| INV-16 | — | ❌ **Sin fila TR**: máquina de estados interna, sin elemento UBL |

### 4.3 Filas sin escenario Gherkin

TR-03, TR-04, TR-06, TR-07, TR-08, TR-11, TR-14, TR-21, TR-22, TR-27, TR-28, TR-29, TR-31, TR-33, TR-34. Hay que agregar escenarios en `001-emitir-factura.md` antes de la fase de tests. Prioridad: TR-21/TR-27 (ICBPER), TR-31 (firma), TR-33/TR-34 (CDR aceptado y rechazado). TR-30 (importe total) está cubierto explícitamente por ESC-01 (`And el importe total es 118.00`).

### 4.4 Datos del dominio no expuestos en la API

TR-03 (fecha de emisión), TR-28 (total de tributos), TR-29 (total valor de venta) y el detalle por línea (TR-16, TR-19 a TR-24) no aparecen en `invoice.response.schema.json`. La decisión de exponerlos está **Pendiente de definir**.

### 4.5 Cobertura específica de FEAT-002

| Requisito | Filas TR | Escenario | Estado |
|-----------|----------|-----------|--------|
| FR-1 Tipo de comprobante boleta | TR-35 | ESC-07 | Cubierto |
| FR-2 Cliente DNI o sin documento | TR-37, TR-38 | ESC-07, ESC-08 | Parcial; el código `0` es un supuesto provisional (oficialmente = no domiciliado sin RUC) |
| FR-3 Serie B y correlativo | TR-36 | ESC-07, ESC-10 | Cubierto |
| FR-7 ICBPER | TR-39 | ESC-09, ESC-11 | Cubierto; monto y ubicación UBL pendientes de verificar |
| FR-8 Totales | TR-25, TR-30, TR-39 | ESC-07, ESC-09 | Cubierto |
| FR-9 Envío y estado | TR-32 a TR-34 | ESC-12 | Cubierto |

## 4bis. Contraste con la Guía XML de Factura UBL 2.1 de SUNAT

**[G]** SUNAT, *Guía de elaboración de documentos XML – Factura Electrónica UBL 2.1*, versión 1.0, mayo 2017 (proyecto de comprobantes de pago electrónicos). Revisada el 2026-11-12 contra el generador `backend/src/ubl-invoice-xml-generator.ts`.

| Numeral [G] | Exigencia de la guía | Antes en el generador | Ahora |
|-------------|----------------------|-----------------------|-------|
| 1 | Firma en `ext:UBLExtensions/.../ds:Signature` y referencia en `cac:Signature` | Sin firma ni referencia | `cac:Signature` con URI `#SignatureSP`; namespaces `ext` y `ds` declarados. `ds:Signature` la agrega el puerto `FirmadorXml` |
| 3 | `cbc:CustomizationID` = `2.0` | Ausente | ✅ |
| 4 | `cbc:ProfileID`: tipo de operación (Cat. 51) | Ausente | ✅ `0101` (venta interna) por defecto |
| 7 | `cbc:IssueTime` obligatorio | Ausente | ✅ `issueTime` obligatorio, `hh:mm:ss` |
| 9 y 11 | Atributos `@listAgencyName`, `@listName`, `@listURI` / `@listID` | Sin atributos | ✅ |
| 14 a 19 | Emisor y cliente en `cac:PartyTaxScheme` (`RegistrationName`, `CompanyID` con `@schemeID` Cat. 06, `TaxScheme/ID` = `-`); `AddressTypeCode` del emisor | `PartyIdentification` + `PartyLegalEntity`; el emisor llevaba `schemeID` fijo sin atributos de catálogo | ✅ |
| 22 a 28 | Cabecera: `TaxCategory/cbc:ID` (UN/ECE 5305) y `TaxScheme` con código, nombre y código internacional; sin afectación IGV | Solo `TaxScheme/cbc:ID`; `TaxExemptionReasonCode` también en la cabecera | ✅ |
| 30, 31 y 34 | `LineExtensionAmount`, `TaxInclusiveAmount`, `PayableAmount` | Incluía `TaxExclusiveAmount` | ✅ se retiró |
| n(12,2) | Importes con dos decimales | `18`, `118` | ✅ `18.00`, `118.00` |
| 36 | `@unitCode` (Cat. 03) con `@unitCodeListID` | Sin unidad | ✅ `NIU` por defecto |
| 38 | Precio de venta unitario con tributos, `PriceTypeCode` `01` (Cat. 16) | Ausente | ✅ |
| 42 | `cbc:Percent` y `TaxExemptionReasonCode` con atributos de Cat. 07 | Sin porcentaje ni atributos | ✅ `18.00` |
| 43 | ISC con `TierRange` y tributo `2000`/`ISC`/`EXC` | Solo el código `2000` | ✅ |
| 45 | Código de producto en `cac:SellersItemIdentification/cbc:ID` | Ausente | ✅ si se informa `productCode` |

Verificación: el XML generado es válido contra `specs/reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd`, y 19 pruebas unitarias cubren estas reglas.

Diferencias abiertas:
- [G] es de 2017. Versiones posteriores de la guía pueden ubicar al emisor y al cliente en `cac:PartyIdentification` y `cac:PartyLegalEntity`: **Pendiente de verificar** con la guía vigente.
- En [G] el `@schemeURI` de `cbc:ProfileID` dice `catalogo17`, aunque el texto cita el Catálogo 51; el generador sigue el ejemplo de la guía.
- Los ejemplos numéricos de [G] (sección 2.5 B, factura con ISC) tienen importes inconsistentes; el generador sigue la regla escrita: base IGV = valor de venta + ISC.
- Leyendas (`cbc:Note`, numeral 10), descuentos y cargos (numerales 21, 32, 33, 40 y 41) y operaciones gratuitas (26 y 39) todavía no se generan.


## 4ter. Actualización al formato vigente (Anexo 9-A, RS 114-2019) y forma de pago (RS 193-2020)

**[A]** SUNAT, *Anexo N.° 9-A: Estándar UBL 2.1*, Anexo VII de la [RS N.° 114-2019/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2019/anexoVII-114-2019.pdf). **[FP]** Anexo IV de la [RS N.° 000193-2020/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2020/anexo4-193-2020.pdf), numerales 170 a 173. Revisados el 2026-11-12.

[A] es posterior a la guía [G] de 2017 y prevalece donde difieren. El generador se actualizó así:

| Elemento | Según [G] (2017) | Según [A] y [FP] (vigente) — ahora en el generador |
|----------|------------------|------------------------------------------------------|
| Emisor y cliente | `cac:PartyTaxScheme/cbc:CompanyID` y `cbc:RegistrationName` | `cac:PartyIdentification/cbc:ID` (@schemeID Cat. 06) y `cac:PartyLegalEntity/cbc:RegistrationName` ([A] 10, 12, 17 y 18) |
| Código de establecimiento | `cac:PartyTaxScheme/cac:RegistrationAddress/cbc:AddressTypeCode` | `cac:PartyLegalEntity/cac:RegistrationAddress/cbc:AddressTypeCode`, obligatorio ([A] 16) |
| Tipo de operación (Cat. 51) | `cbc:ProfileID` | `cbc:InvoiceTypeCode/@listID`, con `@name="Tipo de Operacion"` y `@listSchemeURI` …catalogo51 ([A] 58) |
| `cbc:CustomizationID` | sin atributos | `@schemeAgencyName="PE:SUNAT"` ([A] 2) |
| `cac:TaxCategory/cbc:ID` (UN/ECE 5305) | presente | no figura en [A]; se retiró |
| `cac:TaxScheme/cbc:ID` | atributos UN/ECE 5153 | `@schemeName="Codigo de tributos"`, `@schemeAgencyName="PE:SUNAT"`, `@schemeURI` …catalogo05 ([A] 36 y 40 a 48) |
| Forma de pago | no existía | `cac:PaymentTerms`: `cbc:ID`=`FormaPago` y `cbc:PaymentMeansID`=`Contado`/`Credito`; con crédito, monto neto pendiente y cuotas `Cuota001`… con `cbc:Amount` y `cbc:PaymentDueDate`. **Obligatoria** ([FP] nota 3) |
| Descripción del ítem | an..250 | an..500 ([A] 31) |
| RUC | solo 11 dígitos | 11 dígitos con dígito verificador (módulo 11). Cita oficial del algoritmo: **Pendiente de verificar** |

Verificación: el XML generado es válido contra `UBL-Invoice-2.1.xsd`; 27 pruebas unitarias del generador cubren estas reglas.

## 5. Pendiente de verificar (resumen)

1. Obligatoriedad SUNAT con cita oficial de: TR-01, TR-03 a TR-05, TR-07 a TR-11, TR-13 a TR-15, TR-17 a TR-19, TR-23, TR-25, TR-26, TR-28, TR-29, TR-32 a TR-34.
2. ~~Valores y obligatoriedad de `cbc:UBLVersionID` y `cbc:CustomizationID`~~: resuelto con [G] (`2.1` y `2.0`).
3. Formato `serie-correlativo` en `cbc:ID`; secuencia y unicidad.
4. Algoritmo del dígito verificador del RUC.
5. Ubicación de `cbc:Percent` (`TaxSubtotal` vs `TaxCategory`); monto ICBPER por unidad; tasas ISC. (`cbc:PerUnitAmount` ya verificado en `TaxCategory`).
6. Correspondencia Cat. 07 → Cat. 05 (`9995`–`9998`) y tratamiento de Cat. 07 `11`–`17`.
7. Catálogo SUNAT de unidades de medida (`@unitCode`).
8. Valores de `cbc:ResponseCode` del CDR y ubicación de las observaciones.
9. Algoritmo de firma y certificado (la ubicación `ext:UBLExtensions` / `cac:Signature` ya se verificó con [G]).
10. ~~Contraste de los catálogos con el anexo oficial~~: hecho (ver `catalogos-sunat.md`).
