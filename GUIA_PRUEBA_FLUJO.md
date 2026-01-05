# 🧪 Guía de Prueba: Flujo Completo de Candidato

## Paso 1: Crear Candidato de Prueba

Ejecutá este comando en tu terminal (con el servidor corriendo):

```bash
curl -X POST http://localhost:3001/test/candidato-completo \
  -H "Content-Type: application/json"
```

O desde el navegador, abrí:
```
http://localhost:3001/test/candidato-completo
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "id": "test_candidato_1234567890",
  "mensaje": "Candidato de prueba creado exitosamente",
  "datos": {
    "nombre": "Juan Pérez (TEST)",
    "email": "test_...@example.com",
    "stage": "stage_1",
    "score": 75,
    "tiene_form2": true,
    "tiene_transcripcion": true
  }
}
```

## Paso 2: Verificar en el Dashboard

1. Abrí el dashboard: `http://localhost:3001`
2. Buscá el candidato "Juan Pérez (TEST)" en la sección **Explorar** (stage_1)
3. Deberías ver:
   - ✅ Score inicial (máximo 80)
   - ✅ Respuestas del Form 1
   - ✅ Respuestas del Form 2 (ya recibido)
   - ✅ Transcripción de entrevista (pre-cargada)

## Paso 3: Aprobar a Gestión (Stage 2)

1. Hacé clic en el candidato para abrir el detalle
2. Hacé clic en **"Aprobar a Gestión"**
3. El candidato debería moverse a la sección **Gestión**

## Paso 4: Verificar Datos de Entrevista

En el detalle del candidato en stage_2, deberías ver:
- ✅ **Meet Link**: Ya está pre-cargado
- ✅ **Transcripción**: Ya está pre-cargada
- ✅ **Form 2**: Marcado como "received"

## Paso 5: Analizar Entrevista con IA

1. En el detalle del candidato, hacé clic en **"Analizar con IA"**
2. Esperá unos segundos (la IA recalcula el score basándose en la transcripción)
3. El score debería actualizarse (ahora puede ser 0-100, no limitado a 80)

## Paso 6: Mover a Informe (Stage 3)

1. En el detalle del candidato, movelo a **"Informe"** (stage_3)
2. El candidato debería aparecer en la sección **Informes**

## Paso 7: Generar Informe Final

1. En la vista de **Informes**, buscá el candidato
2. Hacé clic en **"Generar Informe"**
3. Esperá unos segundos (la IA genera el informe completo)
4. Deberías ver el botón cambiar a **"Ver Informe"**
5. Hacé clic para ver el informe generado

## ✅ Checklist de Verificación

- [ ] Candidato creado en stage_1
- [ ] Score inicial visible (máx 80)
- [ ] Form 1 y Form 2 presentes
- [ ] Aprobado a stage_2 correctamente
- [ ] Meet link y transcripción visibles
- [ ] Análisis de entrevista ejecutado
- [ ] Score actualizado (0-100)
- [ ] Movido a stage_3
- [ ] Informe generado exitosamente
- [ ] Informe visible y descargable

## 🔍 Qué Revisar

### En Stage 1 (Explorar):
- Score inicial no debe superar 80
- Respuestas del Form 1 visibles
- Respuestas del Form 2 visibles (ya recibido)

### En Stage 2 (Gestión):
- Meet link presente
- Transcripción presente
- Botón "Analizar con IA" funcional
- Score actualizado después del análisis (puede ser > 80)

### En Stage 3 (Informe):
- Botón "Generar Informe" funcional
- Informe se genera con todos los datos:
  - CV original
  - Respuestas Form 1
  - Respuestas Form 2
  - Transcripción de entrevista
  - Análisis post-entrevista
  - Alertas detectadas

## 🐛 Si Algo Falla

1. **Candidato no aparece**: Refrescá el dashboard (F5)
2. **Error al analizar entrevista**: Verificá que la transcripción esté guardada
3. **Error al generar informe**: Verificá la consola del servidor para ver errores de IA
4. **Score no se actualiza**: Verificá que el endpoint `/candidatos/:id/analizar-entrevista` esté funcionando

## 📝 Notas

- El candidato de prueba tiene **todos los datos pre-cargados** para que puedas probar el flujo completo sin tener que ingresar datos manualmente
- El score inicial está limitado a 80 (como debe ser en stage_1)
- Después del análisis de entrevista, el score puede ser 0-100
- El informe final combina **todos** los datos del pipeline
