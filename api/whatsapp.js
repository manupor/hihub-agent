import express from 'express';
import twilio from 'twilio';
import OpenAI from 'openai';
import { 
    createLead, 
    getLeadById, 
    updateLead,
    createMessage, 
    getMessagesByLeadId,
    createAppointment 
} from '../db/queries.js';
import { systemPrompt } from '../agent/systemPrompt.js';
import { generateReport } from '../agent/generateReport.js';
import { getAvailableSlots, bookAppointment } from '../utils/calendly.js';
import { sendLeadReportEmail, sendConfirmationEmail } from '../utils/email.js';

const router = express.Router();

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// In-memory store for WhatsApp sessions (use Redis in production)
const whatsappSessions = new Map();

// Webhook for incoming WhatsApp messages
router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
    if (!twilioClient) {
        return res.status(503).json({ error: 'WhatsApp not configured' });
    }
    
    try {
        const { From, Body, MediaUrl0, NumMedia } = req.body;
        const phoneNumber = From.replace('whatsapp:', '');
        
        console.log('WhatsApp message received:', { phone: phoneNumber, body: Body, hasMedia: NumMedia > 0 });

        // Find or create lead
        let lead = whatsappSessions.get(phoneNumber);
        
        if (!lead) {
            // Check database for existing lead
            // In production, query by phone number
            lead = await createLead('whatsapp', phoneNumber);
            whatsappSessions.set(phoneNumber, lead);
        }

        let messageContent = Body || '';
        let imageBase64 = null;

        // Handle image if present
        if (NumMedia > 0 && MediaUrl0) {
            try {
                // Download image from Twilio
                const imageResponse = await fetch(MediaUrl0, {
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(
                            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                        ).toString('base64')
                    }
                });
                const imageBuffer = await imageResponse.arrayBuffer();
                imageBase64 = Buffer.from(imageBuffer).toString('base64');
                messageContent = '[User sent an image]';
            } catch (error) {
                console.error('Error downloading image:', error);
            }
        }

        // Save user message
        await createMessage(lead.id, 'user', messageContent, !!imageBase64, MediaUrl0 || null);

        // Get conversation history
        const messages = await getMessagesByLeadId(lead.id);
        const conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // Build OpenAI messages
        const openaiMessages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
        ];

        // Add current message with image if present
        if (imageBase64) {
            openaiMessages.push({
                role: 'user',
                content: [
                    { type: 'text', text: Body || 'What do you see in this image?' },
                    { 
                        type: 'image_url', 
                        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                    }
                ]
            });
        }

        // Get AI response
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 2000
        });

        let aiResponse = completion.choices[0].message.content;

        // Save AI response
        await createMessage(lead.id, 'assistant', aiResponse);

        // Check if calendar should be shown
        const showCalendar = aiResponse.includes('[SHOW_CALENDAR]');
        
        if (showCalendar) {
            aiResponse = aiResponse.replace('[SHOW_CALENDAR]', '');
            
            // Get available slots
            const slots = await getAvailableSlots();
            
            // Format slots for WhatsApp
            const slotOptions = slots.slice(0, 5).map((slot, index) => {
                const date = new Date(slot.startTime);
                return `${index + 1}. ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }).join('\n');
            
            aiResponse += `\n\nHere are some available times:\n${slotOptions}\n\nReply with the number (1-5) to book, or visit: ${process.env.APP_URL}/chat?leadId=${lead.id}`;
        }

        // Send WhatsApp response
        await twilioClient.messages.create({
            body: aiResponse,
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phoneNumber}`
        });

        res.status(200).send('OK');

    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        res.status(500).send('Error');
    }
});

// Handle slot selection from WhatsApp
router.post('/select-slot', async (req, res) => {
    try {
        const { phoneNumber, slotIndex, userName, userEmail } = req.body;
        
        const lead = whatsappSessions.get(phoneNumber);
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Get slots
        const slots = await getAvailableSlots();
        const selectedSlot = slots[slotIndex];

        if (!selectedSlot) {
            return res.status(400).json({ error: 'Invalid slot' });
        }

        // Book appointment
        const appointment = await bookAppointment({
            email: userEmail,
            name: userName,
            startTime: selectedSlot.startTime,
            phone: phoneNumber
        });

        // Save to database
        await createAppointment(lead.id, appointment);
        await updateLead(lead.id, { 
            name: userName, 
            email: userEmail,
            status: 'scheduled' 
        });

        // Generate report
        const messages = await getMessagesByLeadId(lead.id);
        const report = await generateReport(messages);

        // Send emails
        await sendLeadReportEmail({ leadId: lead.id, report, appointment, messages });
        await sendConfirmationEmail({ to: userEmail, name: userName, appointment });

        // Send WhatsApp confirmation
        const confirmationMessage = `✅ Your call is scheduled!\n\n📅 Date: ${new Date(appointment.scheduledAt).toLocaleDateString()}\n🕐 Time: ${new Date(appointment.scheduledAt).toLocaleTimeString()}\n🔗 Meeting: ${appointment.meetingLink}\n\nYou'll receive a confirmation email. Our specialist will review your requirements before the call.\n\nThank you for choosing HiHub Global! 🚀`;

        await twilioClient.messages.create({
            body: confirmationMessage,
            from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phoneNumber}`
        });

        res.json({ success: true, appointment });

    } catch (error) {
        console.error('Slot selection error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Status callback for message delivery
router.post('/status', (req, res) => {
    console.log('Message status:', req.body);
    res.status(200).send('OK');
});

export default router;
