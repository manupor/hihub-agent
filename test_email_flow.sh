#!/bin/bash
# Script de prueba completo: Conversación + Agendamiento + Email

echo "🧪 Probando flujo completo con envío de email..."
echo ""

# Paso 1: Iniciar conversación
echo "📝 Paso 1: Iniciando conversación..."
CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, necesito motores eléctricos de 5HP",
    "language": "es"
  }')

LEAD_ID=$(echo $CHAT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('leadId', 'test_lead'))")
echo "✅ Lead ID: $LEAD_ID"
echo ""

# Paso 2: Continuar conversación
echo "📝 Paso 2: Respondiendo preguntas..."

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"message\": \"Necesito 10 unidades\",
    \"language\": \"es\"
  }" > /dev/null

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"message\": \"Son para bombas de agua industriales\",
    \"language\": \"es\"
  }" > /dev/null

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"message\": \"A México, Monterrey. Yo me encargo del transporte\",
    \"language\": \"es\"
  }" > /dev/null

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"message\": \"Necesito certificación UL\",
    \"language\": \"es\"
  }" > /dev/null

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"message\": \"Entre 500 y 600 USD por motor\",
    \"language\": \"es\"
  }" > /dev/null

echo "✅ Conversación completada"
echo ""

# Paso 3: Obtener slots de calendario
echo "📅 Paso 3: Obteniendo slots de calendario..."
SLOTS=$(curl -s -X GET "http://localhost:3000/api/calendar/slots?leadId=$LEAD_ID")
SLOT_TIME=$(echo $SLOTS | python3 -c "import sys, json; slots = json.load(sys.stdin).get('slots', []); print(slots[0]['datetime'] if slots else '2026-04-05T10:00:00Z')")
echo "✅ Slot seleccionado: $SLOT_TIME"
echo ""

# Paso 4: Agendar llamada (esto dispara el email)
echo "📧 Paso 4: Agendando llamada y generando reportes..."
BOOKING_RESPONSE=$(curl -s -X POST http://localhost:3000/api/calendar/book \
  -H "Content-Type: application/json" \
  -d "{
    \"leadId\": \"$LEAD_ID\",
    \"slotDatetime\": \"$SLOT_TIME\",
    \"userName\": \"Juan Carlos Pérez\",
    \"userEmail\": \"juan.perez@ejemplo.com\",
    \"userPhone\": \"+52 555 1234 5678\"
  }")

echo ""
echo "📊 Respuesta del servidor:"
echo $BOOKING_RESPONSE | python3 -m json.tool
echo ""

# Verificar archivos generados
echo "📁 Verificando archivos generados..."
ls -lh output/reports/ | tail -5
echo ""

echo "✅ PRUEBA COMPLETADA"
echo ""
echo "🔍 Verifica:"
echo "1. Email enviado a hihubtrade@outlook.com"
echo "2. Archivos en output/reports/"
echo "3. Logs del servidor para confirmar envío"
