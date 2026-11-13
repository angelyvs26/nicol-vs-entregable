# Facturación electrónica SUNAT UBL 2.1 – ABC Software Corp

Proyecto del curso de Arquitectura de Software. Contiene las especificaciones de la fase 1 (`specs/`) y el **generador de XML de la factura electrónica en UBL 2.1** (`backend/`).

## Generador de XML (Parcial 2)

El generador está en [`backend/src/ubl-invoice-xml-generator.ts`](backend/src/ubl-invoice-xml-generator.ts). A partir de los datos de una factura (JSON) produce el XML `Invoice` UBL 2.1 según el formato vigente de SUNAT:

- *Anexo N.° 9-A: Estándar UBL 2.1*, Anexo VII de la [RS N.° 114-2019/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2019/anexoVII-114-2019.pdf).
- Forma de pago (contado o crédito con cuotas), Anexo IV de la [RS N.° 000193-2020/SUNAT](https://www.sunat.gob.pe/legislacion/superin/2020/anexo4-193-2020.pdf).

El XML generado es válido contra el XSD oficial de OASIS [`UBL-Invoice-2.1.xsd`](specs/reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd).

**Aceptado por SUNAT (entorno de pruebas):** la factura `F001-123` generada con [`factura-generador-input.json`](specs/examples/factura-generador-input.json), firmada con el certificado de prueba de la herramienta *probar-xml* de Nubefact y enviada al servicio beta de SUNAT, obtuvo el CDR [`R-20512345671-01-F001-123.xml`](specs/examples/R-20512345671-01-F001-123.xml) con `ResponseCode` `0`: *"La Factura numero F001-123, ha sido aceptada"*.

### Cómo generar el XML

Requisitos: Node.js 20 o superior.

```bash
cd backend
npm install
npm run generate:invoice-xml -- ../specs/examples/factura-generador-input.json
```

El XML se escribe en [`specs/examples/factura-generada-F001-123.xml`](specs/examples/factura-generada-F001-123.xml). Para otra ruta de salida, agréguela al final del comando. Para generar otra factura, edite [`specs/examples/factura-generador-input.json`](specs/examples/factura-generador-input.json).

Si un dato no cumple las reglas (RUC con dígito verificador inválido, cantidad cero, fecha imposible, caracteres fuera de ISO-8859-1, etc.), no se genera el archivo y se muestra el motivo.

### Cómo ejecutar las pruebas

```bash
cd backend
npm test
```

### Alcance actual

| Incluido | Pendiente |
|----------|-----------|
| Factura (tipo `01`), moneda PEN o USD | Firma digital: el XML sale sin `ds:Signature` (la agregará el puerto `FirmadorXml`) |
| Ítems gravados (afectación IGV `10`) e ISC (Catálogo 08) | Exonerado, inafecto, exportación y operaciones gratuitas |
| Forma de pago al contado o al crédito con cuotas | Descuentos, cargos, leyendas e ICBPER |
| Validación de RUC, fechas, cantidades y montos | Boleta y notas de crédito y débito |

La trazabilidad de cada elemento XML con la norma SUNAT está en [`specs/traceability/matriz-sunat-ubl.md`](specs/traceability/matriz-sunat-ubl.md) (secciones 4bis y 4ter).

## Interfaz web

Requisito: Node.js 20 o superior. Abre dos terminales desde la raíz del repositorio.

**Terminal 1 — backend NestJS**

```powershell
cd backend
$env:DATABASE_ENABLED = "false"
npm run start:dev
```

`DATABASE_ENABLED=false` omite TypeORM para usar el endpoint de generación XML sin PostgreSQL local. Si no se define o tiene otro valor, el backend conserva la conexión PostgreSQL configurada en `backend/.env`.

**Terminal 2 — frontend Vite**

```powershell
cd frontend
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`). El proxy `/api` reenvía las peticiones al backend en `http://localhost:3000`.

## Especificaciones (fase 1)

Ver [`specs/README.md`](specs/README.md) y el informe [`specs/docs/INFORME-FINAL.md`](specs/docs/INFORME-FINAL.md).
