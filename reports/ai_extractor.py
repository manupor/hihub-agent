"""
AI Extractor - Extrae información estructurada de conversaciones de chat usando OpenAI
"""
import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

EXTRACTION_PROMPT = """Analiza esta conversación de chat entre un cliente y HiHub Global (empresa de sourcing en China).

Extrae la siguiente información en formato JSON:

{
  "cliente": {
    "nombre": "nombre completo del cliente",
    "telefono": "número de teléfono/WhatsApp si se menciona",
    "empresa": "nombre de empresa si se menciona"
  },
  "productos": [
    {
      "nombre": "nombre del producto",
      "especificaciones": "detalles técnicos",
      "cantidad": "cantidad solicitada",
      "modelo": "modelo o número de parte"
    }
  ],
  "ubicacion": {
    "cliente": "país/ciudad del cliente",
    "envio": "destino de envío"
  },
  "transporte": {
    "responsable": "Cliente | HiHub | Por Definir",
    "notas": "detalles sobre el transporte"
  },
  "estado": "Consulta Inicial | Cotización Enviada | Negociación | Aprobado | En Proceso | Enviado | Entregado | Cancelado | Seguimiento Pendiente",
  "detalles_comerciales": {
    "precio_estimado": "precio mencionado",
    "fecha_entrega": "fecha de entrega estimada",
    "forma_pago": "forma de pago mencionada",
    "condiciones": "condiciones especiales"
  },
  "notas": "puntos importantes, próximos pasos",
  "adjuntos": ["archivos mencionados"]
}

REGLAS PARA TRANSPORTE:
- "Cliente": Si el cliente dice que maneja su propio transporte/envío/logística
- "HiHub": Si HiHub ofrece o maneja el envío/transporte
- "Por Definir": Si no se menciona claramente quién maneja el transporte

CONVERSACIÓN:
"""

def extract_info_from_chat(messages):
    """
    Extrae información estructurada de una conversación de chat
    
    Args:
        messages: Lista de mensajes [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        dict: Información extraída en formato estructurado
    """
    # Formatear conversación
    conversation_text = "\n".join([
        f"{'Cliente' if msg['role'] == 'user' else 'Sofía (HiHub)'}: {msg['content']}"
        for msg in messages
    ])
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un experto en extraer información estructurada de conversaciones comerciales."
                },
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT + conversation_text
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        extracted_data = json.loads(response.choices[0].message.content)
        return extracted_data
        
    except Exception as e:
        print(f"Error al extraer información: {e}")
        return None

def format_for_export(extracted_data):
    """
    Formatea los datos extraídos para exportación a Excel/PDF
    
    Args:
        extracted_data: Datos extraídos por la IA
    
    Returns:
        dict: Datos formateados para exportación
    """
    if not extracted_data:
        return None
    
    # Formatear productos como string
    productos_str = "; ".join([
        f"{p.get('nombre', '')} ({p.get('cantidad', 'N/A')})"
        for p in extracted_data.get('productos', [])
    ])
    
    especificaciones_str = "; ".join([
        p.get('especificaciones', '')
        for p in extracted_data.get('productos', [])
        if p.get('especificaciones')
    ])
    
    return {
        "fecha": "",  # Se llenará al generar el documento
        "cliente": extracted_data.get('cliente', {}).get('nombre', ''),
        "telefono": extracted_data.get('cliente', {}).get('telefono', ''),
        "empresa": extracted_data.get('cliente', {}).get('empresa', ''),
        "producto": productos_str,
        "especificaciones": especificaciones_str,
        "cantidad": ", ".join([p.get('cantidad', '') for p in extracted_data.get('productos', [])]),
        "ubicacion_cliente": extracted_data.get('ubicacion', {}).get('cliente', ''),
        "ubicacion_envio": extracted_data.get('ubicacion', {}).get('envio', ''),
        "transporte": extracted_data.get('transporte', {}).get('responsable', 'Por Definir'),
        "transporte_notas": extracted_data.get('transporte', {}).get('notas', ''),
        "estado": extracted_data.get('estado', 'Consulta Inicial'),
        "precio_estimado": extracted_data.get('detalles_comerciales', {}).get('precio_estimado', ''),
        "fecha_entrega": extracted_data.get('detalles_comerciales', {}).get('fecha_entrega', ''),
        "forma_pago": extracted_data.get('detalles_comerciales', {}).get('forma_pago', ''),
        "notas": extracted_data.get('notas', ''),
        "adjuntos": ", ".join(extracted_data.get('adjuntos', []))
    }
