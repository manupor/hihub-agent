import express from 'express';
import { 
    startIntakeSession, 
    processIntakeMessage,
    getSessionAnswersFormatted
} from '../services/intakeConversation.js';
import { generateAuditBrief } from '../services/briefGenerator.js';
import { 
    sendBriefToAuditTeam,
    sendWhatsAppConfirmation,
    sendEmailConfirmation
} from '../services/intakeNotifications.js';
import {
    getIntakeSession,
    getAuditBrief,
    getAllIntakeSessions
} from '../db/intakeDb.js';

const router = express.Router();

/**
 * POST /intake/start
 * Start a new intake session
 */
router.post('/start', async (req, res) => {
    try {
        const { channel, contactInfo } = req.body;

        if (!channel || !contactInfo) {
            return res.status(400).json({ 
                error: 'Missing required fields: channel and contactInfo' 
            });
        }

        if (!['web', 'whatsapp'].includes(channel)) {
            return res.status(400).json({ 
                error: 'Invalid channel. Must be "web" or "whatsapp"' 
            });
        }

        const result = await startIntakeSession(channel, contactInfo);

        res.json({
            success: true,
            sessionId: result.sessionId,
            question: result.question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions
        });

    } catch (error) {
        console.error('Error starting intake session:', error);
        res.status(500).json({ 
            error: 'Failed to start intake session',
            details: error.message 
        });
    }
});

/**
 * POST /intake/message
 * Process a user message and get next question
 */
router.post('/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: sessionId and message' 
            });
        }

        const result = await processIntakeMessage(sessionId, message);

        // If intake is completed, generate brief and send notifications
        if (result.completed) {
            // Get all answers
            const answers = await getSessionAnswersFormatted(sessionId);
            
            // Generate audit brief
            const briefResult = await generateAuditBrief(sessionId, answers);

            // Send notifications
            try {
                // Send email to audit team
                await sendBriefToAuditTeam(sessionId, briefResult, answers);

                // Get session to check contact info
                const session = await getIntakeSession(sessionId);
                
                // Send confirmation to client
                if (session.contact_info) {
                    if (session.channel === 'whatsapp' && session.contact_info.startsWith('+')) {
                        await sendWhatsAppConfirmation(
                            session.contact_info, 
                            answers.company_name || 'tu empresa'
                        );
                    } else if (session.contact_info.includes('@')) {
                        await sendEmailConfirmation(
                            session.contact_info,
                            answers.company_name || 'tu empresa',
                            briefResult.brief.client_summary
                        );
                    }
                }
            } catch (notificationError) {
                console.error('Error sending notifications:', notificationError);
                // Don't fail the request if notifications fail
            }

            return res.json({
                success: true,
                completed: true,
                message: result.message,
                briefGenerated: true,
                briefId: briefResult.brief.id
            });
        }

        // Return next question
        res.json({
            success: true,
            completed: false,
            question: result.question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions,
            isFollowup: result.isFollowup || false
        });

    } catch (error) {
        console.error('Error processing intake message:', error);
        res.status(500).json({ 
            error: 'Failed to process message',
            details: error.message 
        });
    }
});

/**
 * GET /intake/brief/:sessionId
 * Get the generated audit brief for a session
 */
router.get('/brief/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const brief = await getAuditBrief(sessionId);

        if (!brief) {
            return res.status(404).json({ 
                error: 'Brief not found for this session' 
            });
        }

        res.json({
            success: true,
            brief: {
                id: brief.id,
                sessionId: brief.session_id,
                fullText: brief.brief_text,
                clientSummary: brief.client_summary,
                recommendedAuditType: brief.recommended_audit_type,
                requiredDocuments: brief.required_documents,
                preliminaryRisks: brief.preliminary_risks,
                recommendedNextSteps: brief.recommended_next_steps,
                generatedAt: brief.generated_at
            }
        });

    } catch (error) {
        console.error('Error getting brief:', error);
        res.status(500).json({ 
            error: 'Failed to get brief',
            details: error.message 
        });
    }
});

/**
 * GET /intake/sessions
 * Get all intake sessions (for internal dashboard)
 */
router.get('/sessions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const sessions = await getAllIntakeSessions(limit);

        res.json({
            success: true,
            count: sessions.length,
            sessions: sessions.map(session => ({
                id: session.id,
                channel: session.channel,
                contactInfo: session.contact_info,
                status: session.status,
                currentQuestionIndex: session.current_question_index,
                createdAt: session.created_at,
                completedAt: session.completed_at
            }))
        });

    } catch (error) {
        console.error('Error getting sessions:', error);
        res.status(500).json({ 
            error: 'Failed to get sessions',
            details: error.message 
        });
    }
});

/**
 * GET /intake/session/:sessionId
 * Get details of a specific session
 */
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await getIntakeSession(sessionId);

        if (!session) {
            return res.status(404).json({ 
                error: 'Session not found' 
            });
        }

        // Get answers
        const answers = await getSessionAnswersFormatted(sessionId);

        // Get brief if completed
        let brief = null;
        if (session.status === 'completed') {
            brief = await getAuditBrief(sessionId);
        }

        res.json({
            success: true,
            session: {
                id: session.id,
                channel: session.channel,
                contactInfo: session.contact_info,
                status: session.status,
                currentQuestionIndex: session.current_question_index,
                createdAt: session.created_at,
                completedAt: session.completed_at
            },
            answers,
            brief: brief ? {
                id: brief.id,
                fullText: brief.brief_text,
                clientSummary: brief.client_summary,
                recommendedAuditType: brief.recommended_audit_type,
                generatedAt: brief.generated_at
            } : null
        });

    } catch (error) {
        console.error('Error getting session details:', error);
        res.status(500).json({ 
            error: 'Failed to get session details',
            details: error.message 
        });
    }
});

export default router;
