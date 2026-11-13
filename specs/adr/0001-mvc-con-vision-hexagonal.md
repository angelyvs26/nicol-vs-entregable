# ADR-0001: Monolito MVC con puertos, preparado para Arquitectura Hexagonal

- **Status**: `Accepted`
- **Date**: `2026-10-22`
- **Deciders**: `Campos Flores Elida Andrea`
- **Consulted**: `—`
- **Informed**: `Gerencia de ABC Software Corp`

---

## Context and Problem Statement

El caso de estudio exige construir el sistema inicialmente como un **monolito limpio con patrón MVC** y, a la vez, desacoplarlo para migrar a **Arquitectura Hexagonal / Clean Architecture** y luego a **microservicios** cuando la empresa crezca. El stack es NestJS + TypeORM + PostgreSQL (backend) y React + Vite (frontend).

El dominio tiene reglas tributarias que cambian (catálogos SUNAT, tasas, ICBPER) y dependencias externas volátiles (SUNAT, OSE/PSE, certificados). Si las reglas quedan mezcladas con controladores o con entidades TypeORM, la migración futura obligaría a reescribirlas.

¿Cómo estructurar el monolito para cumplir MVC hoy sin bloquear la evolución?

## Decision Drivers

- Cumplir la restricción del enunciado: MVC ahora, hexagonal después, visible en los specs.
- Proteger las reglas tributarias (`CalculadoraTributos`, invariantes INV-01 a INV-16) de cambios de infraestructura.
- Poder cambiar de canal de envío (SUNAT directo / OSE) sin tocar el dominio (ver ADR-0002).
- Pruebas unitarias del dominio sin base de datos ni red.
- Curva de aprendizaje y tiempo de entrega razonables para un equipo pequeño.

## Considered Options

1. **MVC clásico acoplado**: controladores NestJS, servicios con lógica y entidades TypeORM como modelo único (decoradores ORM en las clases de negocio).
2. **MVC con puertos**: MVC por fuera (Controller → Service → Model), pero el "Model" se divide en dominio puro + puertos, y la infraestructura implementa los puertos como adaptadores.
3. **Hexagonal completa desde el inicio**: puertos de entrada y salida explícitos para todo, módulos aislados, sin la capa MVC como organización principal.

## Decision Outcome

Opción elegida: **2. MVC con puertos**, porque cumple literalmente la restricción MVC del enunciado, aísla el dominio igual que la hexagonal y deja la migración como un cambio de organización, no de lógica.

Flujo de dependencias:

```text
Controller (presentation) → Service de aplicación (application) → Dominio (domain) → Puertos (domain/ports) ← Adaptadores (infrastructure)
```

Reglas:

- El **dominio** (`Comprobante`, `LineaComprobante`, `TributoLinea`, objetos de valor, `CalculadoraTributos`) no importa NestJS, TypeORM ni clientes HTTP.
- Los **puertos** son interfaces del dominio: `ComprobanteRepository`, `GeneradorXmlUbl`, `FirmadorXml`, `EnviadorComprobantes` (modelo-dominio.md §5.2).
- Los **adaptadores** viven en `infrastructure/` y se inyectan con tokens de inyección de NestJS (`{ provide: ENVIADOR_COMPROBANTES, useClass: NubefactEnviadorAdapter }`).
- Las **entidades TypeORM** son modelos de persistencia separados de las entidades de dominio; un *mapper* traduce entre ambos.
- Los **controladores** solo validan el DTO (`specs/contracts/schemas/`), llaman al servicio de aplicación y traducen errores a HTTP (400/409/422, `api.yaml`).

### Cómo cada pieza habilita la migración

| Pieza | Hoy (MVC con puertos) | Mañana (hexagonal / microservicios) |
|-------|------------------------|--------------------------------------|
| Agregados con referencias por id (`Comprobante` → `emisorId`, `clienteId`; `MovimientoAlmacen` → `productoId`, `registroLegadoId`) | Cada agregado se guarda y carga por separado; no hay relaciones de objeto entre agregados. | Cada agregado (o grupo) puede moverse a otro servicio con su propia base de datos; la referencia por id se convierte en una llamada o evento sin cambiar el dominio. |
| Copia de datos del cliente en `Comprobante.datosCliente` | Evita *joins* para leer un comprobante emitido. | El servicio de Comprobantes no depende en línea del servicio de Clientes. |
| `ComprobanteRepository` | Adaptador TypeORM + PostgreSQL. | Otro adaptador (otra base, otro servicio) sin tocar el dominio. |
| `GeneradorXmlUbl`, `FirmadorXml` | Adaptadores locales. | Pueden extraerse a un servicio de documentos o firma. |
| `EnviadorComprobantes` | Adaptadores SUNAT directo y Nubefact (ADR-0002). | Base del servicio de Envíos; el puerto se implementa con un cliente de eventos. |
| Servicios de aplicación (`EmitirFacturaService`, …) | Llamados por controladores MVC. | Pasan a ser los **puertos de entrada** (casos de uso) de la hexagonal; el controlador queda como adaptador REST. |

### Estructura de carpetas prevista (`backend/src`)

No se crea en esta fase; es la estructura objetivo para la fase de código.

```text
backend/src/
├── main.ts
├── app.module.ts
├── shared/
│   ├── domain/              # Dinero, Moneda, Ruc, Dni, errores de dominio
│   └── infrastructure/      # configuración, secretos, base de datos
└── modules/
    ├── comprobantes/
    │   ├── domain/
    │   │   ├── entities/        # Comprobante, LineaComprobante, TributoLinea, EnvioComprobante, ArchivoComprobante
    │   │   ├── value-objects/   # SerieCorrelativo, CodigoAfectacionIgv, SistemaCalculoIsc
    │   │   ├── services/        # CalculadoraTributos
    │   │   └── ports/           # ComprobanteRepository, GeneradorXmlUbl, FirmadorXml, EnviadorComprobantes
    │   ├── application/         # EmitirFacturaService, ReenviarComprobanteService, ConsultarComprobantesService
    │   ├── infrastructure/
    │   │   ├── persistence/     # entidades TypeORM, mappers, ComprobanteTypeormRepository
    │   │   ├── xml/             # GeneradorXmlUbl (UBL 2.1)
    │   │   ├── firma/           # FirmadorXml
    │   │   └── envio/           # SunatDirectoAdapter, NubefactAdapter, cola de reenvío
    │   └── presentation/        # ComprobantesController, FacturasController
    ├── clientes/                # domain/ application/ infrastructure/ presentation/
    ├── productos/               # domain/ application/ infrastructure/ presentation/
    ├── series/                  # domain/ application/ infrastructure/ presentation/
    ├── almacen/                 # MovimientoAlmacen
    └── migracion/               # RegistroLegado, importador del legado
```

Correspondencia con MVC: **View** = frontend React; **Controller** = `presentation/`; **Model** = `domain/` + `infrastructure/persistence/`; `application/` es la capa de servicios entre Controller y Model.

### Positive Consequences

- El dominio y sus invariantes se prueban sin base de datos ni red.
- Cambiar de canal de envío o de base de datos solo afecta a un adaptador.
- La migración a hexagonal consiste en renombrar y reagrupar, no en reescribir.

### Negative Consequences / Trade-offs

- Duplicación entre entidades de dominio y entidades TypeORM (*mappers*). Mitigación: mappers por agregado, cubiertos por pruebas de integración.
- Más archivos y carpetas que un MVC clásico. Mitigación: plantilla de módulo común y esta estructura documentada.
- Las relaciones por id impiden `JOIN` automáticos del ORM entre agregados. Mitigación: consultas de lectura específicas (UC-12) en `infrastructure/`.

## Pros and Cons of Considered Options

### Option 1: MVC clásico acoplado
- Good, because es lo más rápido de arrancar y es el estilo por defecto de NestJS + TypeORM.
- Bad, because las reglas tributarias quedarían atadas a decoradores ORM y a servicios con HTTP; migrar a hexagonal implicaría reescribirlas.
- Bad, because no permite probar `CalculadoraTributos` sin base de datos.

### Option 2: MVC con puertos (elegida)
- Good, because cumple MVC y aísla el dominio.
- Good, because los puertos ya definidos en modelo-dominio.md son los mismos que usará la hexagonal.
- Bad, because exige disciplina (el dominio no puede importar infraestructura) y mappers.

### Option 3: Hexagonal completa desde el inicio
- Good, because es la arquitectura objetivo.
- Bad, because no cumple la restricción explícita de iniciar con MVC.
- Bad, because añade complejidad (puertos de entrada para todo) antes de que el negocio la necesite.

## Implementation & Follow-up Actions

- [ ] Crear la estructura de carpetas al iniciar la fase de código (no en esta fase).
- [ ] Agregar una regla de lint que impida importar `@nestjs/*` o `typeorm` desde `*/domain/**`. Herramienta concreta: **Pendiente de definir**.
- [ ] Definir los repositorios restantes (`ClienteRepository`, `ProductoRepository`, `SerieRepository`, `MovimientoAlmacenRepository`, `RegistroLegadoRepository`): **Pendiente de definir**.
- [x] Diagramas: `specs/diagrams/arquitectura-mvc.md`, `arquitectura-hexagonal.md`, `evolucion-microservicios.md` y `despliegue.md`.
