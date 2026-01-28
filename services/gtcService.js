// ============================================================
// services/gtcService.js
// Servicio para integrar con GTC Tech App (Index 2)
// ============================================================

const axios = require('axios');

const GTC_URL = process.env.GTC_API_URL;
const API_KEY = process.env.GTC_API_KEY;

/**
 * Crea una entrevista con bot de IA en el Index 2 (GTC Tech App)
 * @param {Object} candidato - Objeto con datos del candidato
 * @param {string} candidato.email - Email del candidato (requerido)
 * @param {string} candidato.nombre - Nombre del candidato (opcional, usa "Candidato" como fallback)
 * @returns {Promise<{success: boolean, link?: string, interview_id?: string, error?: string}>}
 */
async function crearEntrevistaEnGTC(candidato) {
  try {
    // Validar que tenemos la URL y API key configuradas
    if (!GTC_URL || !API_KEY) {
      console.error('❌ [GTC Service] Variables de entorno no configuradas');
      return { success: false, error: 'Configuración de GTC no disponible' };
    }

    // Validar que el candidato tenga email
    if (!candidato || !candidato.email) {
      console.error('❌ [GTC Service] Candidato sin email');
      return { success: false, error: 'El candidato debe tener un email' };
    }

    // Preparar payload
    const payload = {
      email: candidato.email,
      candidate_name: candidato.nombre || 'Candidato',
      job_position_id: process.env.DEFAULT_JOB_POSITION_ID || null
    };

    console.log(`🤖 [GTC Service] Creando entrevista para: ${candidato.email}`);

    // Hacer la petición POST al Index 2
    const response = await axios.post(
      `${GTC_URL}/api/interviews/create`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos de timeout
      }
    );

    // Verificar respuesta exitosa
    if (response.data && response.data.success) {
      const link = response.data.data?.link;
      const interview_id = response.data.data?.interview_id;

      if (link) {
        console.log(`✅ [GTC Service] Entrevista creada exitosamente. Link: ${link.substring(0, 50)}...`);
        return {
          success: true,
          link: link,
          interview_id: interview_id || null
        };
      } else {
        console.warn('⚠️ [GTC Service] Respuesta exitosa pero sin link');
        return { success: false, error: 'GTC retornó éxito pero sin link' };
      }
    } else {
      console.warn('⚠️ [GTC Service] GTC retornó success: false');
      return { success: false, error: 'GTC retornó false' };
    }
  } catch (error) {
    // Manejar diferentes tipos de errores
    if (error.response) {
      // El servidor respondió con un código de error
      const status = error.response.status;
      const data = error.response.data;
      console.error(`❌ [GTC Service] Error HTTP ${status}:`, data);
      return {
        success: false,
        error: `Error del servidor GTC (${status}): ${data?.error || data?.message || 'Error desconocido'}`
      };
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('❌ [GTC Service] Sin respuesta del servidor GTC');
      return { success: false, error: 'No se pudo conectar con el servidor GTC' };
    } else {
      // Error al configurar la petición
      console.error('❌ [GTC Service] Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = {
  crearEntrevistaEnGTC
};
