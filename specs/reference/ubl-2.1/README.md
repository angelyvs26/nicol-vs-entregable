# Referencia: esquemas UBL 2.1 (OASIS)

- **Fuente**: repositorio GitHub `Tradeshift/tradeshift-ubl-xsd`, tag `v2.1.0` (copia de los esquemas oficiales de OASIS UBL 2.1).
- **Fuente oficial**: http://docs.oasis-open.org/ubl/os-UBL-2.1/UBL-2.1.html
- **Fecha de consulta**: 2026-10-22

## Contenido

| Carpeta | Archivos | Uso |
|---------|----------|-----|
| `maindoc/` | `UBL-Invoice-2.1.xsd` | Factura y boleta (SUNAT usa el mismo documento Invoice) |
| `maindoc/` | `UBL-CreditNote-2.1.xsd`, `UBL-DebitNote-2.1.xsd` | Notas de crédito y débito |
| `maindoc/` | `UBL-ApplicationResponse-2.1.xsd` | Constancia de recepción (CDR) devuelta por SUNAT/OSE |
| `common/` | Componentes `cbc:`, `cac:`, `ext:`, tipos de datos y firma (xmldsig, XAdES) | Requeridos por los documentos de `maindoc/` |
| `examples/` | `UBL-Invoice-2.1-Example.xml` | Ejemplo OASIS (factura europea: EUR, VAT). **No es un ejemplo SUNAT** |

## Notas

- Estos XSD definen la estructura UBL estándar. SUNAT agrega reglas propias (catálogos, formatos de serie, firma obligatoria) que están en sus guías de elaboración y en `specs/domain/catalogos-sunat.md`.
- Usar estos archivos para confirmar los nombres de los elementos UBL citados en la matriz de trazabilidad.
