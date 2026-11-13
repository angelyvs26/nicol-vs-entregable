# 01. Análisis del caso

- **Estado:** Draft — Fase 1 (Spec-First). Las especificaciones son documentales; como primera implementación existe el generador del XML `Invoice` UBL 2.1 (`backend/src/ubl-invoice-xml-generator.ts`), válido contra `UBL-Invoice-2.1.xsd`.
- **Alcance:** análisis inicial del sistema de ABC Software Corp y de los riesgos para especificar facturación electrónica y control de inventario.
- **Criterio:** este documento distingue lo descrito por el caso, las decisiones provisionales del proyecto y las obligaciones que requieren contraste normativo.

## Fuentes y niveles de confianza

| ID | Fuente | Uso en este documento |
|---|---|---|
| [F1] | [Caso de estudio](../caso-de-estudio.md) | Contexto, capacidades descritas del sistema legado y objetivos del trabajo. |
| [F2] | [Mapeo del sistema legado](../domain/mapeo-legado.md) | Campos históricos y límites conocidos del legado. |
| [F3] | [Catálogos SUNAT de referencia](../domain/catalogos-sunat.md) | Términos tributarios y catálogos aportados al proyecto; el mismo documento advierte que requieren contraste oficial. |
| [F4] | [Modelo de dominio](../domain/modelo-dominio.md) | Modelo de datos y decisiones provisionales que ya constan en las especificaciones. |
| [F5] | [Matriz de trazabilidad SUNAT ↔ UBL](../traceability/matriz-sunat-ubl.md) | Relaciones propuestas entre datos de negocio, catálogos y elementos UBL. |
| [F6] | [RS 097-2012/SUNAT — texto publicado por SUNAT](https://www.sunat.gob.pe/legislacion/superin/2012/097-2012.pdf) | Referencia primaria para el SEE desarrollado desde los sistemas del contribuyente. |
| [F7] | [RS 234-2006/SUNAT — texto publicado por SUNAT](https://www.sunat.gob.pe/legislacion/superin/2006/234.htm) | Referencia primaria para libros y registros vinculados a asuntos tributarios. |
| [F8] | [OASIS UBL 2.1](https://docs.oasis-open.org/ubl/os-UBL-2.1/UBL-2.1.html) y XSD local en [`specs/reference/ubl-2.1/`](../reference/ubl-2.1/README.md) | Vocabulario y estructura XML de UBL. |

**Niveles:** **Alta** = se observa directamente en la fuente primaria indicada o en el enunciado explícito del caso; **Media** = interpretación o requisito derivado de una fuente identificada; **Baja** = hipótesis de trabajo sin evidencia suficiente. La confianza expresa solidez de la afirmación con las fuentes consultadas, no su obligatoriedad legal.

## Brechas del sistema actual

El diagnóstico siguiente refleja el estado descrito en el caso y las especificaciones disponibles; no es una auditoría del software en ejecución.

| Brecha | Evidencia y fuente | Consecuencia para el sistema objetivo | Confianza |
|---|---|---|---|
| El legado registra movimientos de almacén con campos básicos (`fecha`, `ingreso`, `salida`, `producto`, `nro_documento`); la forma y semántica real de los datos todavía no se conocen. | [F1], [F2] | Se requiere preservar cada fila original, mapearla con trazabilidad y separar el documento interno del comprobante tributario. La validación definitiva depende de una muestra real. | Alta |
| El caso reporta ausencia de validación de RUC. | [F1] | La especificación debe distinguir validación de formato de consulta/validación ante servicios oficiales; algoritmo y fuentes de consulta están **Pendiente de verificar**. | Alta para el diagnóstico del caso; Baja para reglas específicas aún no verificadas. |
| El caso reporta cálculos de impuestos incompletos o incorrectos, incluidos IGV, ISC e ICBPER. | [F1]; reglas preliminares en [F3] y [F4] | Hace falta definir base, redondeo, afectación por línea, reglas para más de un tributo y configuración temporal de tasas. Las tasas y fórmulas legales vigentes están **Pendiente de verificar**. | Alta para el diagnóstico; Media para el alcance derivado. |
| El caso indica que el sistema no genera XML firmado ni se comunica con SUNAT u OSE. | [F1] | Faltan especificaciones para producir el comprobante estructurado, firmarlo, enviarlo, registrar su estado y conservar la respuesta recibida. El protocolo y obligaciones actuales deben contrastarse antes de implementarlos. | Alta para el diagnóstico del caso; Media para el diseño derivado. |
| No está documentada la relación entre factura, registro de ventas y movimientos físicos de inventario. | [F1], [F2], [F7] | El modelo debe permitir trazabilidad entre comprobante, detalle vendido y movimientos de almacén; el alcance de libros exigible al contribuyente se debe verificar. | Media |
| La documentación interna contiene mapeos de catálogos y reglas fiscales explícitamente pendientes de contraste oficial. | [F3], [F5] | No tratar catálogos, obligatoriedad UBL ni fórmulas internas como prueba de cumplimiento normativo. | Alta |
| El enunciado requiere migrar información histórica, pero no especifica formato, identificadores, unidades ni calidad de los datos reales. | [F1], [F2] | Se necesita perfilado de una muestra, reglas de conciliación y estados de revisión; no se debe inferir que el número interno es un comprobante SUNAT. | Alta |

## Supuestos de trabajo

Estos puntos permiten continuar el diseño documental; no sustituyen decisiones de negocio ni una determinación de obligaciones tributarias.

| Supuesto provisional | Fuente / fundamento | Validación necesaria | Confianza |
|---|---|---|---|
| La primera versión documentada prioriza la emisión de facturas electrónicas y conserva el sistema legado de almacén como origen de datos a migrar. | Alcance del [caso de estudio](../caso-de-estudio.md) y [feature de emisión](../features/001-emitir-factura.md). | Confirmar alcance con la persona responsable del negocio y el contribuyente. | Media |
| Cada registro legado se conserva sin alterar y puede quedar pendiente de revisión cuando falte información o no pueda mapearse. | Política ya descrita en [mapeo-legado](../domain/mapeo-legado.md). | Probar con archivos reales y acordar resolución de duplicados y errores. | Media |
| El documento UBL `Invoice` se estudia como formato base para la factura; UBL 2.1 por sí solo no representa todas las restricciones nacionales. | [XSD local y README](../reference/ubl-2.1/README.md), [F8] y [F1]. | Contrastar perfil, guías y anexos técnicos SUNAT vigentes, además de las modificaciones normativas aplicables. | Alta para el límite del XSD; Media para su uso en este proyecto. |
| Los códigos y mapeos de los catálogos locales se consideran entradas de análisis, no una copia certificada de la normativa vigente. | Advertencia expresa de [catalogos-sunat.md](../domain/catalogos-sunat.md) y [matriz-sunat-ubl.md](../traceability/matriz-sunat-ubl.md). | Obtener y versionar la fuente oficial aplicable a cada catálogo y fecha. | Alta |
| Los movimientos físicos de almacén deberán poder alimentar el análisis del Registro de Inventario Permanente en Unidades Físicas si resulta aplicable al contribuyente. | Formato 12.1 en [F7]; el caso describe movimientos de almacén en [F1]. | Confirmar la obligación y el formato vigente para ABC Software Corp. | Media |
| Las decisiones de la primera fase siguen siendo especificaciones, no funcionalidades implementadas ni evidencia de cumplimiento. | Estado documentario indicado en [specs/README.md](../README.md). | Mantener esta distinción en revisiones futuras. | Alta |

## Riesgos

| Riesgo | Posible impacto | Tratamiento documental recomendado | Fuente | Confianza |
|---|---|---|---|---|
| Usar un catálogo, tasa o regla tributaria desactualizada o interpretada incorrectamente. | Comprobantes rechazados o cálculos/registros incorrectos. | Citar la versión y fecha de cada fuente oficial; mantener los valores configurables cuando proceda y verificar antes de codificar. | [F3], [F5], [F6], [F7] | Alta en la existencia del riesgo; no se cuantifica probabilidad. |
| Confundir validez contra el XSD UBL con aceptación legal o funcional por SUNAT/OSE. | Un XML bien formado puede incumplir validaciones nacionales o del flujo de emisión. | Separar validación XSD, reglas de negocio y validación de la plataforma receptora. | [F8], XSD de [Invoice](../reference/ubl-2.1/maindoc/UBL-Invoice-2.1.xsd), [F5] | Alta |
| Asumir que Catálogo 08 queda validado solo porque existe `cbc:TierRange` en UBL. | Representación o cálculo del ISC incompatible con el perfil SUNAT. | Verificar expresamente código, ubicación y semántica contra el anexo/guía técnica vigente; hasta entonces, marcar **Pendiente de verificar**. | [F3], [F5], XSD de [TaxCategory](../reference/ubl-2.1/common/UBL-CommonAggregateComponents-2.1.xsd) | Alta |
| Migrar datos incompletos o ambiguos como si fueran movimientos válidos. | Pérdida de trazabilidad o inventario inconsistente. | Conservar el original, reportar errores y exigir revisión antes de crear movimientos. | [F2] | Alta |
| Vincular libros tributarios e inventario a una fecha de norma o formato que haya cambiado. | Exportaciones o libros que no correspondan a la obligación vigente. | Confirmar texto consolidado, vigencia y aplicabilidad antes de cerrar las especificaciones de salida. | [F7] | Alta en la necesidad de verificación; Media en su impacto concreto para este contribuyente. |
| No definir contingencia o seguimiento de respuestas de SUNAT/OSE. | Comprobantes con estado incierto o reenvíos duplicados. | Especificar estados, correlación de solicitudes y reconciliación de CDR sin asumir plazos no confirmados. | [F1], [F5], [F6] | Media |

## Glosario

Definiciones de trabajo para este análisis; las descripciones no amplían por sí solas el alcance legal de cada figura.

| Término | Definición de trabajo | Fuente | Confianza |
|---|---|---|---|
| **SUNAT** | Superintendencia Nacional de Aduanas y de Administración Tributaria, autoridad peruana a la que se refiere el caso para emisión y obligaciones tributarias. | [Caso de estudio](../caso-de-estudio.md); publicaciones institucionales [F6] y [F7]. | Alta |
| **OSE** | Operador de Servicios Electrónicos: operador que participa en servicios de comprobantes electrónicos dentro del marco establecido por SUNAT. Sus funciones concretas y vigencia aplicable deben revisarse en la norma correspondiente. | [F1]; detalle legal de la figura **Pendiente de verificar** en fuente oficial vigente. | Media |
| **PSE** | Proveedor de Servicios Electrónicos: proveedor de servicios relacionados con la emisión electrónica. El alcance de sus funciones y responsabilidades debe verificarse en las normas vigentes; no se presupone que sea equivalente a un OSE. | Investigación interna en [investigacion-nubefact.md](../use-cases/investigacion-nubefact.md); definición jurídica exacta **Pendiente de verificar**. | Baja |
| **CDR** | Constancia de Recepción: respuesta asociada al procesamiento de un comprobante por SUNAT/OSE, cuya aceptación, rechazo u observaciones deben modelarse según la respuesta aplicable. | [F1], [README UBL local](../reference/ubl-2.1/README.md), que relaciona `ApplicationResponse` con la respuesta CDR; esquema local en [`UBL-ApplicationResponse-2.1.xsd`](../reference/ubl-2.1/maindoc/UBL-ApplicationResponse-2.1.xsd). | Media |
| **UBL** | Universal Business Language, estándar de documentos de negocio de OASIS. UBL 2.1 define esquemas XML genéricos; la adaptación SUNAT requiere reglas adicionales. | [Estándar OASIS UBL 2.1](https://docs.oasis-open.org/ubl/os-UBL-2.1/UBL-2.1.html), [F8]. | Alta |
| **RUC** | Registro Único de Contribuyentes; número de identificación tributaria citado por el caso y por las especificaciones de emisor/cliente. El modelo lo vincula provisionalmente con Catálogo 06 y `cac:PartyIdentification/cbc:ID` (`@schemeID`); la validación de dígito, estado y condición no queda definida en este glosario. | [F1], [modelo de dominio](../domain/modelo-dominio.md), [F3]; mapeo y reglas detalladas **Pendiente de verificar**. | Media |
| **IGV** | Impuesto General a las Ventas, tributo identificado en el material del proyecto y en la terminología tributaria de la RS 234-2006/SUNAT. | [F3], [F7]. | Alta |
| **ISC** | Impuesto Selectivo al Consumo, tributo identificado en el material de catálogos del proyecto. Tasas, productos y sistemas aplicables requieren contraste normativo. | [F3]. | Media |
| **ICBPER** | Impuesto al consumo de las bolsas de plástico; se incluye como tributo en el catálogo local del proyecto. Monto y reglas vigentes **Pendiente de verificar**. | [F3]. | Media |
| **IVAP** | Impuesto a la Venta de Arroz Pilado, mencionado en las especificaciones locales como tratamiento ligado a arroz pilado. Detalles de aplicación y tasa **Pendiente de verificar**. | [F3], [F7] (la RS 234 contiene referencias al Registro IVAP). | Media |

## Uso de IA y verificación de fuentes

- La IA se empleó como apoyo para organizar requisitos, comparar el contexto del caso con las especificaciones existentes y resumir la estructura de los esquemas UBL. **No es una fuente normativa** ni acredita por sí sola el cumplimiento. Fuentes base: [F1]–[F8]. **Confianza: Alta** en esta delimitación metodológica.
- Para afirmaciones normativas, la prioridad de verificación es el texto oficial publicado por SUNAT y sus anexos/guías vigentes; para estructura UBL, la especificación de OASIS y los XSD locales. Las especificaciones internas son artefactos de diseño y no sustituyen esas fuentes. Fuentes: [F6]–[F8] y [F3]–[F5]. **Confianza: Alta**.
- Cuando no se haya contrastado una obligación, plazo, tasa, formato vigente o artículo concreto, se marca **Pendiente de verificar** en vez de completar el dato por inferencia. Fuente: alcance de esta revisión y limitaciones reflejadas en [F3] y [F5]. **Confianza: Alta**.
- Las normas y sus modificaciones deben revisarse en conjunto antes de fijar requisitos de producción. La RS citada en un documento puede no describir por sí sola el estado consolidado vigente. Fuentes: [F6] y [F7]. **Confianza: Alta** para la cautela; aplicabilidad concreta **Pendiente de verificar**.
