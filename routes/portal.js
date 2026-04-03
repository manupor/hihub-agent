const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory store for magic links (in production, use Redis or database)
const magicLinks = new Map();

// Clean up expired links every hour
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of magicLinks.entries()) {
        if (data.expiresAt < now) {
            magicLinks.delete(token);
        }
    }
}, 60 * 60 * 1000);

/**
 * POST /api/portal/login
 * Send magic link to customer email
 */
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Email válido requerido' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // TODO: Verify email exists in customer database
        // For now, we'll accept any email

        // Generate magic link token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

        // Store token
        magicLinks.set(token, {
            email: normalizedEmail,
            expiresAt,
            createdAt: Date.now()
        });

        // Generate magic link URL
        const magicLinkUrl = `${process.env.FRONTEND_URL || 'https://hihub-omega.vercel.app'}/portal/dashboard?token=${token}`;

        // Send email with magic link
        await resend.emails.send({
            from: 'HiHub Trade <onboarding@resend.dev>',
            to: normalizedEmail,
            subject: '🔐 Tu enlace de acceso al Portal de Clientes',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f8fafc;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background-color: #0f172a; padding: 32px; text-align: center;">
                                            <h1 style="color: #F7941D; font-size: 28px; font-weight: 800; margin: 0;">HiHub Trade</h1>
                                            <p style="color: #94a3b8; font-size: 14px; margin: 8px 0 0;">Portal de Clientes</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 40px 32px;">
                                            <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0 0 16px;">¡Tu enlace de acceso está listo!</h2>
                                            
                                            <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                                                Haz clic en el botón de abajo para acceder a tu portal de clientes y ver el estado de tus pedidos y cotizaciones.
                                            </p>
                                            
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding: 8px 0 24px;">
                                                        <a href="${magicLinkUrl}" style="display: inline-block; background-color: #F7941D; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 700;">
                                                            🔓 Acceder al Portal
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <div style="background-color: #fef3c7; border-left: 4px solid #F7941D; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                                                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                                    ⏱️ <strong>Este enlace expira en 1 hora</strong> por seguridad.
                                                </p>
                                            </div>
                                            
                                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
                                                Si no solicitaste este acceso, puedes ignorar este correo de forma segura.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                                © ${new Date().getFullYear()} HiHub Trade. Todos los derechos reservados.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        });

        console.log(`✅ Magic link sent to ${normalizedEmail}`);

        res.json({
            success: true,
            message: 'Enlace de acceso enviado'
        });

    } catch (error) {
        console.error('❌ Portal login error:', error);
        res.status(500).json({
            error: 'Error al enviar el enlace. Intenta de nuevo.'
        });
    }
});

/**
 * GET /api/portal/verify
 * Verify magic link token
 */
router.get('/verify', (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token requerido' });
        }

        const linkData = magicLinks.get(token);

        if (!linkData) {
            return res.status(401).json({ error: 'Enlace inválido o expirado' });
        }

        if (linkData.expiresAt < Date.now()) {
            magicLinks.delete(token);
            return res.status(401).json({ error: 'Enlace expirado' });
        }

        // Token is valid
        res.json({
            success: true,
            email: linkData.email
        });

    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(500).json({ error: 'Error al verificar el token' });
    }
});

export default router;
