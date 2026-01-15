# 🏛️ CONCEPTOS FUNDAMENTALES - ARQUITECTURA

> **Para Tech Leads y Developers.** Entendiendo el motor bajo el capó.
>
> **Tiempo estimado de lectura:** 40 minutos
> **Nivel:** Avanzado

---

## 📍 TABLA DE CONTENIDOS

1. [El Modelo de 3 Capas](#el-modelo-de-3-capas)
2. [Las 2 Funciones Críticas de IA](#las-2-funciones-críticas-de-ia)
3. [Flujo de Datos en Tiempo Real](#flujo-de-datos-en-tiempo-real)
4. [Modelo de Seguridad](#modelo-de-seguridad)

---

## 🏗️ El Modelo de 3 Capas

Nuestro sistema no es monolítico. Son 3 piezas independientes hablando entre sí:

### 1. CAPA DE PRESENTACIÓN (Frontend)
*   **Tecnologías:** HTML5 + Vanilla JS + Tailwind CSS.
*   **Ubicación:** `dashboard.html` + `Cliente_lite/`.
*   **Filosofía:** "Tonta y bonita".
    *   No procesa datos complejos.
    *   No guarda estado localmente (stateless).
    *   Solo escucha eventos de Firestore y renderiza.
    *   Envía órdenes al backend mediante `fetch()` a endpoints protegidos.

### 2. CAPA LÓGICA (Backend)
*   **Tecnologías:** Node.js (v18+) + Express.
*   **Ubicación:** `index.js`.
*   **Filosofía:** "El cerebro obrero".
    *   **Cron Jobs:** Ejecuta un bucle cada 2 minutos para leer Gmail.
    *   **Orquestador:** Conecta Gmail API <-> Gemini AI <-> Firestore.
    *   **Validación:** Verifica que los datos sean coherentes antes de guardar.

### 3. CAPA DE DATOS (Persistencia)
*   **Tecnologías:** Firestore (NoSQL) + Google Cloud Storage.
*   **Filosofía:** "La verdad única".
    *   Si un dato no está en Firestore, no existe.
    *   Estructura de colecciones:
        *   `candidatos`: Todos los perfiles activos.
        *   `papelera`: Perfiles descartados (TTL de 30 días opcional).
        *   `config`: Variables dinámicas del sistema.

---

## 🧠 Las 2 Funciones Críticas de IA

El corazón del sistema son dos funciones asíncronas que invocan a Google Gemini Pro.

### Función 1: El Clasificador (`organizarCVconIA`)
Esta función transforma el caos (texto crudo de un PDF) en orden (JSON).

*   **Input:** Texto plano extraído del PDF.
*   **Prompt Engineering:**
    > "Actúa como un reclutador experto. Extrae: Nombre, Email, Skills (Array), Experiencia (Resumen), Idiomas. Asigna un Score del 1 al 10 basado en relevancia para [Puesto]."
*   **Output:** Objeto JSON estricto.
*   **Manejo de Errores:** Si el JSON viene mal formado, la función tiene un mecanismo de "auto-repair" (reintenta pidiendo corrección a la IA).

### Función 2: El Analista Profundo (`analisisIaProfundo`)
Esta es la función más costosa y potente. Se ejecuta solo bajo demanda (botón "Analizar").

*   **Inputs Cruzados:**
    1.  JSON del CV (Hard Skills).
    2.  Transcripción de la entrevista (Soft Skills & Comunicación).
    3.  Notas del reclutador (Observaciones humanas).
*   **Misión:** Detectar inconsistencias. *¿El candidato dice saber inglés pero en la entrevista titubeó?*
*   **Output:** Texto Markdown listo para convertirse en DOCX.

---

## 🔄 Flujo de Datos en Tiempo Real

A diferencia de apps web tradicionales, aquí no necesitamos refrescar la página (`F5`).

1.  **Evento Externo:** Llega un email.
2.  **Backend:** Procesa y hace `db.collection('candidatos').add(data)`.
3.  **Firestore:** Detecta el cambio y emite un evento `onSnapshot`.
4.  **Frontend:** El listener `db.collection('candidatos').onSnapshot(...)` recibe el dato nuevo.
5.  **UI:** JavaScript inyecta el HTML del nuevo candidato en el DOM.

**Latencia promedio:** < 800ms desde que el backend guarda hasta que el reclutador lo ve.

---

## 🔐 Modelo de Seguridad

### Autenticación
*   No usamos usuarios/contraseñas propios. Delegamos todo a **Google Identity Platform**.
*   El backend verifica el token JWT en cada petición sensible (`authMiddleware.js`).

### Sanitización
*   Todos los inputs que van a generar el DOCX se limpian para evitar inyecciones que rompan el XML del documento Word.

### Backup & Recuperación
*   **Soft Delete:** Cuando borras un candidato, en realidad solo cambiamos su campo `status` a `'papelera'`.
*   Solo el administrador de la base de datos puede hacer un "Hard Delete" definitivo.
