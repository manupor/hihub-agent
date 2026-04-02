# 🚀 Sistema de Generación de Reportes

Sistema automatizado para procesar conversaciones de chat y generar documentos estructurados (Excel y PDF) con información de clientes, productos y detalles comerciales.

## 📋 Características

- ✅ **Extracción con IA**: Usa OpenAI GPT-4o para extraer información estructurada
- 📊 **Generación de Excel**: Crea hojas de cálculo con formato profesional
- 📄 **Generación de PDF**: Genera reportes profesionales con branding HiHub
- 🚚 **Detección de Transporte**: Identifica si el cliente o HiHub maneja el transporte
- 🔄 **API REST**: Endpoints para integración con el chat widget

## 🛠️ Instalación

### 1. Instalar dependencias de Python

```bash
cd /Users/manu/Downloads/hihub-agent/reports
pip3 install -r requirements.txt
```

### 2. Verificar instalación

```bash
python3 -c "import openpyxl, reportlab; print('✅ Dependencias instaladas')"
```

## 🎯 Información Extraída

El sistema extrae automáticamente:

### 👤 Cliente
- Nombre completo
- Teléfono/WhatsApp
- Empresa (si se menciona)

### 📦 Productos/Servicios
- Lista de productos mencionados
- Especificaciones técnicas detalladas
- Cantidades
- Modelos/números de parte

### 📍 Ubicación
- País/ciudad del cliente
- Lugar de envío

### 🚚 Transporte
- **Cliente**: El cliente maneja su propio transporte
- **HiHub**: HiHub maneja el transporte/logística
- **Por Definir**: Aún no se ha definido
- Notas adicionales sobre el transporte

### 📊 Estado
- Consulta Inicial
- Cotización Enviada
- Negociación
- Aprobado
- En Proceso
- Enviado
- Entregado
- Cancelado
- Seguimiento Pendiente

### 💰 Detalles Comerciales
- Precios mencionados
- Fechas de entrega
- Formas de pago
- Condiciones especiales

### 📝 Notas
- Puntos importantes
- Próximos pasos
- Archivos adjuntos mencionados

## 🔌 API Endpoints

### POST /api/reports/generate
Genera reportes Excel y/o PDF de una conversación

**Request Body:**
```json
{
  "leadId": "lead_123",
  "messages": [
    {"role": "user", "content": "Necesito un motor"},
    {"role": "assistant", "content": "¿Qué especificaciones necesitas?"}
  ],
  "format": "both"  // "excel", "pdf", o "both"
}
```

**Response:**
```json
{
  "success": true,
  "files": {
    "excel": "/api/reports/download/cliente_123.xlsx",
    "pdf": "/api/reports/download/cliente_123.pdf"
  },
  "data": {
    "cliente": "Juan Carlos",
    "producto": "Motor eléctrico",
    "transporte": "HiHub",
    ...
  }
}
```

### GET /api/reports/download/:filename
Descarga un archivo generado

### GET /api/reports/list
Lista todos los reportes generados

### DELETE /api/reports/:filename
Elimina un reporte

## 💡 Uso desde el Chat Widget

El chat widget puede generar reportes automáticamente:

```javascript
// Después de completar una conversación
const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: currentLeadId,
    messages: conversationMessages,
    format: 'both'
  })
});

const result = await response.json();
// result.files.excel -> URL para descargar Excel
// result.files.pdf -> URL para descargar PDF
```

## 🎨 Formato de Documentos

### Excel
- Encabezados con color naranja HiHub (#F7941D)
- Columnas auto-ajustadas
- Bordes y formato profesional
- Todas las columnas de información

### PDF
- Logo de HiHub (si está disponible)
- Secciones organizadas:
  - Información del Cliente
  - Productos/Servicios
  - Detalles de Transporte
  - Detalles Comerciales
  - Notas y Próximos Pasos
- Pie de página con contacto
- Marca de confidencialidad

## 🤖 Cómo Funciona la IA

El sistema usa GPT-4o con un prompt especializado que:

1. **Analiza el contexto**: Entiende la conversación completa
2. **Identifica entidades**: Extrae nombres, productos, ubicaciones
3. **Detecta intenciones**: Determina el estado de la negociación
4. **Clasifica transporte**: Identifica quién maneja la logística
5. **Estructura datos**: Organiza todo en formato JSON

### Indicadores de Transporte

**Cliente maneja transporte:**
- "yo me encargo del envío"
- "tengo mi propio transporte"
- "lo recojo yo"
- "mi empresa maneja la logística"

**HiHub maneja transporte:**
- "lo enviamos nosotros"
- "incluye envío"
- "te lo mandamos"
- "envío express"
- "por aéreo/marítimo"

## 📁 Estructura de Archivos

```
reports/
├── ai_extractor.py          # Extractor con IA
├── excel_generator.py       # Generador de Excel
├── pdf_generator.py         # Generador de PDF
├── generate_report.py       # Script principal
├── requirements.txt         # Dependencias Python
└── README.md               # Este archivo

api/
└── reports.js              # API REST endpoints

output/
└── reports/                # Archivos generados
    ├── cliente_123.xlsx
    └── cliente_123.pdf
```

## 🔧 Troubleshooting

### Error: "No module named 'openpyxl'"
```bash
pip3 install openpyxl reportlab
```

### Error: "python3: command not found"
Instala Python 3.8+ desde python.org

### Los reportes no se generan
1. Verifica que las dependencias de Python estén instaladas
2. Revisa que OPENAI_API_KEY esté configurada en .env
3. Verifica los logs del servidor para errores de Python

### La IA no detecta bien el transporte
- Asegúrate de que la conversación menciona claramente quién maneja el envío
- Si no está claro, el sistema marcará "Por Definir" (correcto)
- Puedes editar manualmente el Excel después

## 📞 Soporte

Para problemas o sugerencias:
- Email: hihubtrade@outlook.com
- WhatsApp: +86 18958020517

---

**Desarrollado con ❤️ para HiHub Global Technologies**
