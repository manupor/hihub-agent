import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía reportes Excel y PDF por email cuando se agenda una llamada
 */
export async function sendReportsEmail({ leadId, userName, userEmail, excelPath, pdfPath, imagePaths = [], extractedData }) {
    try {
        // Leer archivos como attachments
        const attachments = [];
        
        if (fs.existsSync(excelPath)) {
            const excelContent = fs.readFileSync(excelPath);
            attachments.push({
                filename: path.basename(excelPath),
                content: excelContent
            });
        }
        
        if (fs.existsSync(pdfPath)) {
            const pdfContent = fs.readFileSync(pdfPath);
            attachments.push({
                filename: path.basename(pdfPath),
                content: pdfContent
            });
        }

        // Agregar imágenes de la conversación
        if (imagePaths && imagePaths.length > 0) {
            imagePaths.forEach((imagePath, index) => {
                if (fs.existsSync(imagePath)) {
                    const imageContent = fs.readFileSync(imagePath);
                    attachments.push({
                        filename: path.basename(imagePath),
                        content: imageContent
                    });
                }
            });
        }

        // Crear resumen HTML del cliente
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background: linear-gradient(135deg, #F7941D 0%, #E85D04 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { color: #F7941D; border-bottom: 2px solid #F7941D; padding-bottom: 5px; }
                    .info-row { display: flex; margin: 8px 0; }
                    .label { font-weight: bold; width: 180px; color: #666; }
                    .value { flex: 1; }
                    .highlight { background: #fff8f0; padding: 15px; border-left: 4px solid #F7941D; margin: 15px 0; }
                    .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎯 Nueva Llamada Agendada - HiHub Global</h1>
                    <p>Cliente: ${userName || 'N/A'}</p>
                </div>
                
                <div class="content">
                    <div class="highlight">
                        <strong>📞 El cliente ha agendado una llamada de consultoría</strong><br>
                        Los reportes Excel y PDF con toda la información están adjuntos a este email.
                    </div>

                    <div class="section">
                        <h3>👤 Información del Cliente</h3>
                        <div class="info-row">
                            <span class="label">Nombre:</span>
                            <span class="value">${extractedData.cliente || userName || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value">${userEmail || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Teléfono:</span>
                            <span class="value">${extractedData.telefono || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Empresa:</span>
                            <span class="value">${extractedData.empresa || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h3>📦 Producto/Servicio</h3>
                        <div class="info-row">
                            <span class="label">Producto:</span>
                            <span class="value">${extractedData.producto || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Especificaciones:</span>
                            <span class="value">${extractedData.especificaciones || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Cantidad:</span>
                            <span class="value">${extractedData.cantidad || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="section">
                        <h3>🚚 Logística y Ubicación</h3>
                        <div class="info-row">
                            <span class="label">Ubicación Cliente:</span>
                            <span class="value">${extractedData.ubicacion_cliente || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Ubicación Envío:</span>
                            <span class="value">${extractedData.ubicacion_envio || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Transporte:</span>
                            <span class="value"><strong>${extractedData.transporte || 'Por Definir'}</strong></span>
                        </div>
                        ${extractedData.transporte_notas ? `
                        <div class="info-row">
                            <span class="label">Notas Transporte:</span>
                            <span class="value">${extractedData.transporte_notas}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="section">
                        <h3>💰 Detalles Comerciales</h3>
                        <div class="info-row">
                            <span class="label">Estado:</span>
                            <span class="value">${extractedData.estado || 'Consulta Inicial'}</span>
                        </div>
                        ${extractedData.precio_estimado ? `
                        <div class="info-row">
                            <span class="label">Precio Estimado:</span>
                            <span class="value">${extractedData.precio_estimado}</span>
                        </div>
                        ` : ''}
                        ${extractedData.fecha_entrega ? `
                        <div class="info-row">
                            <span class="label">Fecha Entrega:</span>
                            <span class="value">${extractedData.fecha_entrega}</span>
                        </div>
                        ` : ''}
                    </div>

                    ${extractedData.notas ? `
                    <div class="section">
                        <h3>📝 Notas Importantes</h3>
                        <p>${extractedData.notas}</p>
                    </div>
                    ` : ''}

                    <div class="highlight">
                        <strong>📎 Archivos Adjuntos:</strong><br>
                        • Reporte Excel con toda la información<br>
                        • Reporte PDF profesional para compartir
                        ${imagePaths && imagePaths.length > 0 ? `<br>• ${imagePaths.length} imagen(es) enviada(s) por el cliente` : ''}
                    </div>
                </div>

                <div class="footer">
                    <p><strong>HiHub Global Technologies</strong></p>
                    <p>hihubtrade@outlook.com | +86 18958020517</p>
                    <p>Este email fue generado automáticamente por el sistema de chat</p>
                </div>
            </body>
            </html>
        `;

        // Enviar email con attachments
        const result = await resend.emails.send({
            from: 'HiHub Chat <onboarding@resend.dev>',
            to: 'hihubtrade@outlook.com',
            subject: `🎯 Nueva Llamada Agendada: ${userName || 'Cliente'} - ${extractedData.producto || 'Consulta'}`,
            html: htmlContent,
            attachments: attachments
        });

        console.log('✅ Reportes enviados por email:', result);
        return result;

    } catch (error) {
        console.error('❌ Error al enviar reportes por email:', error);
        throw error;
    }
}
