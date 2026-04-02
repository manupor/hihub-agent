import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { 
    createLead, 
    getLeadById, 
    updateLead,
    createMessage, 
    getMessagesByLeadId,
    createQualification,
    getQualificationByLeadId 
} from './db/queries.js';
import { systemPrompt } from './agent/systemPrompt.js';
import { generateReport } from './agent/generateReport.js';
import { getAvailableSlots, bookAppointment } from './utils/calendly.js';
import { sendLeadReportEmail } from './utils/email.js';
import chatRoutes from './api/chat.js';
import calendarRoutes from './api/calendar.js';
import whatsappRoutes from './api/whatsapp.js';
import intakeRoutes from './api/intake.js';
import reportsRoutes from './api/reports.js';
import { initializeIntakeDatabase } from './db/intakeDb.js';

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// WhatsApp webhook routes
app.use('/api/whatsapp', whatsappRoutes);

// Intake system routes
app.use('/api/intake', intakeRoutes);

// Chat endpoint
app.use('/api/chat', chatRoutes);

// Calendar routes
app.use('/api/calendar', calendarRoutes);

// Reports routes
app.use('/api/reports', reportsRoutes);

// In-memory storage for leads when DB is not available
const inMemoryLeads = new Map();
const inMemoryMessages = new Map();

// ... rest of the code remains the same ...
// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { leadId, message, imageBase64, name, email, phone, language } = req.body;
        const userLanguage = language || 'es'; // Default to Spanish
        
        let lead;
        if (!leadId) {
            // Try database first, fallback to in-memory
            try {
                lead = await createLead('web', phone);
                if (name) await updateLead(lead.id, { name });
                if (email) await updateLead(lead.id, { email });
            } catch (dbError) {
                // Use in-memory storage
                const newLeadId = `lead-${Date.now()}`;
                lead = { id: newLeadId, channel: 'web', phone, name, email };
                inMemoryLeads.set(newLeadId, lead);
                inMemoryMessages.set(newLeadId, []);
            }
        } else {
            try {
                lead = await getLeadById(leadId);
            } catch (dbError) {
                lead = inMemoryLeads.get(leadId);
            }
        }

        // Save user message
        let imageUrl = null;
        if (imageBase64) {
            // In production, upload to S3 or similar
            imageUrl = `data:image/jpeg;base64,${imageBase64}`;
        }
        
        try {
            await createMessage(lead.id, 'user', message, !!imageBase64, imageUrl);
        } catch (dbError) {
            // Use in-memory storage
            if (!inMemoryMessages.has(lead.id)) {
                inMemoryMessages.set(lead.id, []);
            }
            inMemoryMessages.get(lead.id).push({
                role: 'user',
                content: message,
                has_image: !!imageBase64,
                image_url: imageUrl
            });
        }

        // Get conversation history
        let messages;
        try {
            messages = await getMessagesByLeadId(lead.id);
        } catch (dbError) {
            messages = inMemoryMessages.get(lead.id) || [];
        }
        
        const conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // Build OpenAI messages with strong language instruction
        const languageInstruction = userLanguage === 'en' 
            ? '\n\n=== CRITICAL INSTRUCTION ===\nYou MUST respond in ENGLISH ONLY. Every single word of your response must be in English. Do not use any Spanish words. The user is on the English version of the website.\n=== END INSTRUCTION ==='
            : '\n\n=== INSTRUCCIÓN CRÍTICA ===\nDEBES responder SOLO en ESPAÑOL. Cada palabra de tu respuesta debe ser en español. No uses ninguna palabra en inglés. El usuario está en la versión en español del sitio web.\n=== FIN DE INSTRUCCIÓN ===';
        
        const openaiMessages = [
            { role: 'system', content: systemPrompt + languageInstruction },
            ...conversationHistory
        ];

        // Add current message with image if present
        if (imageBase64) {
            openaiMessages.push({
                role: 'user',
                content: [
                    { type: 'text', text: message },
                    { 
                        type: 'image_url', 
                        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                    }
                ]
            });
        }

        // Get AI response
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 2000
        });

        const aiResponse = completion.choices[0].message.content;

        // Save AI response
        try {
            await createMessage(lead.id, 'assistant', aiResponse);
        } catch (dbError) {
            inMemoryMessages.get(lead.id).push({
                role: 'assistant',
                content: aiResponse
            });
        }

        // Check if calendar should be shown
        const showCalendar = aiResponse.includes('[SHOW_CALENDAR]');
        
        let availableSlots = [];
        if (showCalendar) {
            availableSlots = await getAvailableSlots();
            // Remove the trigger from the response
            const cleanResponse = aiResponse.replace('[SHOW_CALENDAR]', '');
            
            return res.json({
                response: cleanResponse,
                showCalendar: true,
                availableSlots,
                leadId: lead.id
            });
        }

        res.json({
            response: aiResponse,
            showCalendar: false,
            leadId: lead.id
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat' });
    }
});

// Get calendar slots
app.get('/api/calendar/slots', async (req, res) => {
    try {
        const slots = await getAvailableSlots();
        res.json({ slots });
    } catch (error) {
        console.error('Calendar slots error:', error);
        res.status(500).json({ error: 'Failed to get calendar slots' });
    }
});

// Book appointment
app.post('/api/calendar/book', async (req, res) => {
    try {
        const { leadId, slotDatetime, userName, userEmail, userPhone } = req.body;
        
        console.log('Booking appointment:', { leadId, userName, userEmail, slotDatetime });
        
        // Update lead with contact info (with fallback)
        try {
            await updateLead(leadId, { 
                name: userName, 
                email: userEmail,
                phone: userPhone,
                status: 'scheduled'
            });
        } catch (dbError) {
            console.log('DB update skipped (using in-memory)');
            // Update in-memory lead
            const lead = inMemoryLeads.get(leadId);
            if (lead) {
                lead.name = userName;
                lead.email = userEmail;
                lead.phone = userPhone;
                lead.status = 'scheduled';
            }
        }

        // Book in Calendly
        const appointment = await bookAppointment({
            email: userEmail,
            name: userName,
            startTime: slotDatetime,
            phone: userPhone
        });

        // Get conversation and generate report
        let messages;
        try {
            messages = await getMessagesByLeadId(leadId);
        } catch (dbError) {
            messages = inMemoryMessages.get(leadId) || [];
        }
        
        const report = await generateReport(messages);

        // Send email to HiHub team
        try {
            await sendLeadReportEmail({
                leadId,
                report,
                appointment,
                messages
            });
            console.log('✅ Lead report email sent');
        } catch (emailError) {
            console.log('Email sending skipped or failed:', emailError.message);
        }

        // Send confirmation email to user
        try {
            await sendConfirmationEmail({
                to: userEmail,
                name: userName,
                appointment
            });
            console.log('✅ Confirmation email sent to user');
        } catch (emailError) {
            console.log('Confirmation email skipped or failed:', emailError.message);
        }

        res.json({
            success: true,
            appointmentDetails: appointment
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`HiHub Agent API running on port ${PORT}`);
    
    // Initialize intake database
    await initializeIntakeDatabase();
});

export default app;
