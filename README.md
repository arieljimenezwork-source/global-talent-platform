# 🌟 Global Talent Connections (GTC)
*Motor de Reclutamiento Autónomo impulsado por IA Híbrida*

![Estado del Build](https://img.shields.io/badge/Build-Producción-success?style=for-the-badge&logo=github)
![Versión](https://img.shields.io/badge/Versión-1.2.0-blue?style=for-the-badge)
![Núcleo IA](https://img.shields.io/badge/Núcleo_IA-Gemini_1.5_%2B_ElevenLabs-purple?style=for-the-badge)

---

## 🚀 Resumen Ejecutivo
**Global Talent Connections** es una plataforma de reclutamiento automatizada y avanzada, diseñada para optimizar el flujo de contratación desde el contacto inicial hasta la decisión final. Aprovechando una **Arquitectura de IA Híbrida** (Google Gemini para análisis cognitivo + ElevenLabs para entrevistas conversacionales), GTC elimina el filtrado manual, realiza primeras entrevistas autónomas y entrega reportes integrales de inteligencia sobre los candidatos.

**Propuesta de Valor:**
- **Sourcing "Cero-Toque":** Parsea y estandariza automáticamente CVs desde correos entrantes.
- **Evaluación Cognitiva:** Va más allá de las palabras clave para entender el potencial del candidato.
- **Entrevistas Autónomas:** Realiza screenings técnicos por voz 24/7.
- **Decisiones Basadas en Datos:** Agrega datos de múltiples fuentes (CV, Video, Entrevista) en insights accionables.

---

## 🏗️ Arquitectura del Sistema

El siguiente diagrama ilustra el flujo de datos desde la postulación hasta la generación del reporte final:

```mermaid
graph TD
    A[📧 Email Entrante (Gmail)] -->|Auto-Parseo| B(Servicio Backend / Node.js)
    B -->|Extraer PDF/Texto| C{Gemini 1.5 Flash}
    C -->|Analizar Perfil| D[Base de Datos Firestore]
    D -->|¿Calificado?| E[Etapa 2: Entrevista]
    
    subgraph Entrevista Autónoma
    E -->|Generar Link| F[ElevenLabs ConvAI]
    F -->|Realizar Llamada| G[Candidato]
    G -->|Stream de Voz| F
    F -->|Webhook: Transcripción + Audio| B
    end

    B -->|Re-Analizar Transcripción| C
    C -->|Generar Reporte Final| H[Dashboard (React/Tailwind)]
    H -->|Decisión Humana| I[Contratar / Rechazar]
```

---

## ⚡ Funcionalidades Clave

### 1. **Pipeline de Sourcing Automatizado** (Gmail Watcher)
- Monitoreo en tiempo real de la bandeja de entrada mediante IMAP IDLE.
- Extracción inteligente de adjuntos (PDF/DOCX) usando OCR si es necesario.
- Creación automática de candidatos y detección de duplicados en Firestore.

### 2. **Análisis Cognitivo de Candidatos** (GeminiCore)
- **Extracción JSON Estructurada:** Convierte CVs no estructurados en un modelo de datos estandarizado.
- **Scoring Inteligente:** Evalúa candidatos basándose en requisitos del rol, no solo keywords.
- **Detección de Red Flags:** Identifica inconsistencias (ej: brechas de habilidades, lagunas laborales).

### 3. **Entrevistador de Voz Autónomo** (Integración ElevenLabs)
- **Conversaciones Dinámicas:** El Agente de IA adapta las preguntas según las respuestas del candidato.
- **Latencia < 800ms:** Proporcionando un flujo de conversación natural y humano.
- **Sync Post-Entrevista:** Procesamiento automático de webhooks (`/webhooks/resultado-entrevista`) para capturar transcripciones y audio.
- **Protocolos de Recuperación:** Funcionalidad de Sync Manual (`/sync-elevenlabs`) para recuperar entrevistas "huérfanas" usando IDs de conversación.

### 4. **Dashboard del Reclutador** (Cliente Lite)
- **Vista de Pipeline en Tiempo Real:** Tablero estilo Kanban para seguimiento de candidatos.
- **Acciones de Un Clic:** Agendar entrevistas, generar reportes o enviar emails de rechazo.
- **Acceso Seguro:** Control de acceso basado en roles vía Firebase Auth.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Descripción |
|-----------|------------|-------------|
| **Backend** | Node.js (v18+) | API Core, Manejo de Webhooks, Lógica de Negocio |
| **Framework** | Express.js | API RESTful, Middleware, Rate Limiting |
| **Base de Datos** | Firebase Firestore | Base de Datos NoSQL en Tiempo Real |
| **Almacenamiento** | Google Cloud Storage | Almacenamiento seguro para CVs y Audios |
| **IA (Cognitiva)** | Google Gemini 1.5 | Análisis de CV, Generación de Reportes, Lógica de Decisión |
| **IA (Voz)** | ElevenLabs ConvAI | Agente Conversacional para Entrevistas |
| **Frontend** | React + Tailwind | Dashboard Administrativo Responsivo |
| **Integraciones** | Zoho Forms, Gmail | Fuentes de Datos Externas |

---

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18.x o superior
- NPM o Yarn
- Credenciales de Proyecto Firebase (`service-account.json`)
- Proyecto Google Cloud con Vertex AI habilitado
- Cuenta de ElevenLabs con API Key

### Inicio Rápido

1. **Clonar Repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd global-talent-platform
   npm install
   ```

2. **Configurar Variables de Entorno**
   Crea un archivo `.env` basado en `.env.example`:
   ```env
   # Config Firebase
   FIREBASE_PROJECT_ID=tu-project-id
   FIREBASE_CLIENT_EMAIL=tu-email-servicio
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

   # Servicios IA
   GEMINI_API_KEY=tu-clave-gemini
   ELEVENLABS_API_KEY=tu-clave-elevenlabs
   ELEVENLABS_AGENT_ID=tu-agent-id
   
   # Config Email
   EMAIL_USER=reclutamiento@empresa.com
   EMAIL_PASS=app-password
   ```

3. **Iniciar Servidor de Desarrollo**
   ```bash
   npm run dev
   # El servidor corre en http://localhost:3000
   ```
   
4. **Acceder al Dashboard**
   Navega a `http://localhost:3000` para ver el panel de reclutamiento.

---

## 📚 Referencia de Documentación

Para guías operativas detalladas, por favor referirse a la documentación interna:

- **[ONBOARDING_COMPLETO.md](./docs/ONBOARDING_COMPLETO.md)**: Guía completa para nuevos desarrolladores.
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)**: Problemas comunes y soluciones.
- **[API_DOCS.md](./docs/API_DOCS.md)** (Próximamente): Referencia detallada de endpoints de la API.

---

## 🛡️ Licencia y Contacto

Este proyecto es propietario y confidencial. La distribución no autorizada está prohibida.

**Líder de Mantenimiento:** Equipo de Ingeniería Backend  
**Soporte:** soporte@globaltalentconnections.com

---
*Generado vía Asistente Agéntico Antigravity*
