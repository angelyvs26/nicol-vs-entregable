# Notas de investigación (borrador sin editar)

> Texto original de la investigación sobre Nubefact. El agente debe usarlo como fuente para crear `investigacion-nubefact.md`.

---

## Parte 1: Informe técnico — Documentación oficial

Fuente: portal oficial de Nubefact, sección de Integración mediante API REST para sistemas de facturación electrónica en el Perú (https://www.nubefact.com/integracion).

### Informe Técnico: Investigación Previa y Análisis de Software — Nubefact (OSE / PSE)

#### 1. Justificación de Metodología

La presente investigación y análisis preliminar del sistema de facturación electrónica Nubefact se fundamenta estrictamente en la revisión exhaustiva de su documentación técnica oficial, manuales de integración de API REST y retroalimentación de usuarios del ecosistema contable-empresarial en el Perú.

Se prioriza esta metodología por encima de la interacción directa con una cuenta de prueba interactiva debido a los siguientes factores técnicos y regulatorios del modelo SUNAT:

* Restricciones de Validación de RUC Activo: Los entornos de homologación y producción de Operadores de Servicios Electrónicos (OSE) y Proveedores de Servicios Electrónicos (PSE) exigen validaciones criptográficas y credenciales de Soluciones de Facturación vinculadas a un Registro Único de Contribuyentes (RUC) activo, con régimen tributario vigente y habilitado para emitir comprobantes de pago electrónicos (CPE).
* Mitigación de Sesgos de Entorno Sandbox: Al basar el análisis en la Integración API REST (https://www.nubefact.com/integracion) y especificaciones oficiales, se garantiza una evaluación agnóstica, orientada a la arquitectura real del software, desacoplada de las limitaciones temporales o restricciones de datos ficticios de una demo genérica.

#### 2. Funcionalidades y Casos de Uso Principales (Nubefact)

**Módulo de Emisión**

* Tipos de Comprobantes Soportados: Emisión estandarizada de Facturas Electrónicas, Boletas de Venta Electrónicas, Notas de Crédito, Notas de Débito y Guías de Remisión Electrónica (Remitente y Transportista).
* Tipos de Operaciones: Gestión integral de operaciones comerciales tipificadas por la SUNAT, incluyendo ventas gravadas, exoneradas, inafectas, exportaciones y transferencias gratuitas.

**Módulo de Anulación**

* Proceso de Baja y Notas Modificatorias: Emisión de comunicaciones de baja orientadas a la anulación de boletas o facturas dentro de los plazos normativos, respaldada por la generación automática de Notas de Crédito asociadas al comprobante original para la corrección de montos, errores en la descripción o devoluciones de productos.

**Módulo de Reportes**

* Consultas Inteligentes y Auditoría: Paneles de visualización y filtrado de ventas por rangos de fecha, número de documento, tipo de cliente y estado ante la SUNAT.
* Descarga de Activos Digitales: Almacenamiento centralizado y descarga automatizada del tridente tributario obligatorio: formato representativo en PDF, estructura de datos en XML y la Constancia de Recepción (CDR - Constancia de Recepción).

**Arquitectura de Integración**

* Modelo de API REST: Arquitectura desacoplada que permite conectar cualquier sistema informático externo (ERP, CRM, software de punto de venta a medida) mediante el envío de una trama de datos estructurada.
* Requerimientos de Conexión:
  * RUTA (Endpoint): URL asignada por la plataforma para el envío de peticiones HTTP POST.
  * TOKEN de Autorización: Credencial alfanumérica de seguridad por tipo de entorno (pruebas o producción).
  * Archivo Plano / Trama: Estructura en formato JSON o TXT con los datos del emisor, cliente, ítems, impuestos y totales.
* Flujo Automático: El sistema receptor procesa la trama recibida, genera el XML y el PDF de manera transparente, realiza el despacho y validación ante la SUNAT u OSE Nubefact, y almacena de forma segura la CDR resultante.

#### 3. Recopilación de Opiniones y Valoración de Usuarios

**Puntos Positivos (Ventajas)**

* Facilidad de Integración API: Documentación técnica clara, manuales detallados para lenguajes populares (PHP, C#, Java, Python) y archivos de ejemplo listos para implementar, reduciendo la curva de aprendizaje para desarrolladores.
* Estabilidad y Respaldo OSE: Al contar con la autorización oficial como Operador de Servicios Electrónicos (OSE) y Proveedor de Servicios Electrónicos (PSE), garantiza alta disponibilidad en el procesamiento de comprobantes frente a las caídas recurrentes del portal directo de la SUNAT.
* Interfaz Limpia y Funcional: Paneles web intuitivos diseñados para la consulta rápida de comprobantes sin requerir conocimientos contables avanzados.

**Puntos Negativos / Oportunidades de Mejora (Desventajas)**

* Latencia Puntual en Horas Pico: Reportes de demoras esporádicas en la generación masiva o descarga simultánea de archivos PDF durante el cierre de mes o horarios de alta concurrencia fiscal.
* Restricciones de Pruebas Iniciales: Dependencia estricta de la validación del RUC corporativo y la activación de credenciales para realizar pruebas reales de envío hacia los entornos de homologación.
* Personalización de Plantillas: Limitaciones en el grado de modificación profunda de las plantillas impresas de los comprobantes (formato Ticket o A4) sin depender de configuraciones adicionales o soporte especializado.

---

## Parte 2: Reseñas de usuarios — Google Maps

Fuente: reseñas de "NubeFacT - Factura electrónica PERU" en Google Maps.

### 1. Análisis de reseñas reales de usuarios (Google Maps / Terceros)

**Puntos Fuertes (Ventajas)**

* Acompañamiento técnico personalizado: Los usuarios destacan de forma recurrente la metodología de soporte "paso a paso", valorando la profesionalidad, paciencia y calidad humana de los asesores.
* Resolución efectiva de incidencias: Se percibe una alta competencia técnica en el equipo de soporte para desescalar problemas operativos y brindar soluciones concretas de manera oportuna.
* Disponibilidad y agilidad: Las opiniones resaltan una respuesta rápida y amable ante consultas sobre facturación electrónica, lo que reduce la fricción en la curva de aprendizaje de la plataforma.

**Puntos Débiles (Oportunidades de Mejora / Quejas comunes en el sector)**

* Saturación en canales de atención telefónica: En periodos de alta demanda tributaria o cierres fiscales, los usuarios de este tipo de servicios suelen reportar picos de congestión y tiempos de espera prolongados en las líneas de soporte.
* Dependencia de la estabilidad de la plataforma: Aunque el servicio de soporte mitiga las dudas, cualquier intermitencia imprevista en el sistema de emisión genera impacto directo en la operatividad de los negocios, exigiendo respuestas automatizadas o autogestionables más robustas.

### 2. Síntesis de valoración para el caso de estudio

El análisis del feedback en plataformas digitales revela que NubeFacT sostiene un rendimiento competitivo respaldado principalmente por la excelencia en su soporte humano y su capacidad de resolución empática. Si bien la experiencia de usuario (UX) asistida por los asesores mitiga significativamente la complejidad técnica de la normativa fiscal, la consolidación a largo plazo del modelo de negocio dependerá de equilibrar dicha asistencia personalizada con la escalabilidad y estabilidad sistémica de su infraestructura tecnológica.

---

## Parte 3: Acreditaciones y compatibilidad técnica

Fuente: documentación oficial del proveedor.

De la documentación oficial del proveedor se evidencia que Nubefact es un PSE/OSE autorizado por la SUNAT respaldado por la certificación ISO 27001 de seguridad de la información. Su API REST destaca por una amplia interoperabilidad multiplataforma, permitiendo la integración nativa con sistemas desarrollados en lenguajes como PHP, C#, Java, Python, Ruby, Swift y entornos legados como Visual FoxPro. Asimismo, cuenta con manuales de alta OSE/PSE y guías de conservación de archivos obligatorios (PDF, XML y CDR).
