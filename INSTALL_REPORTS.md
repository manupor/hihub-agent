# 📦 Instalación del Sistema de Reportes

## Pasos para Activar en Render

### 1. Instalar Dependencias de Python

Render necesita saber que debe instalar las dependencias de Python. Agrega esto a tu configuración:

**Opción A: Usando Build Command en Render Dashboard**

En tu servicio de Render, ve a Settings y actualiza:

```
Build Command: npm install && pip install -r reports/requirements.txt
```

**Opción B: Crear archivo render.yaml** (Recomendado)

Crea `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: hihub-agent
    env: node
    buildCommand: npm install && pip install -r reports/requirements.txt
    startCommand: npm start
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
```

### 2. Verificar Python en Render

Render incluye Python 3.7+ por defecto. Si necesitas una versión específica, agrega:

```
runtime.txt
```

Con contenido:
```
python-3.11
```

### 3. Redeploy

Después de hacer push de los cambios, Render automáticamente:
1. Instalará las dependencias de Node.js
2. Instalará las dependencias de Python
3. Reiniciará el servicio

## 🧪 Probar Localmente

### 1. Instalar dependencias

```bash
cd /Users/manu/Downloads/hihub-agent
pip3 install -r reports/requirements.txt
```

### 2. Verificar instalación

```bash
python3 -c "import openpyxl, reportlab, openai; print('✅ Todo instalado')"
```

### 3. Probar generación de reporte

```bash
# Iniciar servidor
npm run dev

# En otra terminal, probar el endpoint
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test_123",
    "messages": [
      {"role": "user", "content": "Necesito un motor eléctrico de 5HP"},
      {"role": "assistant", "content": "Perfecto, ¿para qué aplicación lo necesitas?"},
      {"role": "user", "content": "Para una bomba de agua industrial"},
      {"role": "assistant", "content": "¿A qué país lo enviamos?"},
      {"role": "user", "content": "A México, yo me encargo del transporte"}
    ],
    "format": "both"
  }'
```

Deberías recibir:
```json
{
  "success": true,
  "files": {
    "excel": "/api/reports/download/cliente_test_123.xlsx",
    "pdf": "/api/reports/download/cliente_test_123.pdf"
  },
  "data": {
    "cliente": "",
    "producto": "Motor eléctrico de 5HP",
    "transporte": "Cliente",
    ...
  }
}
```

## 🔧 Troubleshooting

### Error: "python3: command not found"

**En macOS:**
```bash
brew install python3
```

**En Linux:**
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

### Error: "No module named 'openpyxl'"

```bash
pip3 install -r reports/requirements.txt
```

### Error en Render: "ModuleNotFoundError"

1. Verifica que el Build Command incluya la instalación de Python
2. Revisa los logs de build en Render
3. Asegúrate de que `reports/requirements.txt` esté en el repositorio

### Los reportes se generan pero no se pueden descargar

1. Verifica que la carpeta `output/reports` tenga permisos de escritura
2. En Render, los archivos se guardan en disco efímero (se borran en redeploy)
3. Para persistencia, considera usar S3 o similar

## 📊 Uso desde el Chat Widget

Para integrar con el frontend, agrega un botón de "Generar Reporte" al final de la conversación:

```javascript
// En ChatWidget.tsx
const generateReport = async () => {
  try {
    const response = await fetch(`${API_URL}/api/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: leadId,
        messages: messages,
        format: 'both'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Descargar Excel
      window.open(`${API_URL}${result.files.excel}`, '_blank');
      
      // Descargar PDF
      window.open(`${API_URL}${result.files.pdf}`, '_blank');
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
  }
};
```

## 🚀 Próximos Pasos

1. ✅ Sistema instalado y funcionando
2. 🔄 Integrar botón en el chat widget
3. 📧 Enviar reportes por email automáticamente
4. ☁️ Guardar reportes en cloud storage (S3, Google Cloud Storage)
5. 📊 Dashboard para ver todos los reportes generados

---

**¿Necesitas ayuda?** hihubtrade@outlook.com
