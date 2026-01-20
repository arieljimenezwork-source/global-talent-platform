// ============================================================
// services/fichaGenerator.js
// REEMPLAZA: ficha.py y ficha2.py
// ============================================================

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Document, Packer, Paragraph, Table, TableRow, TableCell, 
        WidthType, BorderStyle, TextRun, AlignmentType, 
        HeadingLevel, ShadingType } = require("docx");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// CONSTANTES (migradas de Python)
// ============================================================
const TOOLS_USAGE = {
  "autocad": "Diseño y planos arquitectónicos",
  "revit": "Modelado BIM y coordinación",
  "sketchup": "Modelado 3D y visualización",
  "archicad": "Modelado BIM y documentación",
  "photoshop": "Edición y retoque de imágenes",
  "illustrator": "Gráficos vectoriales y piezas",
  "microsoft project": "Planificación y seguimiento",
  "microsoft office": "Documentación y presentaciones",
  "microsoft excel": "Modelado y análisis de datos",
  "excel": "Modelado y análisis de datos",
  "google workspace": "Colaboración y productividad",
  "google calendar": "Gestión de agenda y reuniones",
  "asana": "Gestión y priorización de tareas",
  "trello": "Tableros kanban y seguimiento",
  "notion": "Documentación de procesos",
  "metricool": "Analítica y programación social",
  "mailchimp": "Email marketing y automatización",
  "pipedrive": "Gestión de ventas y CRM",
  "canva": "Diseño rápido de piezas",
  "meta ads": "Gestión de campañas en Meta",
  "google ads": "Publicidad y performance",
  "odoo": "ERP y procesos contables",
  "sap": "ERP corporativo",
  "slack": "Mensajería y colaboración",
  "discord": "Comunicación por canales",
  "hubspot": "CRM y marketing automation",
  "salesforce": "CRM empresarial",
  "jira": "Gestión de proyectos ágiles",
  "figma": "Diseño de interfaces UI/UX",
  "python": "Desarrollo y automatización",
  "javascript": "Desarrollo web frontend/backend",
  "react": "Desarrollo de interfaces web",
  "node": "Backend y APIs",
};

const TOOL_SYNONYMS = {
  "project": "Microsoft Project",
  "ms project": "Microsoft Project",
  "office": "Microsoft Office",
  "excel": "Microsoft Excel",
  "g suite": "Google Workspace",
  "google suite": "Google Workspace",
  "calendar": "Google Calendar",
  "google calendar": "Google Calendar",
  "autocad": "AutoCAD",
  "sketchup": "SketchUp",
  "adwords": "Google Ads",
  "facebook ads": "Meta Ads",
};

// ============================================================
// HELPERS DE LECTURA DE ARCHIVOS
// ============================================================

/**
 * Lee texto de un PDF
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || "";
  } catch (error) {
    console.error("Error extrayendo texto de PDF:", error.message);
    return "";
  }
}

/**
 * Lee texto de un DOCX
 */
async function extractTextFromDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  } catch (error) {
    console.error("Error extrayendo texto de DOCX:", error.message);
    return "";
  }
}

/**
 * Lee texto de cualquier archivo (PDF, DOCX, TXT)
 */
async function readCVAny(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return "";
  
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === ".pdf") {
    return await extractTextFromPDF(filePath);
  } else if (ext === ".docx") {
    return await extractTextFromDOCX(filePath);
  } else {
    // Asumir texto plano
    return fs.readFileSync(filePath, "utf8");
  }
}

// ============================================================
// EXTRACCIÓN DE HERRAMIENTAS CON %
// ============================================================

/**
 * Normaliza el nombre de una herramienta
 */
function normalizeTool(name) {
  let s = (name || "").trim();
  
  // Remover frases como "He utilizado", "uso de", etc.
  s = s.replace(
    /(?:he\s+utilizado|he\s+usado|he\s+manejado|utilizo|uso|manejo|conocimiento\s+de|experiencia\s+en|trabajo\s+con|uso\s+de|herramientas?\s+de)[:\-]?\s*/gi,
    ""
  ).trim();
  
  // Aplicar sinónimos
  const lower = s.toLowerCase();
  if (TOOL_SYNONYMS[lower]) {
    return TOOL_SYNONYMS[lower];
  }
  
  // Capitalizar primera letra
  if (s && s[0] === s[0].toLowerCase()) {
    s = s[0].toUpperCase() + s.slice(1);
  }
  
  return s;
}

/**
 * Adivina el uso de una herramienta
 */
function guessToolUsage(name) {
  const key = (name || "").toLowerCase();
  
  if (TOOLS_USAGE[key]) return TOOLS_USAGE[key];
  
  // Heurísticas por familia
  if (key.includes("excel") || key.includes("sheet")) {
    return "Modelado y análisis de datos en hojas de cálculo";
  }
  if (key.includes("calendar") || key.includes("agenda")) {
    return "Gestión de agenda, eventos y reuniones";
  }
  if (["slack", "discord", "teams", "whatsapp", "telegram"].some(w => key.includes(w))) {
    return "Mensajería y colaboración en equipos";
  }
  if (["ads", "sem", "seo", "mailchimp", "metricool"].some(w => key.includes(w))) {
    return "Gestión de campañas de marketing digital";
  }
  if (["crm", "pipedrive", "hubspot", "salesforce"].some(w => key.includes(w))) {
    return "Gestión de oportunidades comerciales en CRM";
  }
  if (["project", "asana", "trello", "notion", "jira"].some(w => key.includes(w))) {
    return "Planificación y seguimiento de proyectos";
  }
  if (["autocad", "revit", "archicad", "sketchup"].some(w => key.includes(w))) {
    return "Modelado y documentación técnica";
  }
  if (["photoshop", "illustrator", "canva", "figma"].some(w => key.includes(w))) {
    return "Diseño y edición de piezas visuales";
  }
  
  return "Aplicación práctica en el área";
}

/**
 * Extrae herramientas con porcentaje del texto
 * Ejemplo: "Excel - 90%" o "Photoshop 85%"
 */
function extractToolsWithPercent(text, maxN = 40) {
  const cleanText = (text || "").replace(/\r/g, "");
  const candidates = [];
  
  // Regex para: "Herramienta - 85%" o "Herramienta: 90%" o "Herramienta 80%"
  const regex = /([A-Za-zÁ-ÿ][A-Za-zÁ-ÿ0-9 .+/_()-]{1,}?)\s*[:\-–—]?\s*(\d{1,3})\s*%/gi;
  
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const name = normalizeTool(match[1]);
    const pct = Math.min(Math.max(parseInt(match[2]), 0), 100);
    
    // Solo si el nombre tiene al menos 3 letras
    if (name.replace(/[^A-Za-zÁ-ÿ]/g, "").length >= 3) {
      candidates.push({ 
        herramienta: name, 
        nivel: `${pct}%`,
        uso: guessToolUsage(name)
      });
    }
  }
  
  // Deduplicar (quedarse con el mayor %)
  const merged = {};
  for (const c of candidates) {
    const key = c.herramienta.toLowerCase();
    if (!merged[key] || parseInt(c.nivel) > parseInt(merged[key].nivel)) {
      merged[key] = c;
    }
  }
  
  // Ordenar por % descendente y limitar
  return Object.values(merged)
    .sort((a, b) => parseInt(b.nivel) - parseInt(a.nivel))
    .slice(0, maxN);
}

// ============================================================
// LLAMADA A IA (GEMINI) - Reemplaza OpenAI
// ============================================================

/**
 * Extrae todos los campos usando Gemini (ficha2.py style)
 */
async function aiExtractFields(fullText, cvText, tools) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  // Truncar CV si es muy largo
  const cvTruncated = cvText.length > 45000 
    ? cvText.slice(0, 45000) + "\n...[TRUNCADO]..." 
    : cvText;
  
  const prompt = `
Eres analista de RRHH. Genera un informe profesional en ESPAÑOL NEUTRO.

Devuelve SOLO JSON válido (sin markdown, sin \`\`\`). Estructura EXACTA:

{
  "fecha": "Fecha actual",
  "puesto": "Puesto detectado o 'Asistente Virtual'",
  "nombre": "Nombre completo del candidato",
  "resumen_ejecutivo": "Párrafo de 5-8 líneas describiendo el perfil profesional",
  "ficha_tecnica": {
    "ubicacion": "Ciudad, País",
    "nivel_experiencia": "Junior/Semi-Senior/Senior",
    "formacion_formal": "Título principal",
    "nivel_ingles": "Básico/Intermedio/Avanzado/Nativo",
    "disponibilidad": "Inmediata/2 semanas/etc"
  },
  "competencias_tecnicas": [
    {"competencia": "Área de conocimiento (NO software)", "nivel": "Alto/Medio/Básico"}
  ],
  "habilidades_blandas": [
    {"habilidad": "Soft skill", "nivel": "Alto/Medio/Básico"}
  ],
  "herramientas": [
    {"herramienta": "Software/Plataforma", "nivel": "NN% o Avanzado/Intermedio/Básico"}
  ],
  "plus": "Puntos fuertes adicionales del candidato",
  "formacion_sugerida": "Áreas de mejora o capacitación recomendada",
  "recomendacion_final": "Veredicto final sobre el candidato",
  "responsable": "Departamento de Recursos Humanos"
}

REGLAS CRÍTICAS:
1. 'competencias_tecnicas': ÁREAS DE CONOCIMIENTO (Ej: 'Gestión de Proyectos', 'Contabilidad'). PROHIBIDO poner software aquí.
2. 'herramientas': SOLO SOFTWARE y PLATAFORMAS (Ej: 'Excel', 'Python', 'Jira').
3. Si la lista de herramientas detectadas está incompleta, EXTRAE LAS HERRAMIENTAS DEL CV.
4. 'habilidades_blandas': Solo soft skills.

=== TEXTO/NOTAS DEL RECLUTADOR ===
${fullText.slice(0, 15000)}

=== CV DEL CANDIDATO ===
${cvTruncated.slice(0, 20000)}

=== HERRAMIENTAS DETECTADAS (priorizar estas) ===
${JSON.stringify(tools, null, 2)}

Responde SOLO con el JSON, sin explicaciones ni markdown.
`;

  const result = await model.generateContent(prompt);
  let text = result.response.text()
    .replace(/```json/g, "").replace(/```/g, "").trim();
  
  // Extraer JSON limpio
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Error parseando JSON de Gemini:", e.message);
    data = {};
  }
  
  // Si regex encontró herramientas, fusionar con las de IA
  if (tools && tools.length > 0) {
    const existingNames = new Set((data.herramientas || []).map(t => t.herramienta?.toLowerCase()));
    const merged = [...(data.herramientas || [])];
    
    for (const tool of tools) {
      if (!existingNames.has(tool.herramienta.toLowerCase())) {
        merged.push(tool);
      }
    }
    data.herramientas = merged;
  }
  
  return data;
}

/**
 * Normaliza competencias - mueve software a herramientas
 */
function normalizeSkills(data) {
  const softwareKeywords = [
    "excel", "word", "powerpoint", "office", "photoshop", "illustrator",
    "figma", "canva", "trello", "asana", "jira", "python", "java",
    "javascript", "react", "angular", "node", "html", "css", "sql",
    "salesforce", "sap", "hubspot", "vs code", "postman", "git", "github"
  ];
  
  const comps = data.competencias_tecnicas || [];
  const tools = data.herramientas || [];
  const newComps = [];
  
  for (const item of comps) {
    const nombre = (item.competencia || "").toLowerCase();
    const esSoftware = softwareKeywords.some(sw => nombre.includes(sw));
    
    if (esSoftware) {
      // Mover a herramientas
      const exists = tools.some(t => (t.herramienta || "").toLowerCase() === nombre);
      if (!exists) {
        tools.push({
          herramienta: item.competencia,
          nivel: item.nivel || "Se menciona"
        });
      }
    } else {
      newComps.push(item);
    }
  }
  
  data.competencias_tecnicas = newComps;
  data.herramientas = tools;
  return data;
}

// ============================================================
// GENERADOR DE DOCX
// ============================================================

/**
 * Crea una celda de tabla con estilo
 */
function createStyledCell(text, options = {}) {
  const { bold = false, shading = null, width = null } = options;
  
  const cellOptions = {
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text || "",
            bold,
            font: "Times New Roman",
            size: 22, // 11pt
          })
        ],
        alignment: AlignmentType.LEFT,
      })
    ],
  };
  
  if (shading) {
    cellOptions.shading = { fill: shading, type: ShadingType.CLEAR };
  }
  
  if (width) {
    cellOptions.width = { size: width, type: WidthType.DXA };
  }
  
  return new TableCell(cellOptions);
}

/**
 * Crea una tabla con bordes
 */
function createBorderedTable(rows, columnWidths = null) {
  const tableRows = rows.map((rowData, rowIndex) => {
    const cells = rowData.map((cellData, colIndex) => {
      const isHeader = rowIndex === 0;
      return createStyledCell(
        typeof cellData === "string" ? cellData : cellData.text,
        {
          bold: isHeader || cellData.bold,
          shading: isHeader ? "E7EEF8" : null,
          width: columnWidths ? columnWidths[colIndex] : null
        }
      );
    });
    return new TableRow({ children: cells });
  });
  
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    }
  });
}

/**
 * Genera el documento DOCX completo
 */
async function renderDocx(outputPath, data, logoPath = null) {
  const fecha = data.fecha || new Date().toLocaleDateString("es-ES", {
    year: "numeric", month: "long", day: "numeric"
  });
  
  const sections = [];
  
  // === ENCABEZADO ===
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INFORME DE EVALUACIÓN PROFESIONAL",
          bold: true,
          size: 32,
          font: "Times New Roman",
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Fecha: ${fecha}`,
          size: 22,
          font: "Times New Roman",
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  // === FICHA TÉCNICA ===
  const ficha = data.ficha_tecnica || {};
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "FICHA TÉCNICA", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 }
    }),
    createBorderedTable([
      ["Campo", "Valor"],
      ["Nombre", data.nombre || ficha.nombre || "-"],
      ["Puesto", data.puesto || "-"],
      ["Ubicación", ficha.ubicacion || "-"],
      ["Nivel de Experiencia", ficha.nivel_experiencia || "-"],
      ["Formación", ficha.formacion_formal || "-"],
      ["Nivel de Inglés", ficha.nivel_ingles || "-"],
      ["Disponibilidad", ficha.disponibilidad || "-"],
    ], [3000, 6000])
  );
  
  // === RESUMEN EJECUTIVO ===
  if (data.resumen_ejecutivo) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "RESUMEN EJECUTIVO", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: data.resumen_ejecutivo, size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }
  
  // === COMPETENCIAS TÉCNICAS ===
  if (data.competencias_tecnicas?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "COMPETENCIAS TÉCNICAS", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      createBorderedTable([
        ["Competencia", "Nivel"],
        ...data.competencias_tecnicas.map(c => [c.competencia || "-", c.nivel || "-"])
      ], [6000, 3000])
    );
  }
  
  // === HABILIDADES BLANDAS ===
  if (data.habilidades_blandas?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "HABILIDADES BLANDAS", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      createBorderedTable([
        ["Habilidad", "Nivel"],
        ...data.habilidades_blandas.map(h => [h.habilidad || "-", h.nivel || "-"])
      ], [6000, 3000])
    );
  }
  
  // === HERRAMIENTAS ===
  if (data.herramientas?.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "HERRAMIENTAS TECNOLÓGICAS", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      createBorderedTable([
        ["Herramienta", "Nivel"],
        ...data.herramientas.map(h => [h.herramienta || "-", h.nivel || "-"])
      ], [6000, 3000])
    );
  }
  
  // === PLUS ===
  if (data.plus) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "PUNTOS FUERTES", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: data.plus, size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }
  
  // === FORMACIÓN SUGERIDA ===
  if (data.formacion_sugerida) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "FORMACIÓN SUGERIDA", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: data.formacion_sugerida, size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }
  
  // === RECOMENDACIÓN FINAL ===
  if (data.recomendacion_final) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: "RECOMENDACIÓN FINAL", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: data.recomendacion_final, size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  }
  
  // === RESPONSABLE ===
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `\n\nResponsable: ${data.responsable || "Departamento de Recursos Humanos"}`,
          italics: true,
          size: 20
        })
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400 }
    })
  );
  
  // Crear documento
  const doc = new Document({
    sections: [{
      properties: {},
      children: sections
    }]
  });
  
  // Guardar
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

// ============================================================
// FUNCIÓN PRINCIPAL (equivalente a main() de Python)
// ============================================================

/**
 * Genera una ficha completa desde texto + CV
 * @param {Object} options
 * @param {string} options.cvPath - Ruta al archivo CV (PDF/DOCX)
 * @param {string} options.extraText - Texto adicional (notas del reclutador)
 * @param {string} options.outputDir - Directorio de salida
 * @param {string} options.baseName - Nombre base del archivo
 * @param {string} [options.logoPath] - Ruta al logo (opcional)
 * @returns {Promise<{ok: boolean, docx: string, mapping: Object}>}
 */
async function generarFicha({ cvPath, extraText, outputDir, baseName, logoPath = null }) {
  console.log("[fichaGenerator] Iniciando generación...");
  
  // 1. Leer CV
  const cvText = await readCVAny(cvPath);
  console.log(`[fichaGenerator] CV leído: ${cvText.length} caracteres`);
  
  // 2. Extraer herramientas con % del texto
  const tools = extractToolsWithPercent(extraText);
  console.log(`[fichaGenerator] Herramientas detectadas: ${tools.length}`);
  
  // 3. Llamar a IA
  let data = await aiExtractFields(extraText, cvText, tools);
  console.log("[fichaGenerator] IA procesada");
  
  // 4. Normalizar (mover software de competencias a herramientas)
  data = normalizeSkills(data);
  
  // 5. Generar DOCX
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, `${baseName}.docx`);
  await renderDocx(outputPath, data, logoPath);
  console.log(`[fichaGenerator] DOCX generado: ${outputPath}`);
  
  return {
    ok: true,
    docx: outputPath,
    mapping: data
  };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Funciones principales
  generarFicha,
  
  // Helpers (por si se necesitan individualmente)
  readCVAny,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractToolsWithPercent,
  aiExtractFields,
  normalizeSkills,
  renderDocx,
  
  // Utilidades
  normalizeTool,
  guessToolUsage,
};