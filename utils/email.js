import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendLeadReportEmail = async ({ leadId, report, appointment, messages }) => {
    if (!resend) {
        console.log('📧 Email not configured. Lead report would be sent to:', process.env.CLIENT_EMAIL);
        console.log('Report:', JSON.stringify(report, null, 2));
        return { id: 'mock-email-id' };
    }
    
    try {
        const clientEmail = process.env.CLIENT_EMAIL;
        const clientName = process.env.CLIENT_NAME;
        
        const subject = `🔔 New Lead Qualified — ${report.productType || 'Product Inquiry'} | ${new Date(appointment.scheduledAt).toLocaleString()}`;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F7941D 0%, #E85D04 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #1a1a2e; border-bottom: 2px solid #F7941D; padding-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { background: white; padding: 15px; border-radius: 6px; }
        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .value { color: #1a1a2e; font-size: 14px; margin-top: 5px; }
        .specs-table { width: 100%; background: white; border-collapse: collapse; }
        .specs-table th, .specs-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .specs-table th { background: #F7941D; color: white; }
        .cta-button { display: inline-block; background: #F7941D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .score { display: inline-block; background: ${report.qualificationScore >= 7 ? '#28a745' : report.qualificationScore >= 5 ? '#ffc107' : '#dc3545'}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
        .urgency { display: inline-block; background: ${report.urgencyLevel === 'high' ? '#dc3545' : report.urgencyLevel === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; }
        .meeting-box { background: #e8f4f8; border-left: 4px solid #F7941D; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Qualified Lead</h1>
            <p style="color: white; margin: 10px 0 0 0;">HiHub Global Technologies</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="score">Score: ${report.qualificationScore}/10</div>
                    <div class="urgency">${report.urgencyLevel.toUpperCase()} PRIORITY</div>
                </div>
            </div>

            <div class="section">
                <h2>Contact Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">Name</div>
                        <div class="value">${report.contactName || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Email</div>
                        <div class="value">${report.contactEmail || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Phone</div>
                        <div class="value">${report.contactPhone || 'Not provided'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Destination</div>
                        <div class="value">${report.destinationCountry || 'Not specified'}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Product Requirements</h2>
                <div class="info-item" style="margin-bottom: 15px;">
                    <div class="label">Product Type</div>
                    <div class="value" style="font-size: 18px; font-weight: bold;">${report.productType || 'Not specified'}</div>
                </div>
                <p>${report.productDescription || 'No description provided'}</p>
                
                <h3 style="margin-top: 20px;">Technical Specifications</h3>
                <table class="specs-table">
                    <tr>
                        <th>Specification</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Capacity</td>
                        <td>${report.technicalSpecs?.capacity || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td>Dimensions</td>
                        <td>${report.technicalSpecs?.dimensions || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td>Power</td>
                        <td>${report.technicalSpecs?.power || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td>Material</td>
                        <td>${report.technicalSpecs?.material || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td>Certifications</td>
                        <td>${report.technicalSpecs?.certifications || 'Not specified'}</td>
                    </tr>
                </table>
                
                <div class="info-grid" style="margin-top: 15px;">
                    <div class="info-item">
                        <div class="label">Quantity Needed</div>
                        <div class="value">${report.quantity || 'Not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Timeline</div>
                        <div class="value">${report.timeline || 'Not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Budget Range</div>
                        <div class="value">${report.budget || 'Not specified'}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Images Provided</div>
                        <div class="value">${report.imagesProvided ? 'Yes ✓' : 'No'}</div>
                    </div>
                </div>
            </div>

            <div class="meeting-box">
                <h2 style="margin-top: 0;">📅 Scheduled Call</h2>
                <p><strong>Date & Time:</strong> ${new Date(appointment.scheduledAt).toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}</p>
                <p><strong>Duration:</strong> ${appointment.duration || 30} minutes</p>
                <p><strong>Meeting Link:</strong> <a href="${appointment.meetingLink}">${appointment.meetingLink}</a></p>
            </div>

            <div class="section">
                <h2>Conversation Summary</h2>
                <p>${report.summary || 'No summary available'}</p>
            </div>

            <div class="section">
                <h2>Key Questions to Address</h2>
                <ul>
                    ${report.keyQuestions?.map(q => `<li>${q}</li>`).join('') || '<li>No specific questions identified</li>'}
                </ul>
            </div>

            <div class="section">
                <h2>Recommended Action</h2>
                <p>${report.recommendedAction || 'Review and prepare quote'}</p>
            </div>

            <a href="${process.env.APP_URL}/admin/leads/${leadId}" class="cta-button">View Full Conversation →</a>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                <p>HiHub Global Technologies | info@hihubglobal.com | +52 55 1234 5678</p>
                <p>This lead was qualified by Sofia, the AI Sourcing Assistant</p>
            </div>
        </div>
    </div>
</body>
</html>`;

        const result = await resend.emails.send({
            from: 'HiHub Agent <agent@hihubglobal.com>',
            to: clientEmail,
            subject,
            html
        });

        console.log('Email sent:', result);
        return result;

    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
};

export const sendConfirmationEmail = async ({ to, name, appointment }) => {
    if (!resend) {
        console.log('📧 Confirmation email not sent (Email not configured)');
        console.log(`Would send to: ${to}, Name: ${name}`);
        return { id: 'mock-confirmation-email-id' };
    }
    
    try {
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F7941D;">Your Call is Scheduled!</h2>
            <p>Hi ${name},</p>
            <p>Your sourcing consultation with HiHub Global is confirmed.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date:</strong> ${new Date(appointment.scheduledAt).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${new Date(appointment.scheduledAt).toLocaleTimeString()}</p>
                <p><strong>Meeting Link:</strong> <a href="${appointment.meetingLink}">Join Call</a></p>
            </div>
            <p>Our sourcing specialist will review your requirements before the call.</p>
            <p>Best regards,<br>HiHub Global Team</p>
        </div>`;

        await resend.emails.send({
            from: 'HiHub Global <info@hihubglobal.com>',
            to,
            subject: 'Your HiHub Sourcing Call is Confirmed',
            html
        });
    } catch (error) {
        console.error('Confirmation email error:', error);
    }
};

export default { sendLeadReportEmail, sendConfirmationEmail };
