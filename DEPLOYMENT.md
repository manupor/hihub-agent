# Despliegue en Vercel

## Pasos para publicar HiHub Agent en Vercel

### 1. Preparar el repositorio en GitHub

```bash
cd /Users/manu/Downloads/hihub-agent
git init
git add .
git commit -m "Initial commit: HiHub Agent"
git branch -M main
git remote add origin https://github.com/tu-usuario/hihub-agent.git
git push -u origin main
```

### 2. Importar a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Node.js

### 3. Variables de entorno en Vercel

En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

#### ✅ OBLIGATORIAS (mínimo para funcionar):

```
OPENAI_API_KEY=your_openai_api_key_here

CLIENT_EMAIL=info@hihubglobal.com

CLIENT_NAME=HiHub Global Team

APP_URL=https://tu-proyecto.vercel.app
```

**Nota:** Después del primer despliegue, actualiza `APP_URL` con tu URL real de Vercel.

#### 📧 OPCIONALES - Email (Resend):

```
RESEND_API_KEY=re_tu_api_key_aqui
```

Para obtener tu API key de Resend:
1. Regístrate en [resend.com](https://resend.com)
2. Ve a API Keys y crea una nueva
3. Verifica tu dominio de email

#### 📱 OPCIONALES - WhatsApp (Twilio):

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_PHONE_NUMBER_SID=PNxxxxxxxxxxxxx
```

Para obtener credenciales de Twilio:
1. Regístrate en [twilio.com](https://twilio.com)
2. Ve a Console → Account Info para obtener SID y Auth Token
3. Configura WhatsApp Business API

#### 📅 OPCIONALES - Calendario (Cal.com):

```
CALCOM_API_KEY=cal_live_xxxxxxxxxxxxx
CALCOM_EVENT_TYPE_ID=123456
```

Para obtener credenciales de Cal.com:
1. Regístrate en [cal.com](https://cal.com)
2. Ve a Settings → Developer → API Keys
3. Crea un evento y obtén su ID

#### 🗄️ OPCIONALES - Base de datos (Vercel Postgres):

```
DATABASE_URL=postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb
```

Para configurar Vercel Postgres:
1. En tu proyecto de Vercel, ve a Storage
2. Crea una nueva base de datos Postgres
3. Vercel agregará automáticamente `DATABASE_URL`
4. Ejecuta el schema: `psql $DATABASE_URL < db/schema.sql`

### 4. Actualizar la URL del widget en el frontend

Después del despliegue, actualiza el archivo del widget:

**En `/Users/manu/Downloads/transhub-transport-logistics-reactjs-template-2026-03-18-19-16-07-utc/transhub/src/components/ChatWidget.tsx`:**

```typescript
// Cambiar de:
const API_URL = 'http://localhost:3000';

// A:
const API_URL = 'https://tu-proyecto.vercel.app';
```

### 5. Desplegar

Una vez configuradas las variables de entorno, haz clic en **Deploy**.

Vercel construirá y desplegará tu aplicación automáticamente.

### 6. Verificar el despliegue

1. Visita `https://tu-proyecto.vercel.app`
2. Deberías ver la página de bienvenida
3. Prueba el endpoint: `https://tu-proyecto.vercel.app/health`
4. Prueba el widget de chat en tu sitio web

## Resumen de lo mínimo necesario

Para un despliegue básico funcional, solo necesitas:

1. ✅ `OPENAI_API_KEY` - Para el chat con IA
2. ✅ `CLIENT_EMAIL` - Email de tu empresa
3. ✅ `CLIENT_NAME` - Nombre de tu empresa
4. ✅ `APP_URL` - URL de Vercel (actualizar después del primer deploy)

Todo lo demás es opcional y puedes agregarlo después cuando lo necesites.

## Troubleshooting

### Error: "Missing API key"
- Verifica que `OPENAI_API_KEY` esté configurada en Vercel
- Asegúrate de hacer redeploy después de agregar variables

### Error: "Database connection failed"
- Es normal si no tienes PostgreSQL configurado
- El sistema usará almacenamiento en memoria como fallback

### El widget no se conecta
- Verifica que `APP_URL` en ChatWidget.tsx apunte a tu URL de Vercel
- Verifica que CORS esté habilitado (ya está configurado en server.js)

### Emails no se envían
- Configura `RESEND_API_KEY` en Vercel
- Los emails se loguean en consola si no está configurado
