# Diagrama de despliegue

- **Entregable**: 2 — Diagramas de arquitectura MVC con visión a Hexagonal.
- **Decisión**: [ADR-0003](../adr/0003-empaquetado-msi-apk.md) (Tauri 2, servidor central), [ADR-0002](../adr/0002-envio-via-ose-o-sunat.md) (canal de envío).

## 1. Diagrama

```mermaid
flowchart LR
    subgraph WIN["PC Windows"]
        MSI["App de escritorio<br/>(instalador MSI, Tauri 2)<br/>React + WebView2"]
    end

    subgraph AND["Dispositivo Android"]
        APK["App móvil<br/>(APK, Tauri 2)<br/>React + Android System WebView"]
    end

    subgraph SRV["Servidor central (hosting Pendiente de definir)"]
        API["Backend NestJS<br/>API REST /api/v1 (api.yaml)"]
        JOB["Job de reenvío<br/>(UC-06)"]
        SEC["Almacén de secretos<br/>certificado digital · token OSE"]
        FS["Almacenamiento de archivos<br/>XML · PDF · CDR"]
    end

    DB[("PostgreSQL")]

    subgraph EXT["Servicios externos"]
        SUNAT["SUNAT<br/>(SUNAT_DIRECTO)"]
        NUBE["Nubefact OSE/PSE<br/>(OSE_PSE, API REST + token)"]
    end

    MSI -- "HTTPS + JSON<br/>bearerAuth" --> API
    APK -- "HTTPS + JSON<br/>bearerAuth" --> API
    API --> DB
    JOB --> DB
    API --> FS
    API -. lee .-> SEC
    JOB -. lee .-> SEC
    API -- "HTTPS (protocolo Pendiente de verificar)" --> SUNAT
    API -- "HTTPS POST + token" --> NUBE
    JOB --> SUNAT
    JOB --> NUBE
```

## 2. Nodos

| Nodo | Contenido | Notas |
|------|-----------|-------|
| PC Windows | App Tauri instalada con MSI | Requiere WebView2; versión mínima de Windows: **Pendiente de verificar**. No guarda certificados ni tokens. |
| Dispositivo Android | App Tauri instalada con APK | Versión mínima de Android: **Pendiente de verificar**. No guarda certificados ni tokens. |
| Backend NestJS | API REST, servicios de aplicación, dominio, adaptadores | Único punto que asigna correlativos (INV-04) y que firma o delega el envío. |
| Job de reenvío | Proceso programado del backend | Reintenta los comprobantes `PENDIENTE_ENVIO` / `ENVIADO` (ADR-0002). |
| Almacén de secretos | Certificado digital, token Nubefact, credenciales SUNAT | Producto concreto: **Pendiente de definir**. |
| Almacenamiento de archivos | XML firmado, PDF, CDR (`ArchivoComprobante.ubicacion`) | Plazo de conservación: **Pendiente de verificar** (UC-14). |
| PostgreSQL | Datos de todos los agregados | Copias de seguridad y réplica: **Pendiente de definir**. |
| SUNAT / Nubefact | Destinos de envío | Se elige uno por configuración (`ENVIO_CANAL`). |

## 3. Conectividad

- Cliente sin conexión al servidor: no puede emitir; solo consulta datos cargados y prepara borradores (ADR-0003).
- Servidor sin respuesta de SUNAT/OSE: el comprobante queda en `PENDIENTE_ENVIO` y el job lo reintenta (FR-10, UC-06).
