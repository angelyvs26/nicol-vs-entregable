# ADR-0003: Empaquetado multiplataforma — instalador MSI (Windows) y APK (Android)

- **Status**: `Accepted`
- **Date**: `2026-10-22`
- **Deciders**: `Campos Flores Elida Andrea`
- **Consulted**: `—`
- **Informed**: `Gerencia de ABC Software Corp`

---

## Context and Problem Statement

El enunciado exige que la aplicación corra de forma nativa en **Windows** y **Android** y que se distribuya obligatoriamente como **instalador MSI** (escritorio) o **APK** (Android). El frontend es React + Vite; el backend es NestJS + PostgreSQL.

Hay que decidir (a) con qué herramienta se empaqueta el frontend y (b) dónde corre el backend, porque eso define dónde viven el certificado digital y el token OSE, y qué pasa sin conexión.

## Decision Drivers

- Requisito obligatorio de formatos: MSI y APK.
- Reutilizar un único frontend React para ambas plataformas.
- Seguridad del certificado digital y de los tokens OSE (NFR de seguridad; ADR-0002).
- Correlativos únicos por serie (INV-04): la numeración no puede asignarse en varios dispositivos a la vez sin coordinación.
- Tamaño del instalador y facilidad de actualización.

## Considered Options

1. **Tauri 2**: envuelve el frontend React en el WebView del sistema; genera instalador MSI en Windows y APK en Android desde el mismo proyecto.
2. **Electron (Windows) + Capacitor (Android)**: dos envoltorios distintos del mismo frontend React.
3. **PWA**: aplicación web instalable desde el navegador.

## Decision Outcome

Opción elegida: **1. Tauri 2**, con **backend NestJS en servidor central**, porque una sola herramienta cubre MSI y APK con el mismo frontend, y el servidor central mantiene los secretos fuera de los dispositivos y la numeración en un solo lugar.

### Dónde corre el backend

| Alternativa | Certificado digital y token OSE | Correlativos (INV-04) | Sin conexión | Decisión |
|-------------|---------------------------------|-----------------------|--------------|----------|
| **Servidor central** (NestJS + PostgreSQL en un servidor; MSI/APK son clientes) | Solo en el servidor (almacén de secretos). Nunca se distribuyen en MSI ni APK. | Un único punto asigna correlativos. | El cliente no puede emitir sin conexión al servidor. | ✅ Elegida |
| **Backend local** (NestJS embebido en cada PC) | Copia del certificado en cada equipo: mayor riesgo de fuga. | Requiere coordinación entre equipos (series por equipo o sincronización). | Puede emitir localmente y enviar después. | ❌ Además, Android no ejecuta NestJS de forma práctica. |

### Modo sin conexión

- Sin conexión **con el servidor**: la app solo permite consultar datos ya cargados y preparar borradores locales; la emisión (asignar correlativo, pasar a `PENDIENTE_ENVIO`) requiere conexión. Alcance del almacenamiento local de borradores: **Pendiente de definir**.
- Sin respuesta **de SUNAT/OSE**: no afecta al cliente; el servidor deja el comprobante en `PENDIENTE_ENVIO` y la cola lo reintenta (ADR-0002, UC-06).

### Positive Consequences

- Un frontend, un proyecto de empaquetado, dos instaladores.
- Instaladores pequeños, porque Tauri usa el WebView del sistema en lugar de incluir un navegador.
- El certificado y los tokens nunca salen del servidor.

### Negative Consequences / Trade-offs

- Tauri requiere toolchain de Rust y, para Android, SDK/NDK de Android. Mitigación: compilación en CI con imágenes preparadas.
- La compatibilidad depende del WebView del sistema (WebView2 en Windows, Android System WebView). Mitigación: definir versiones mínimas soportadas (**Pendiente de verificar**).
- Sin servidor no se puede emitir. Mitigación: alta disponibilidad del servidor; política de borradores locales.

## Pros and Cons of Considered Options

### Option 1: Tauri 2 (elegida)
- Good, because genera MSI (Windows) y APK (Android) desde un mismo proyecto. Soporte de Android estable y generación de MSI con WiX en la versión 2: **Pendiente de verificar** contra la documentación de la versión que se use.
- Good, because el instalador es liviano.
- Bad, because el ecosistema de plugins móviles es más reducido que el de Capacitor (**Pendiente de verificar**).

### Option 2: Electron + Capacitor
- Good, because son herramientas maduras; Electron puede generar MSI con su empaquetador y Capacitor genera proyectos Android para producir el APK (**Pendiente de verificar** según versiones).
- Bad, because son dos toolchains y dos configuraciones que mantener.
- Bad, because Electron incluye Chromium: instaladores más pesados.

### Option 3: PWA
- Good, because no requiere empaquetado y se actualiza al instante.
- Bad, because **no produce MSI ni APK** por sí misma; incumple el requisito obligatorio. Envolverla en un APK (TWA) o en MSIX no da un MSI (**Pendiente de verificar**).

## Implementation & Follow-up Actions

- [ ] Fijar versiones de Tauri, Rust, WiX y Android SDK/NDK: **Pendiente de verificar**.
- [ ] Definir las versiones mínimas de Windows y Android soportadas.
- [ ] Firma de código del MSI y firma del APK (certificados de distribución, distintos del certificado de facturación): **Pendiente de definir**.
- [ ] Definir el hosting del servidor central (on-premise o nube): **Pendiente de definir**.
- [x] Diagrama de despliegue: `specs/diagrams/despliegue.md`.
