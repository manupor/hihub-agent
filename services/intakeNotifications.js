import { Resend } from 'resend';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send audit brief email to the audit team
 */
export async function sendBriefToAuditTeam(sessionId, briefData, answers) {
    try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #020e28; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        .section h3 { color: #020e28; margin-top: 0; }
        .brief-content { background: white; padding: 20px; border-left: 4px solid #FFC107; }
        ul { padding-left: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Nuevo Brief de Auditoría Generado</h1>
            <p>Session ID: ${sessionId}</p>
        </div>

        <div class="section">
            <h3>📋 Información del Cliente</h3>
            <ul>
                <li><strong>Empresa:</strong> ${answers.company_name || 'N/A'}</li>
                <li><strong>Tipo:</strong> ${answers.company_type || 'N/A'}</li>
                <li><strong>Productos/Servicios:</strong> ${answers.products_services || 'N/A'}</li>
                <li><strong>Países:</strong> ${answers.operating_countries || 'N/A'}</li>
                <li><strong>Certificaciones:</strong> ${answers.certifications || 'Ninguna'}</li>
                <li><strong>Volumen Mensual:</strong> ${answers.monthly_volume || 'N/A'}</li>
                <li><strong>Razón:</strong> ${answers.audit_reason || 'N/A'}</li>
            </ul>
        </div>

        <div class="section">
            <h3>📄 Brief de Auditoría Completo</h3>
            <div class="brief-content">
                ${briefData.fullText.replace(/\n/g, '<br>')}
            </div>
        </div>

        <div class="footer">
            <p>Este brief fue generado automáticamente por el sistema de intake de HiHub Global.</p>
            <p>Para ver más detalles, accede al dashboard interno.</p>
        </div>
    </div>
</body>
</html>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'HiHub Intake <intake@hihubglobal.com>',
            to: process.env.AUDIT_TEAM_EMAIL || 'audit@hihubglobal.com',
            subject: `🔍 Nuevo Brief de Auditoría - ${answers.company_name || 'Cliente'}`,
            html: emailHtml
        });

        if (error) {
            console.error('Error sending email to audit team:', error);
            throw error;
        }

        console.log('✅ Brief email sent to audit team:', data);
        return data;

    } catch (error) {
        console.error('Failed to send brief to audit team:', error);
        throw error;
    }
}

/**
 * Send WhatsApp confirmation to client
 */
export async function sendWhatsAppConfirmation(phoneNumber, companyName) {
    try {
        if (!phoneNumber || !phoneNumber.startsWith('+')) {
            throw new Error('Invalid phone number format. Must include country code with +');
        }

        const message = await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phoneNumber}`,
            body: `✅ Hola desde HiHub Global!\n\nHemos recibido toda la información de ${companyName} y estamos generando tu brief de auditoría personalizado.\n\nRecibirás un correo con los detalles completos en breve.\n\nGracias por confiar en nosotros. 🚀`
        });

        console.log('✅ WhatsApp confirmation sent:', message.sid);
        return message;

    } catch (error) {
        console.error('Failed to send WhatsApp confirmation:', error);
        throw error;
    }
}

/**
 * Send email confirmation to client
 */
export async function sendEmailConfirmation(email, companyName, briefSummary) {
    try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #020e28; color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .content { padding: 30px 20px; }
        .highlight { background: #FFF9E6; padding: 15px; border-left: 4px solid #FFC107; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Información Recibida</h1>
        </div>
        
        <div class="content">
            <p>Hola desde <strong>HiHub Global</strong>,</p>
            
            <p>Hemos recibido exitosamente toda la información de <strong>${companyName}</strong>.</p>
            
            <div class="highlight">
                <h3>📋 Próximos Pasos:</h3>
                <ol>
                    <li>Nuestro equipo de auditoría revisará tu brief personalizado</li>
                    <li>Te contactaremos en las próximas 24-48 horas</li>
                    <li>Coordinaremos una reunión para discutir los detalles</li>
                </ol>
            </div>
            
            <p>${briefSummary || 'Estamos preparando un análisis detallado de tus necesidades de auditoría.'}</p>
            
            <p>Si tienes alguna pregunta urgente, no dudes en contactarnos.</p>
            
            <p>Saludos,<br><strong>Equipo de HiHub Global</strong></p>
        </div>
        
        <div class="footer">
            <p>HiHub Global Technologies Limited<br>
            Hong Kong | TAX: 73367194-000<br>
            info@hihubglobal.com</p>
        </div>
    </div>
</body>
</html>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'HiHub Global <info@hihubglobal.com>',
            to: email,
            subject: `✅ Información Recibida - ${companyName}`,
            html: emailHtml
        });

        if (error) {
            console.error('Error sending confirmation email:', error);
            throw error;
        }

        console.log('✅ Confirmation email sent to client:', data);
        return data;

    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        throw error;
    }
}

export default {
    sendBriefToAuditTeam,
    sendWhatsAppConfirmation,
    sendEmailConfirmation
};
