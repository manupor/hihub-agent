import OpenAI from 'openai';
import dotenv from 'dotenv';
import {
    createIntakeSession,
    getIntakeSession,
    updateIntakeSession,
    saveIntakeAnswer,
    getIntakeAnswers
} from '../db/intakeDb.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the intake questions in order
const INTAKE_QUESTIONS = [
    {
        key: 'company_name',
        text: '¡Hola! Soy el asistente de auditoría de HiHub. Para comenzar, ¿cuál es el nombre de tu empresa?',
        followupCheck: (answer) => answer.length < 3,
        followup: 'Por favor, proporciona el nombre completo de tu empresa.'
    },
    {
        key: 'company_type',
        text: '¿Qué tipo de empresa es? (startup, PYME, empresa grande)',
        followupCheck: (answer) => {
            const normalized = answer.toLowerCase();
            return !normalized.includes('startup') && 
                   !normalized.includes('pyme') && 
                   !normalized.includes('pequeña') &&
                   !normalized.includes('mediana') &&
                   !normalized.includes('grande') &&
                   !normalized.includes('enterprise');
        },
        followup: 'Por favor especifica si es una startup, PYME (pequeña y mediana empresa), o empresa grande.'
    },
    {
        key: 'products_services',
        text: '¿Qué productos o servicios ofrece tu empresa?',
        followupCheck: (answer) => answer.length < 10,
        followup: 'Por favor, describe con más detalle los productos o servicios que ofreces.'
    },
    {
        key: 'operating_countries',
        text: '¿En qué países opera tu empresa actualmente?',
        followupCheck: (answer) => answer.length < 3,
        followup: 'Por favor, menciona los países donde opera tu empresa.'
    },
    {
        key: 'certifications',
        text: '¿Qué certificaciones tiene actualmente tu empresa? (ISO, SOC2, etc. - si no tiene ninguna, indica "ninguna")',
        followupCheck: (answer) => false, // No followup needed
        followup: null
    },
    {
        key: 'monthly_volume',
        text: '¿Cuál es el volumen estimado de transacciones mensuales de tu empresa?',
        followupCheck: (answer) => {
            const hasNumber = /\d/.test(answer);
            return !hasNumber && !answer.toLowerCase().includes('no') && !answer.toLowerCase().includes('ninguna');
        },
        followup: 'Por favor, proporciona una estimación aproximada del volumen de transacciones mensuales (puede ser en cantidad o valor monetario).'
    },
    {
        key: 'audit_reason',
        text: '¿Por qué necesitas una auditoría en este momento?',
        followupCheck: (answer) => answer.length < 15,
        followup: 'Por favor, explica con más detalle la razón por la que necesitas la auditoría.'
    }
];

/**
 * Start a new intake session
 */
export async function startIntakeSession(channel, contactInfo) {
    try {
        const session = await createIntakeSession(channel, contactInfo);
        const firstQuestion = INTAKE_QUESTIONS[0];
        
        return {
            sessionId: session.id,
            question: firstQuestion.text,
            questionKey: firstQuestion.key,
            questionIndex: 0,
            totalQuestions: INTAKE_QUESTIONS.length
        };
    } catch (error) {
        console.error('Error starting intake session:', error);
        throw error;
    }
}

/**
 * Process a user message and return the next question or completion status
 */
export async function processIntakeMessage(sessionId, userMessage) {
    try {
        const session = await getIntakeSession(sessionId);
        
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.status !== 'active') {
            return {
                completed: true,
                message: 'Esta sesión ya ha sido completada. Gracias por tu información.'
            };
        }

        const currentQuestionIndex = session.current_question_index;
        const currentQuestion = INTAKE_QUESTIONS[currentQuestionIndex];

        // Save the answer
        await saveIntakeAnswer(
            sessionId,
            currentQuestion.key,
            currentQuestion.text,
            userMessage,
            false
        );

        // Check if we need a followup
        if (currentQuestion.followupCheck && currentQuestion.followupCheck(userMessage)) {
            return {
                sessionId,
                question: currentQuestion.followup,
                questionKey: currentQuestion.key,
                questionIndex: currentQuestionIndex,
                totalQuestions: INTAKE_QUESTIONS.length,
                isFollowup: true
            };
        }

        // Move to next question
        const nextQuestionIndex = currentQuestionIndex + 1;

        if (nextQuestionIndex >= INTAKE_QUESTIONS.length) {
            // All questions answered - mark as completed
            await updateIntakeSession(sessionId, { 
                status: 'completed',
                currentQuestionIndex: nextQuestionIndex
            });

            return {
                sessionId,
                completed: true,
                message: 'Perfecto, he recopilado toda la información necesaria. Estoy generando tu brief de auditoría personalizado. Te llegará un correo con los detalles en breve.'
            };
        }

        // Update session with next question index
        await updateIntakeSession(sessionId, { 
            currentQuestionIndex: nextQuestionIndex 
        });

        const nextQuestion = INTAKE_QUESTIONS[nextQuestionIndex];

        return {
            sessionId,
            question: nextQuestion.text,
            questionKey: nextQuestion.key,
            questionIndex: nextQuestionIndex,
            totalQuestions: INTAKE_QUESTIONS.length
        };

    } catch (error) {
        console.error('Error processing intake message:', error);
        throw error;
    }
}

/**
 * Get all answers for a session formatted for brief generation
 */
export async function getSessionAnswersFormatted(sessionId) {
    try {
        const answers = await getIntakeAnswers(sessionId);
        
        const formatted = {};
        answers.forEach(answer => {
            if (!formatted[answer.question_key]) {
                formatted[answer.question_key] = answer.answer;
            }
        });

        return formatted;
    } catch (error) {
        console.error('Error getting formatted answers:', error);
        throw error;
    }
}
