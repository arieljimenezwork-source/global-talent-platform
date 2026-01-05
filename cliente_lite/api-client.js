const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:3001"       // Si estoy en mi compu
    : window.location.origin;       // <--- MAGIA: Detecta la URL real automáticamente (sea cual sea)

console.log(`🚀 Conectado a la API en: ${API_URL}`);

const api = {
            reports: {
                generate: async (id, manualData = null) => {
                    try {
                        const response = await fetch(`${API_URL}/candidatos/${id}/resumen`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ forceRegenerate: !!manualData, manualData: manualData })
                        });
                        return await response.json();
                    } catch (e) { return null; }
                }
            },
            candidates: {
                list: async () => {
                    try {
                        const res = await fetch(`${API_URL}/buscar`);
                        const data = await res.json();
                        const lista = data.resultados || [];
                        return lista.map(c => ({
                        id: c.id,
                        nombre: c.nombre || "Sin Nombre",
                        email: c.email || "S/E",
                        puesto: c.puesto || "General",
                        
                        // 🔥 DATOS DE IA Y FILTROS
                        ia_score: c.ia_score || 0,
                        ia_motivos: c.ia_motivos || c.motivo || "Análisis pendiente...", 
                        ia_alertas: c.ia_alertas || [],
                        respuestas_filtro: c.respuestas_filtro || {}, 
                        
                        // 🎥 VIDEO Y ARCHIVOS (ARREGLADO PARA ZOHO)
                        cv_url: c.cv_url || '#',
                        // Aquí agregamos c.Video_Link para que lea lo que viene del formulario
                        video_url: c.video_url || c.Video_Link || null, 
                        
                        // ESTADOS
                        fecha: c.fecha || c.creado_en,
                        stage: c.stage || (c.status_interno === 'new' ? 'stage_1' : 'stage_1'), 
                        status_interno: c.status_interno || 'new',
                        
                        // 👇 ESTOS SON LOS DOS CABLES QUE FALTABAN PARA LA PERSISTENCIA 👇
                        assignedTo: c.assignedTo || null,      
                        history: c.history || c.historial_movimientos || [], 
                        
                        notes: c.motivo || c.notes || '', 
                        informe_final_data: c.informe_final_data || null
                    }));
                    } catch (error) {
                        console.error("Error cargando:", error);
                        return []; 
                    }
                },
                // 🚀 EL ARREGLO DEL BOTÓN (USANDO PATCH)
                update: async (id, updates) => {
                    try {
                        await fetch(`${API_URL}/candidatos/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updates)
                        });
                        return { ok: true };
                    } catch (e) {
                        console.error(e);
                        return { ok: false };
                    }
                },
                
                manualUpload: async (formData) => {
                    try {
                        const res = await fetch(`${API_URL}/candidatos/ingreso-manual`, { 
                            method: 'POST', 
                            body: formData 
                        });
                        return await res.json();
                    } catch (e) {
                        console.error("Error en upload:", e);
                        return { ok: false, error: e.message };
                    }
                }
            },
            metrics: {
                get: async () => {
                    try {
                        const res = await fetch(`${API_URL}/panel/metrics`);
                        const data = await res.json();
                        return { totals: data.totals }; 
                    } catch (e) { return { totals: {} }; }
                }
            },
            // Para el ReportView modo manual
            processManualReport: async (formData) => {
                const res = await fetch(`${API_URL}/manual-upload`, { method: 'POST', body: formData });
                if (!res.ok) throw new Error("Error en el servidor");
                return await res.json();
            }
        };

        // --- HACER API GLOBAL ---
window.api = api;
window.API_URL = API_URL;
            
        

