#!/bin/bash
# Script de prueba para el sistema de reportes

echo "🧪 Probando sistema de generación de reportes..."
echo ""

# Crear conversación de prueba
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test_123",
    "messages": [
      {"role": "assistant", "content": "¡Hola! Soy Sofía, asistente de sourcing en HiHub Global. ¿Qué equipo o producto estás buscando importar desde China?"},
      {"role": "user", "content": "Hola, necesito motores eléctricos de 5HP"},
      {"role": "assistant", "content": "Perfecto, ¿cuántos motores necesitas?"},
      {"role": "user", "content": "Necesito 10 unidades"},
      {"role": "assistant", "content": "Excelente. ¿Para qué aplicación específica los necesitas?"},
      {"role": "user", "content": "Son para bombas de agua industriales"},
      {"role": "assistant", "content": "Entendido. ¿A qué país los enviamos?"},
      {"role": "user", "content": "A México, Monterrey. Yo me encargo del transporte desde el puerto"},
      {"role": "assistant", "content": "Perfecto. ¿Necesitas alguna certificación específica como CE, UL o similar?"},
      {"role": "user", "content": "Sí, necesito certificación UL"},
      {"role": "assistant", "content": "¿Cuál es tu presupuesto objetivo por unidad?"},
      {"role": "user", "content": "Entre $500 y $600 USD por motor"}
    ],
    "format": "both"
  }' | python3 -m json.tool

echo ""
echo "✅ Si ves archivos Excel y PDF generados, el sistema funciona correctamente"
echo "📁 Revisa la carpeta: output/reports/"
