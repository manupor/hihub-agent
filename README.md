# HiHub Agent - Lead Qualification System

Intelligent lead qualification agent for HiHub Global Technologies. Handles web chat and WhatsApp conversations to collect product requirements before scheduling calls with the sourcing team.

## Features

- **AI-Powered Conversations**: GPT-4o with vision capabilities analyzes product images
- **Bilingual Support**: Automatic language detection (Spanish/English)
- **Web Chat Widget**: Embeddable React component with image upload
- **WhatsApp Integration**: Full WhatsApp Business API support via Twilio
- **Calendar Booking**: Cal.com integration for real-time scheduling
- **Email Reports**: Automated lead reports sent to HiHub team
- **Lead Scoring**: AI-generated qualification scores (1-10)

## Architecture

```
User (WhatsApp/Web)
        ↓
   Express API
        ↓
   GPT-4o Agent
   - Vision analysis
   - Qualification
   - Scheduling trigger
        ↓
   PostgreSQL (Neon)
        ↓
   Cal.com API
   Email (Resend)
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repo>
cd hihub-agent
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your keys
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `TWILIO_ACCOUNT_SID` - Twilio credentials
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `CALCOM_API_KEY` - Cal.com API key
- `CALCOM_EVENT_TYPE_ID`
- `RESEND_API_KEY` - For email notifications
- `DATABASE_URL` - PostgreSQL connection

### 3. Database Setup

```bash
# Using Neon or local PostgreSQL
psql $DATABASE_URL -f db/schema.sql
```

### 4. Start Server

```bash
npm run dev
# Server runs on http://localhost:3000
```

## API Endpoints

### Chat
```http
POST /api/chat
Content-Type: application/json

{
  "leadId": "uuid",
  "message": "I need a tower crane",
  "imageBase64": "base64encoded..."
}
```

### Calendar Slots
```http
GET /api/calendar/slots
```

### Book Appointment
```http
POST /api/calendar/book
{
  "leadId": "uuid",
  "slotDatetime": "2024-01-15T10:00:00Z",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "userPhone": "+1234567890"
}
```

### WhatsApp Webhook
```http
POST /api/whatsapp/webhook
Content-Type: application/x-www-form-urlencoded

# Twilio webhook format
```

## WhatsApp Setup

1. **Twilio Account**: Sign up at twilio.com
2. **WhatsApp Business**: Enable WhatsApp in Twilio Console
3. **Sandbox or Business**: Use sandbox for testing, apply for Business approval for production
4. **Configure Webhook**: Set webhook URL to `https://yourdomain.com/api/whatsapp/webhook`

## Cal.com Setup

1. Create account at cal.com
2. Connect your Google/Outlook calendar
3. Create an event type (30 min sourcing calls)
4. Get API key from Settings > Developer
5. Copy Event Type UUID

## Frontend Widget

### React Component

```jsx
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget />
    </div>
  );
}
```

### Embed Script (for non-React sites)

```html
<script src="https://yourdomain.com/widget.js"></script>
<script>
  HiHubChat.init({
    apiUrl: 'https://yourdomain.com',
    position: 'bottom-right'
  });
</script>
```

## Conversation Flow

1. **Greeting**: Agent introduces itself
2. **Product Inquiry**: Asks what product/equipment user needs
3. **Image Analysis** (optional): GPT-4o vision analyzes uploaded images
4. **Specification Gathering**: One question at a time
   - Product type and specifications
   - Quantity needed
   - Destination country
   - Timeline/budget
5. **Calendar Trigger**: When 6/8 fields collected, shows calendar
6. **Booking**: User selects slot and provides contact info
7. **Confirmation**: Email sent to both user and HiHub team

## Email Report

The lead report email includes:
- Contact information
- Product requirements with technical specs table
- Conversation summary
- Scheduled call details
- Key questions to address on the call
- Qualification score (1-10)

## Development

### Database Migrations

```bash
npm run db:migrate
```

### Testing WhatsApp Locally

Use ngrok for local webhook testing:
```bash
ngrok http 3000
# Use ngrok URL as webhook in Twilio console
```

### Testing Calendar

Mock slots are returned if Cal.com API is not configured.

## Production Deployment

### Environment Variables

Set all required env vars in your hosting platform:
- Vercel, Railway, or Render recommended
- Use Neon for PostgreSQL

### Webhook Security

Configure Twilio webhook signature validation in production.

### Rate Limiting

Consider adding rate limiting middleware for chat endpoints.

## Customization

### System Prompt

Edit `agent/systemPrompt.js` to customize:
- Conversation flow
- Questions asked
- Tone and personality
- Language preferences

### Email Template

Edit `utils/email.js` to customize:
- Email styling
- Report layout
- Logo and branding

### Widget Styling

Edit `components/ChatWidget.css`:
- Colors (default: orange #F7941D)
- Sizes and spacing
- Animations

## Support

For issues or questions:
- HiHub Global Technologies
- info@hihubglobal.com

## License

Proprietary - HiHub Global Technologies
