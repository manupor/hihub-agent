# Intake System - Conversational Audit Agent

## Overview

The intake system is a conversational agent that collects information from potential audit clients through web chat or WhatsApp, then automatically generates a structured audit brief using GPT-4o.

## Features

- **Session-based conversation flow** with 7 key questions
- **Dynamic follow-up questions** when answers are vague
- **Automatic brief generation** using GPT-4o
- **Email notifications** to audit team via Resend
- **WhatsApp confirmations** to clients via Twilio
- **PostgreSQL storage** for all sessions, answers, and briefs

## Database Setup

1. Run the schema creation script:
```bash
psql $DATABASE_URL -f db/intake-schema.sql
```

This creates three tables:
- `intake_sessions` - Tracks each conversation session
- `intake_answers` - Stores all Q&A pairs
- `audit_briefs` - Stores generated briefs with structured data

## API Endpoints

### 1. Start New Session
```bash
POST /api/intake/start
Content-Type: application/json

{
  "channel": "web",  // or "whatsapp"
  "contactInfo": "user@example.com"  // or phone with +country code
}
```

Response:
```json
{
  "success": true,
  "sessionId": "uuid",
  "question": "¡Hola! Soy el asistente de auditoría...",
  "questionIndex": 0,
  "totalQuestions": 7
}
```

### 2. Process Message
```bash
POST /api/intake/message
Content-Type: application/json

{
  "sessionId": "uuid",
  "message": "Mi empresa se llama TechCorp"
}
```

Response (next question):
```json
{
  "success": true,
  "completed": false,
  "question": "¿Qué tipo de empresa es?",
  "questionIndex": 1,
  "totalQuestions": 7,
  "isFollowup": false
}
```

Response (completed):
```json
{
  "success": true,
  "completed": true,
  "message": "Perfecto, he recopilado toda la información...",
  "briefGenerated": true,
  "briefId": "uuid"
}
```

### 3. Get Brief
```bash
GET /api/intake/brief/:sessionId
```

Response:
```json
{
  "success": true,
  "brief": {
    "id": "uuid",
    "sessionId": "uuid",
    "fullText": "# Brief de Auditoría...",
    "clientSummary": "...",
    "recommendedAuditType": "...",
    "requiredDocuments": [...],
    "preliminaryRisks": [...],
    "recommendedNextSteps": [...],
    "generatedAt": "2024-03-30T..."
  }
}
```

### 4. List All Sessions
```bash
GET /api/intake/sessions?limit=50
```

Response:
```json
{
  "success": true,
  "count": 10,
  "sessions": [
    {
      "id": "uuid",
      "channel": "web",
      "contactInfo": "user@example.com",
      "status": "completed",
      "currentQuestionIndex": 7,
      "createdAt": "2024-03-30T...",
      "completedAt": "2024-03-30T..."
    }
  ]
}
```

### 5. Get Session Details
```bash
GET /api/intake/session/:sessionId
```

Response:
```json
{
  "success": true,
  "session": {...},
  "answers": {
    "company_name": "TechCorp",
    "company_type": "PYME",
    "products_services": "...",
    "operating_countries": "...",
    "certifications": "...",
    "monthly_volume": "...",
    "audit_reason": "..."
  },
  "brief": {...}
}
```

## Conversation Flow

The system asks these questions in order:

1. **Company Name** - "¿Cuál es el nombre de tu empresa?"
2. **Company Type** - "¿Qué tipo de empresa es? (startup, PYME, empresa grande)"
3. **Products/Services** - "¿Qué productos o servicios ofrece tu empresa?"
4. **Operating Countries** - "¿En qué países opera tu empresa actualmente?"
5. **Certifications** - "¿Qué certificaciones tiene actualmente tu empresa?"
6. **Monthly Volume** - "¿Cuál es el volumen estimado de transacciones mensuales?"
7. **Audit Reason** - "¿Por qué necesitas una auditoría en este momento?"

Each question has validation logic that triggers follow-up questions if the answer is too vague.

## Brief Generation

When all questions are answered, the system:

1. Calls GPT-4o with all collected answers
2. Generates a structured brief in Spanish with:
   - Client summary
   - Recommended audit type
   - Required documents list
   - Preliminary risks detected
   - Recommended next steps
3. Saves to database with parsed structured data
4. Sends email to audit team
5. Sends confirmation to client (WhatsApp or email)

## Environment Variables

Required variables in `.env`:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=HiHub Intake <intake@hihubglobal.com>
AUDIT_TEAM_EMAIL=audit@hihubglobal.com

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+14155238886
```

## Testing

### Start a session:
```bash
curl -X POST http://localhost:3000/api/intake/start \
  -H "Content-Type: application/json" \
  -d '{"channel":"web","contactInfo":"test@example.com"}'
```

### Send a message:
```bash
curl -X POST http://localhost:3000/api/intake/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"YOUR_SESSION_ID","message":"TechCorp SA"}'
```

### Get the brief:
```bash
curl http://localhost:3000/api/intake/brief/YOUR_SESSION_ID
```

## Integration with Web Chat

To integrate with your existing web chat widget:

```javascript
// Start intake session
const response = await fetch('/api/intake/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channel: 'web',
    contactInfo: userEmail
  })
});

const { sessionId, question } = await response.json();

// Display first question to user
displayMessage(question);

// When user responds
const messageResponse = await fetch('/api/intake/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    message: userInput
  })
});

const result = await messageResponse.json();

if (result.completed) {
  displayMessage(result.message);
  // Show success state
} else {
  displayMessage(result.question);
  // Continue conversation
}
```

## Files Structure

```
hihub-agent/
├── db/
│   ├── intake-schema.sql       # Database schema
│   └── intakeDb.js            # Database queries
├── services/
│   ├── intakeConversation.js  # Conversation flow logic
│   ├── briefGenerator.js      # GPT-4o brief generation
│   └── intakeNotifications.js # Email & WhatsApp notifications
├── api/
│   └── intake.js              # API endpoints
└── server.js                  # Main server (updated)
```

## Notes

- All conversations are in Spanish by default
- Follow-up questions are triggered automatically for vague answers
- Brief generation happens automatically when all questions are answered
- Notifications are sent asynchronously (won't fail the request if they error)
- Sessions can be in 3 states: `active`, `completed`, `abandoned`
