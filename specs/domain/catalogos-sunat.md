# Catálogos SUNAT de referencia

Estos catálogos se usan en el modelo de dominio, los contratos (`enum`) y la matriz de trazabilidad. Todos forman parte del **Anexo N.° 8 (catálogo de códigos)** de la RS N.° 097-2012/SUNAT y sus modificatorias.

## Verificación contra fuentes oficiales (2026-11-12)

| Fuente oficial SUNAT | Catálogos contrastados |
|----------------------|------------------------|
| [F1] [Anexo E de la RS N.° 245-2017/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2017/anexoE-245-2017.pdf): Anexo N.° 8 completo | 01, 02, 06, 07, 08, 09 (versión 2017), 10 |
| [F2] [Anexos de la RS N.° 150-2019/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2019/anexos-150-2019.pdf): Anexo VI reemplaza el Catálogo 05; Anexo I agrega los campos ICBPER | 05 y ubicación UBL del ICBPER |
| [F3] [Anexo de la RS N.° 000165-2021/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2021/anexo-165-2021.pdf): Anexo IV modifica el Catálogo 09 | 09 |
| [F4] [Guía XML Nota de Débito UBL 2.1](https://cpe.sunat.gob.pe/sites/default/files/inline-files/guia%2Bxml%2Bnota%20de%20d%C3%A9bito%2Bversion%202-1%2B1%2B0_0_0%20%282%29.pdf), v1.0, mayo 2017 | Estructura de `cac:TaxScheme` y `cac:DiscrepancyResponse` |

| Catálogo | Resultado |
|----------|-----------|
| 01 | ✅ Los 5 códigos del proyecto coinciden con [F1]. El oficial tiene más códigos (12, 14, 20, 31, 40…) que este proyecto no usa. |
| 02 (moneda) | ✅ [F1]: ISO 4217 en `cbc:DocumentCurrencyCode`. |
| 05 | ⚠️ Corregido: faltaban `1016` (IVAP) y `9999` (otros tributos); se agregan nombre y código internacional. El `7152` (ICBPER) no estaba en [F1] y sí en [F2]. |
| 06 | ⚠️ Corregido: el código `0` no significa "sin documento", sino "documento tributario no domiciliado sin RUC" [F1]. |
| 07 | ✅ Los 18 códigos coinciden con [F1]. |
| 08 | ✅ Los 3 códigos coinciden con [F1]. |
| 09 / 10 | ✅ Verificados con [F3] y [F1] (ver más abajo). |

> Los catálogos pueden haber cambiado después de las resoluciones citadas. La última versión consultada de cada uno es la indicada; una modificación posterior: **Pendiente de verificar**.

---

## Catálogo No. 01: Tipo de documento

- **Elemento UBL**: `cbc:InvoiceTypeCode`
- **Ubicación**: cabecera de `Invoice`.
- **Fuente**: [F1].

| Código | Descripción |
|--------|-------------|
| 01 | Factura |
| 03 | Boleta de venta |
| 07 | Nota de crédito |
| 08 | Nota de débito |
| 09 | Guía de remisión remitente |

---

## Catálogo No. 05: Códigos de tipos de tributos y otros conceptos

- **Elemento UBL**: `cac:TaxScheme/cbc:ID` (código), `cac:TaxScheme/cbc:Name` (nombre) y `cac:TaxScheme/cbc:TaxTypeCode` (código internacional UN/ECE 5153).
- **Fuente**: Anexo VI de [F2], que reemplaza la versión de [F1]. Estructura XML: [F4], ítem 26 (ejemplo `<cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>`).

| Código | Descripción | Código internacional | Nombre |
|--------|-------------|----------------------|--------|
| 1000 | IGV Impuesto General a las Ventas | VAT | IGV |
| 1016 | Impuesto a la Venta Arroz Pilado | VAT | IVAP |
| 2000 | ISC Impuesto Selectivo al Consumo | EXC | ISC |
| 7152 | Impuesto al Consumo de las bolsas de plástico | OTH | ICBPER |
| 9995 | Exportación | FRE | EXP |
| 9996 | Gratuito | FRE | GRA |
| 9997 | Exonerado | VAT | EXO |
| 9998 | Inafecto | FRE | INA |
| 9999 | Otros tributos | OTH | OTROS |

### Reglas derivadas
- Una línea con afectación Cat. 07 `17` (IVAP) usa el tributo `1016`, no el `1000`.
- **ICBPER** ([F2], Anexo I): la cantidad de bolsas va en `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cbc:BaseUnitMeasure` y la tasa por bolsa en `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:PerUnitAmount`. El ICBPER suma al monto total de tributos.
- El monto vigente del ICBPER por bolsa lo fija la ley, no el catálogo: **Pendiente de verificar**.

---

## Catálogo No. 06: Tipo de documento de identidad

- **Atributo UBL**: `schemeID` del identificador de la parte.
- **Fuente**: [F1]. El oficial tiene además los códigos `A`, `B`, `C` y `D` (documentos diplomáticos y extranjeros), que este proyecto no usa.

| Código | Descripción oficial | Uso en el proyecto |
|--------|---------------------|--------------------|
| 0 | DOC.TRIB.NO.DOM.SIN.RUC (documento tributario de no domiciliado sin RUC) | Cliente no domiciliado sin RUC |
| 1 | Documento nacional de identidad (DNI) | Boleta |
| 4 | Carnet de extranjería | Boleta |
| 6 | Registro único de contribuyentes (RUC) | Factura (obligatorio) |
| 7 | Pasaporte | Boleta |

> ⚠️ **Corrección**: antes este proyecto describía el código `0` como "sin documento". Según [F1] no es así. El código que SUNAT usa para una boleta a un cliente sin documento ("varios") no aparece en [F1]: **Pendiente de verificar** con la versión vigente del catálogo y la guía XML de boleta.
>
> **Ubicación del `schemeID`**: la Guía XML Factura UBL 2.1 (SUNAT, 2017, numerales 16 y 18) y [F4] lo ubican en `cac:PartyIdentification/cbc:ID`; el proyecto y el generador XML ya usan esa ruta. Si una guía posterior lo cambió a `cac:PartyIdentification/cbc:ID`: **Pendiente de verificar**.

---

## Moneda (ISO 4217)

- **Elemento UBL**: `cbc:DocumentCurrencyCode`

| Código | Descripción |
|--------|-------------|
| PEN | Sol |
| USD | Dólar estadounidense |

---

## Reglas de emisión aportadas

Las siguientes reglas fueron aportadas junto con los catálogos y quedan pendientes de contraste con las fuentes normativas oficiales:

- **IGV**: tasa de 18%. En UBL, el impuesto se identifica con Catálogo 05, código `1000` (`cac:TaxScheme/cbc:ID`); Catálogo 07 indica la afectación de la línea en `cbc:TaxExemptionReasonCode`. El elemento y ubicación exactos para declarar la tasa en el XML deben verificarse antes de fijarlos.
- **RUC**: 11 dígitos e incluye dígito verificador. El tipo de documento se representa con Catálogo 06, `schemeID="6"` en el `cbc:ID` del cliente. Algoritmo de validación del dígito verificador: **Pendiente de verificar**.
- **DNI**: 8 dígitos. Tipo de documento: Catálogo 06, `schemeID="1"` en el `cbc:ID` del cliente.
- **Factura**: requiere cliente identificado con RUC; Catálogo 06, código `6`.
- **Serie de factura**: `F` seguida de 3 caracteres alfanuméricos (por ejemplo, `F001`).
- **Correlativo**: numérico, de hasta 8 dígitos.
- La serie y el correlativo forman el identificador del comprobante en `cbc:ID`. Reglas de secuencia, unicidad y ubicación final de serie/correlativo: **Pendiente de verificar**.
- **Moneda**: códigos `PEN` o `USD` de ISO 4217, en `cbc:DocumentCurrencyCode`.

---

## Catálogo No. 07: Códigos de Tipo de Afectación del IGV

- **Campo UBL**: `cbc:TaxExemptionReasonCode`
- **Fuente**: [F1]; los 18 códigos coinciden.
- **Descripción**: Tipo de Afectación al IGV
- **Ubicación en el XML**: `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:TaxExemptionReasonCode`

| Código | Descripción | Operación |
|--------|-------------|-----------|
| 10 | Gravado - Operación Onerosa | Onerosa |
| 11 | Gravado – Retiro por premio | Gratuita |
| 12 | Gravado – Retiro por donación | Gratuita |
| 13 | Gravado – Retiro | Gratuita |
| 14 | Gravado – Retiro por publicidad | Gratuita |
| 15 | Gravado – Bonificaciones | Gratuita |
| 16 | Gravado – Retiro por entrega a trabajadores | Gratuita |
| 17 | Gravado – IVAP | Onerosa (IVAP en lugar de IGV) |
| 20 | Exonerado - Operación Onerosa | Onerosa |
| 21 | Exonerado – Transferencia Gratuita | Gratuita |
| 30 | Inafecto - Operación Onerosa | Onerosa |
| 31 | Inafecto – Retiro por Bonificación | Gratuita |
| 32 | Inafecto – Retiro | Gratuita |
| 33 | Inafecto – Retiro por Muestras Médicas | Gratuita |
| 34 | Inafecto - Retiro por Convenio Colectivo | Gratuita |
| 35 | Inafecto – Retiro por premio | Gratuita |
| 36 | Inafecto - Retiro por publicidad | Gratuita |
| 40 | Exportación | Onerosa |

### Reglas derivadas
- **Grupos**: 1x = Gravado, 2x = Exonerado, 3x = Inafecto, 40 = Exportación.
- **Onerosas** (el cliente paga): 10, 17, 20, 30, 40. El resto son operaciones gratuitas (retiros, premios, bonificaciones).
- **Calculan IGV**: 10–16 (tasa 18%). El 17 aplica IVAP (arroz pilado) en lugar de IGV — verificar tasa vigente.
- **Relevantes para abarrotes**: 10 (venta normal), 20 (productos exonerados), 15 (bonificaciones "lleva 3 paga 2"), 13 (retiros), 17 (arroz pilado).

> Pendiente de verificar: si el código 17 se clasifica como operación onerosa según el anexo oficial.

---

## Catálogo No. 08: Códigos de Tipos de Sistema de Cálculo del ISC

- **Campo UBL**: `cbc:TierRange`
- **Fuente**: [F1]; los 3 códigos coinciden.
- **Descripción**: Tipo de Sistema de Cálculo del ISC
- **Ubicación en el XML**: `cac:InvoiceLine/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:TierRange`

| Código | Descripción | Cómo se calcula |
|--------|-------------|-----------------|
| 01 | Sistema al valor (Apéndice IV, lit. A – T.U.O IGV e ISC) | Porcentaje sobre el valor de venta |
| 02 | Aplicación del Monto Fijo (Apéndice IV, lit. B – T.U.O IGV e ISC) | Monto fijo por unidad / litro |
| 03 | Sistema de Precios de Venta al Público (Apéndice IV, lit. C – T.U.O IGV e ISC) | Porcentaje sobre el precio de venta al público |

### Reglas derivadas
- Solo aplica a productos afectos al ISC (licores, cervezas, cigarros, bebidas azucaradas).
- Si una línea tiene ISC, `sistemaIsc` es obligatorio.
- **El ISC forma parte de la base del IGV**:
  ```text
  Base IGV = valor de venta + ISC
  IGV      = Base IGV × 18%
  ```

---

## Relación entre catálogos 07 y 08

Una misma línea de comprobante puede llevar ambos tributos (ej. una cerveza):

| Tributo | Catálogo | Elemento UBL |
|---------|----------|--------------|
| ISC | 08 | `cbc:TierRange` |
| IGV | 07 | `cbc:TaxExemptionReasonCode` |

---

## Catálogo No. 09: Códigos de tipo de nota de crédito electrónica

- **Elemento UBL**: `cbc:ResponseCode`
- **Ubicación en el XML**: `CreditNote/cac:DiscrepancyResponse/cbc:ResponseCode`
- **Fuente**: Anexo N.° 8 (catálogo de códigos), modificado por el Anexo IV de la [RS N.° 000165-2021/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2021/anexo-165-2021.pdf). Versión anterior (códigos 01–10): Anexo E de la [RS N.° 245-2017/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2017/anexoE-245-2017.pdf). Consultado el 2026-11-12.

| Código | Descripción |
|--------|-------------|
| 01 | Anulación de la operación |
| 02 | Anulación por error en el RUC |
| 03 | Corrección por error en la descripción o atención de reclamo respecto de bienes adquiridos o servicios prestados |
| 04 | Descuento global |
| 05 | Descuento por ítem |
| 06 | Devolución total |
| 07 | Devolución por ítem |
| 08 | Bonificación |
| 09 | Disminución en el valor |
| 10 | Otros conceptos |
| 11 | Ajustes de operaciones de exportación |
| 12 | Ajustes afectos al IVAP |
| 13 | Corrección o modificación del monto neto pendiente de pago y/o la(s) fecha(s) de vencimiento del pago único o de las cuotas y/o los montos correspondientes a cada cuota, de ser el caso |

### Reglas derivadas
- El código `13` se usa para corregir o modificar la información de forma de pago al crédito de la factura (RS 000165-2021, Anexo I).
- El código `03` se usa para corregir la descripción o atender un reclamo; la nota debe indicar la descripción correcta o la atención realizada (RS 000165-2021, Anexo I).
- Relevantes para abarrotes: `01` (anular venta), `06`/`07` (devoluciones), `04`/`05` (descuentos), `13` (ventas al crédito).

---

## Catálogo No. 10: Códigos de tipo de nota de débito electrónica

- **Elemento UBL**: `cbc:ResponseCode`
- **Ubicación en el XML**: `DebitNote/cac:DiscrepancyResponse/cbc:ResponseCode`
- **Fuente**: Anexo E de la [RS N.° 245-2017/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2017/anexoE-245-2017.pdf) y [Guía de elaboración XML Nota de Débito UBL 2.1](https://cpe.sunat.gob.pe/sites/default/files/inline-files/guia%2Bxml%2Bnota%20de%20d%C3%A9bito%2Bversion%202-1%2B1%2B0_0_0%20%282%29.pdf) (mayo 2017). Consultado el 2026-11-12.

| Código | Descripción |
|--------|-------------|
| 01 | Intereses por mora |
| 02 | Aumento en el valor |
| 03 | Penalidades / otros conceptos |

> Pendiente de verificar: si resoluciones posteriores a 2017 agregaron códigos al Catálogo 10 (por ejemplo, ajustes de exportación o IVAP). No se incluyen hasta encontrarlos en una fuente oficial.

### Estructura `cac:DiscrepancyResponse` (guía SUNAT de nota de débito, ítem 8)

| Elemento | XSD UBL 2.1 | Regla SUNAT |
|----------|-------------|-------------|
| `cbc:ReferenceID` | `0..1` | Obligatorio: serie-correlativo del comprobante modificado (ej. `F002-6`) |
| `cbc:ResponseCode` | `0..1` | Obligatorio: código del motivo (Cat. 09 o 10) |
| `cbc:Description` | `0..n` | Obligatorio: sustento del motivo; solo una descripción |

> La guía revisada es la de nota de débito. Que la nota de crédito siga la misma estructura se infiere del Anexo N.° 8 (mismo campo `cbc:ResponseCode`); confirmarlo con la guía de nota de crédito: **Pendiente de verificar**.
