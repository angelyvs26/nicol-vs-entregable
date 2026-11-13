# Mapeo del sistema legado de almacén

- **ID**: `DOM-002`
- **Status**: `Draft`
- **Owner / Author**: `Campos Flores Elida Andrea`
- **Created**: `2026-10-22`
- **Last Updated**: `2026-10-22`
- **Relacionado con**: UC-16 (Migrar datos del legado), UC-17 (Registrar movimientos de almacén), `specs/domain/modelo-dominio.md` (entidades `RegistroLegado`, `MovimientoAlmacen`, `Producto`).

---

## 1. Alcance

El sistema básico de almacén registra fichas con los campos `fecha`, `ingreso`, `salida`, `producto` y `nro_documento` (caso de estudio, sección 2). Este documento define cómo cada fila se traslada al nuevo modelo sin perder trazabilidad.

Principios:

1. **Copia fiel primero.** Cada fila leída se guarda como `RegistroLegado` con su `idOrigen` y sus `datosOriginales` sin transformar, antes de cualquier validación.
2. **Nada se descarta.** Una fila que no puede mapearse queda en estado `PENDIENTE_REVISION` con sus motivos; nunca se elimina ni se omite en silencio (UC-16, flujo alternativo).
3. **El legado no genera comprobantes electrónicos.** El `nro_documento` es un número interno informal, no emitido ante SUNAT; no se mapea a `Comprobante` ni a `cbc:ID` (Cat. 01). Solo genera `MovimientoAlmacen`.
4. **Trazabilidad bidireccional.** Desde un `MovimientoAlmacen` migrado se llega a su `RegistroLegado` (`registroLegadoId`) y desde el `RegistroLegado` a sus movimientos.

Aspectos del legado aún no conocidos: formato de fecha, tipo de dato de las cantidades, si `producto` es código o nombre, existencia de un id de fila y codificación del archivo: **Pendiente de verificar** con una muestra real de datos.

## 2. Tabla de mapeo

| Campo legado | Entidad destino | Campo destino | Transformación | Regla de trazabilidad |
|--------------|-----------------|---------------|----------------|-----------------------|
| *(id de fila)* | `RegistroLegado` | `idOrigen` | Id del legado tal cual; si no existe, `nombreArchivo#numeroFila`. | Clave para ubicar la fila original. Junto con `loteMigracion` identifica cada importación. |
| *(fila completa)* | `RegistroLegado` | `datosOriginales`, `hashContenido` | Se guardan los 5 campos como texto, sin limpiar ni convertir. `hashContenido = SHA-256(datosOriginales)`. | Inmutable. Las correcciones van a `datosCorregidos`; el original nunca se sobrescribe. |
| `fecha` | `MovimientoAlmacen` | `fecha` | Texto → `Date` ISO 8601 (`YYYY-MM-DD`). Formato de origen: **Pendiente de verificar**. Se rechaza fecha inexistente (p. ej. 31/02) o futura respecto de la importación. | Si no se puede convertir: `PENDIENTE_REVISION` con `FECHA_INVALIDA`; no se crea movimiento. El texto original queda en `datosOriginales.fecha`. |
| `ingreso` | `MovimientoAlmacen` | `tipo = INGRESO`, `cantidad` | Texto → `Decimal`. Vacío o `0` = sin ingreso. Si `> 0`, crea un movimiento `INGRESO`. Negativo o no numérico = inválido. | Movimiento con `origen = MIGRACION` y `registroLegadoId`. Valor inválido: `PENDIENTE_REVISION` con `CANTIDAD_INVALIDA`. |
| `salida` | `MovimientoAlmacen` | `tipo = SALIDA`, `cantidad` | Igual que `ingreso`. Si la fila tiene `ingreso > 0` y `salida > 0`, se crean **dos** movimientos ligados al mismo `RegistroLegado`. | Igual que `ingreso`. Si `ingreso` y `salida` son ambos vacíos o `0`: `PENDIENTE_REVISION` con `SIN_MOVIMIENTO`. |
| `producto` | `MovimientoAlmacen` | `productoId` | Normalizar (recortar espacios, mayúsculas) y buscar en `Producto.codigoInterno`. Búsqueda por descripción si el legado guarda nombres: **Pendiente de verificar**. No se crean productos automáticamente. | Sin coincidencia única: `PENDIENTE_REVISION` con `PRODUCTO_INEXISTENTE`. El texto original queda en `datosOriginales.producto`. |
| `nro_documento` | `MovimientoAlmacen` | `documentoReferencia` | Copia literal (solo se recortan espacios en los extremos). No se convierte a serie-correlativo SUNAT. | Si otra fila (del mismo lote o de un lote anterior) tiene el mismo `nro_documento` y el mismo `producto`: `PENDIENTE_REVISION` con `DOCUMENTO_DUPLICADO`. Criterio de duplicado a confirmar con el negocio: **Pendiente de verificar**. |

## 3. Estados y casos de error

| Estado de `RegistroLegado` | Significado |
|----------------------------|-------------|
| `MIGRADO` | Todos los campos se transformaron; se crearon sus movimientos. |
| `PENDIENTE_REVISION` | Al menos un motivo de revisión. No se crea ningún movimiento hasta resolverlo. |

| Caso de error | Motivo | Comportamiento | Resolución |
|---------------|--------|----------------|------------|
| Producto inexistente | `PRODUCTO_INEXISTENTE` | La fila queda `PENDIENTE_REVISION`; no se crea movimiento ni producto. | El administrador crea el producto o asigna uno existente en `datosCorregidos`; se reprocesa. |
| Documento duplicado | `DOCUMENTO_DUPLICADO` | La fila queda `PENDIENTE_REVISION`; se registra el id del registro con el que coincide. | El administrador confirma que es un movimiento distinto (se migra) o lo marca como duplicado confirmado (se conserva sin movimiento). |
| Fecha inválida | `FECHA_INVALIDA` | La fila queda `PENDIENTE_REVISION`. | El administrador corrige la fecha en `datosCorregidos`; se reprocesa. |
| Cantidad inválida | `CANTIDAD_INVALIDA` | La fila queda `PENDIENTE_REVISION`. | Corrección manual y reproceso. |
| Sin movimiento | `SIN_MOVIMIENTO` | La fila queda `PENDIENTE_REVISION`. | Corrección manual o confirmación de que no representa movimiento. |

Reglas comunes:

- Una fila puede acumular varios motivos; se registran todos.
- Ningún error detiene el lote: el resto de filas se sigue procesando.
- Al final del lote se informa: filas leídas, `MIGRADO`, `PENDIENTE_REVISION` por motivo (UC-16, paso 3). Se cumple `leídas = MIGRADO + PENDIENTE_REVISION`.
- Toda revisión registra `revisadoPor`, `revisadoEn` y `datosCorregidos`; `datosOriginales` no cambia.
- Un "duplicado confirmado" sigue existiendo como `RegistroLegado` para auditoría. Estado final específico para este caso: **Pendiente de definir**.

## 4. Escenarios de aceptación

```gherkin
Feature: Migrar datos del sistema legado de almacén

  Background:
    Given existe el producto con código interno "ARROZ01"
    And se inicia el lote de migración "LOTE-001"

  Scenario: Migrar una fila válida de ingreso
    Given la fila legado "almacen.csv#2" con fecha "2024-03-15", ingreso "50", salida "0", producto "ARROZ01" y nro_documento "NI-0045"
    When se ejecuta la migración del lote
    Then se crea un RegistroLegado con idOrigen "almacen.csv#2", estado "MIGRADO" y los datos originales sin modificar
    And se crea un MovimientoAlmacen de tipo "INGRESO", cantidad 50, fecha 2024-03-15 y documentoReferencia "NI-0045"
    And el movimiento tiene origen "MIGRACION" y referencia al RegistroLegado

  Scenario: Una fila con ingreso y salida genera dos movimientos trazables
    Given la fila legado "almacen.csv#3" con fecha "2024-03-16", ingreso "10", salida "4", producto "ARROZ01" y nro_documento "NI-0046"
    When se ejecuta la migración del lote
    Then se crean dos MovimientoAlmacen, uno "INGRESO" de 10 y otro "SALIDA" de 4
    And ambos movimientos referencian el mismo RegistroLegado con idOrigen "almacen.csv#3"

  Scenario: Producto inexistente queda pendiente de revisión
    Given la fila legado "almacen.csv#4" con producto "AZUCAR99", que no existe en el catálogo de productos
    When se ejecuta la migración del lote
    Then el RegistroLegado queda en estado "PENDIENTE_REVISION" con motivo "PRODUCTO_INEXISTENTE"
    And no se crea ningún MovimientoAlmacen para esa fila
    And no se crea ningún Producto automáticamente
    And la fila no se descarta y aparece en el reporte del lote

  Scenario: Documento duplicado queda pendiente de revisión
    Given la fila "almacen.csv#2" ya fue migrada con nro_documento "NI-0045" y producto "ARROZ01"
    And la fila legado "almacen.csv#9" tiene nro_documento "NI-0045" y producto "ARROZ01"
    When se ejecuta la migración del lote
    Then el RegistroLegado de "almacen.csv#9" queda en estado "PENDIENTE_REVISION" con motivo "DOCUMENTO_DUPLICADO"
    And el registro indica que coincide con el RegistroLegado de "almacen.csv#2"
    And no se crea un MovimientoAlmacen adicional

  Scenario: Fecha inválida queda pendiente de revisión
    Given la fila legado "almacen.csv#5" con fecha "31/02/2024"
    When se ejecuta la migración del lote
    Then el RegistroLegado queda en estado "PENDIENTE_REVISION" con motivo "FECHA_INVALIDA"
    And datosOriginales.fecha conserva el texto "31/02/2024"

  Scenario: Un error no detiene el lote y el conteo cuadra
    Given un lote de 10 filas, de las cuales 2 tienen producto inexistente y 1 tiene fecha inválida
    When se ejecuta la migración del lote
    Then el reporte indica 10 filas leídas, 7 "MIGRADO" y 3 "PENDIENTE_REVISION"
    And el total de RegistroLegado del lote es 10

  Scenario: Corregir una fila pendiente conserva los datos originales
    Given el RegistroLegado de "almacen.csv#4" está en "PENDIENTE_REVISION" con motivo "PRODUCTO_INEXISTENTE"
    And el administrador asigna el producto "ARROZ01" como corrección
    When se reprocesa el registro
    Then el RegistroLegado pasa a "MIGRADO" y registra revisadoPor, revisadoEn y datosCorregidos
    And datosOriginales.producto sigue siendo "AZUCAR99"
    And el MovimientoAlmacen creado referencia ese RegistroLegado
```

Los valores de los escenarios (códigos de producto, documentos, nombre de archivo) son datos de ejemplo. El formato `YYYY-MM-DD` de la fecha de origen se usa solo como ejemplo; el formato real del legado: **Pendiente de verificar**.
