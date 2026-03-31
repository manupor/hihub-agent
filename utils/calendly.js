import axios from 'axios';

const CALENDLY_API_BASE = 'https://api.calendly.com/v2';
const CALENDLY_API_KEY = process.env.CALENDLY_API_KEY;
const EVENT_TYPE_ID = process.env.CALENDLY_EVENT_TYPE_ID;

const calendlyClient = axios.create({
    baseURL: CALENDLY_API_BASE,
    headers: {
        'Authorization': `Bearer ${CALENDLY_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// Get available time slots for next 7 days
export const getAvailableSlots = async () => {
    try {
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await calendlyClient.get('/event_type_available_times', {
            params: {
                event_type: `${CALENDLY_API_BASE}/event_types/${EVENT_TYPE_ID}`,
                start_time: startTime,
                end_time: endTime
            }
        });

        return response.data.collection.map(slot => ({
            datetime: slot.scheduling_url,
            startTime: slot.start_time,
            endTime: slot.end_time,
            available: true
        }));
    } catch (error) {
        console.error('Calendly slots error:', error);
        // Return mock slots for development
        return generateMockSlots();
    }
};

// Book an appointment
export const bookAppointment = async ({ email, name, startTime, phone }) => {
    try {
        const response = await calendlyClient.post('/scheduled_events', {
            event_type: `${CALENDLY_API_BASE}/event_types/${EVENT_TYPE_ID}`,
            invitee: {
                email,
                name,
                phone,
                timezone: 'America/Mexico_City'
            },
            start_time: startTime
        });

        return {
            calendlyEventId: response.data.resource.uri,
            scheduledAt: response.data.resource.start_time,
            endTime: response.data.resource.end_time,
            meetingLink: response.data.resource.location?.join_url || 'https://calendly.com/hihub',
            duration: 30
        };
    } catch (error) {
        console.error('Calendly booking error:', error);
        // Return mock data for development
        return {
            calendlyEventId: 'mock-event-id',
            scheduledAt: startTime,
            meetingLink: 'https://meet.google.com/hihub-demo',
            duration: 30
        };
    }
};

// Generate mock slots for development
const generateMockSlots = () => {
    const slots = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        // Add 3 slots per day
        [9, 14, 16].forEach(hour => {
            const slot = new Date(date);
            slot.setHours(hour, 0, 0, 0);
            slots.push({
                datetime: slot.toISOString(),
                startTime: slot.toISOString(),
                endTime: new Date(slot.getTime() + 30 * 60000).toISOString(),
                available: true
            });
        });
    }
    
    return slots;
};

export default { getAvailableSlots, bookAppointment };
