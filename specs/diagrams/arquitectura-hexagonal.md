# Arquitectura Hexagonal objetivo

- **Entregable**: 2 — Diagramas de arquitectura MVC con visión a Hexagonal.
- **Decisión**: [ADR-0001](../adr/0001-mvc-con-vision-hexagonal.md), [ADR-0002](../adr/0002-envio-via-ose-o-sunat.md).
- **Relacionado con**: [arquitectura-mvc.md](./arquitectura-mvc.md), [evolucion-microservicios.md](./evolucion-microservicios.md).

## 1. Diagrama

El dominio queda al centro. Los puertos de entrada son los casos de uso; los puertos de salida son las interfaces que el dominio necesita. Los adaptadores están en el borde y dependen de los puertos.

```mermaid
flowchart LR
    subgraph IN["Adaptadores de entrada"]
        REST["REST controllers NestJS<br/>(api.yaml)"]
        JOB["Job de reenvío<br/>(programado)"]
        IMP["Importador de archivo legado"]
    end

    subgraph HEX["Aplicación"]
        subgraph PIN["Puertos de entrada (casos de uso)"]
            UC1["EmitirFactura<br/>UC-01"]
            UC6["ReenviarComprobante<br/>UC-05 / UC-06"]
            UC7["ConsultarComprobantes<br/>UC-07 / UC-12"]
            UC13["DescargarArchivo<br/>UC-13"]
            UC9["GestionarClientes · GestionarProductos<br/>GestionarSeries<br/>UC-09 / UC-10 / UC-11"]
            UC16["MigrarLegado<br/>UC-16"]
        end

        subgraph DOM["Dominio"]
            AGG["Comprobante<br/>LineaComprobante · TributoLinea<br/>EnvioComprobante · ArchivoComprobante"]
            OTH["Emisor · Cliente · Producto · Serie<br/>MovimientoAlmacen · RegistroLegado"]
            VO["Ruc · Dni · Moneda · Dinero<br/>SerieCorrelativo · CodigoAfectacionIgv<br/>SistemaCalculoIsc"]
            CALC["CalculadoraTributos<br/>(IGV · ISC · ICBPER)"]
        end

        subgraph POUT["Puertos de salida"]
            P1["ComprobanteRepository"]
            P2["GeneradorXmlUbl"]
            P3["FirmadorXml"]
            P4["EnviadorComprobantes"]
        end
    end

    subgraph OUT["Adaptadores de salida"]
        A1["TypeORM + PostgreSQL"]
        A2["Generador XML UBL 2.1"]
        A3["Firma XMLDSig / XAdES"]
        A4["SunatDirectoAdapter"]
        A5["NubefactAdapter<br/>(API REST + token)"]
    end

    DB[("PostgreSQL")]
    SUNAT["SUNAT"]
    NUBE["Nubefact OSE/PSE"]

    REST --> UC1 & UC6 & UC7 & UC13 & UC9 & UC16
    JOB --> UC6
    IMP --> UC16

    UC1 & UC6 & UC7 & UC13 & UC9 & UC16 --> DOM
    DOM --> POUT

    A1 -. implementa .-> P1
    A2 -. implementa .-> P2
    A3 -. implementa .-> P3
    A4 -. implementa .-> P4
    A5 -. implementa .-> P4

    A1 --> DB
    A4 --> SUNAT
    A5 --> NUBE
```

Los repositorios del resto de agregados (`ClienteRepository`, `ProductoRepository`, `SerieRepository`, `MovimientoAlmacenRepository`, `RegistroLegadoRepository`) siguen el mismo patrón. Su definición está **Pendiente de definir** (modelo-dominio.md §5.2).

## 2. Puertos de entrada ↔ operaciones API

| Puerto de entrada | operationId (`api.yaml`) | UC |
|-------------------|--------------------------|----|
| `EmitirFactura` | `createInvoice` | UC-01 |
| `ReenviarComprobante` | `resendComprobante` (y job de reenvío) | UC-05, UC-06 |
| `ConsultarComprobantes` | `listComprobantes`, `getComprobante` | UC-07, UC-12 |
| `DescargarArchivo` | `downloadComprobanteFile` | UC-13, UC-15 |
| `GestionarClientes` | `createCustomer`, `listCustomers` | UC-09 |
| `GestionarProductos` | `createProduct`, `listProducts` | UC-10 |
| `GestionarSeries` | `createSeries`, `listSeries` | UC-11 |
| `MigrarLegado` | `startMigration`, `getMigration` | UC-16 |

## 3. Componente MVC hoy → componente hexagonal mañana

| Componente MVC hoy | Ubicación hoy (ADR-0001) | Componente hexagonal mañana | Cambio necesario |
|--------------------|--------------------------|-----------------------------|------------------|
| Vista React (Tauri) | `frontend/` | Cliente externo del adaptador REST | Ninguno |
| Controller NestJS | `modules/*/presentation/` | Adaptador de entrada REST | Ninguno; solo se reclasifica |
| Service de aplicación (`EmitirFacturaService`, …) | `modules/*/application/` | Puerto de entrada (caso de uso) + su implementación | Extraer una interfaz por caso de uso |
| Entidades de dominio, objetos de valor | `modules/*/domain/` | Núcleo del hexágono | Ninguno |
| `CalculadoraTributos` | `modules/comprobantes/domain/services/` | Servicio de dominio | Ninguno |
| Interfaces `ComprobanteRepository`, `GeneradorXmlUbl`, `FirmadorXml`, `EnviadorComprobantes` | `modules/*/domain/ports/` | Puertos de salida | Ninguno |
| Entidades TypeORM + repositorio | `modules/*/infrastructure/persistence/` | Adaptador de salida de persistencia | Ninguno |
| `SunatDirectoAdapter`, `NubefactAdapter` | `modules/comprobantes/infrastructure/envio/` | Adaptadores de salida de envío | Ninguno |
| Job de reenvío | `modules/comprobantes/infrastructure/envio/` | Adaptador de entrada (planificador) | Llamar al puerto `ReenviarComprobante` |
| Módulos NestJS (`ComprobantesModule`, …) | `modules/*` | Configuración de composición (cableado de puertos y adaptadores) | Ninguno |
