import OpenAI from 'openai';
import dotenv from 'dotenv';
import { saveAuditBrief } from '../db/intakeDb.js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BRIEF_GENERATION_PROMPT = `Eres un experto en auditoría empresarial. Tu tarea es generar un brief de auditoría estructurado y profesional en español basado en la información recopilada del cliente.

Debes generar un documento que incluya:

1. **Resumen del Cliente**: Un párrafo conciso sobre la empresa, su actividad y contexto
2. **Tipo de Auditoría Recomendada**: Qué tipo de auditoría es más apropiada (financiera, operacional, de cumplimiento, de sistemas, etc.) y por qué
3. **Documentos Requeridos**: Lista específica de documentos que el cliente debe preparar
4. **Riesgos Preliminares Detectados**: Áreas de riesgo potencial identificadas basándose en la información proporcionada
5. **Próximos Pasos Recomendados**: Plan de acción claro y secuencial

El brief debe ser profesional, claro y accionable. Usa formato markdown para mejor legibilidad.`;

/**
 * Generate audit brief using GPT-4o
 */
export async function generateAuditBrief(sessionId, answers) {
    try {
        // Format answers for the prompt
        const answersText = `
INFORMACIÓN DEL CLIENTE:

Nombre de la empresa: ${answers.company_name || 'No proporcionado'}
Tipo de empresa: ${answers.company_type || 'No proporcionado'}
Productos/Servicios: ${answers.products_services || 'No proporcionado'}
Países de operación: ${answers.operating_countries || 'No proporcionado'}
Certificaciones actuales: ${answers.certifications || 'Ninguna'}
Volumen mensual de transacciones: ${answers.monthly_volume || 'No proporcionado'}
Razón para la auditoría: ${answers.audit_reason || 'No proporcionado'}
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: BRIEF_GENERATION_PROMPT },
                { role: 'user', content: answersText }
            ],
            temperature: 0.7,
            max_tokens: 2500
        });

        const briefText = completion.choices[0].message.content;

        // Parse the brief to extract structured data
        const structuredBrief = parseBriefContent(briefText);

        // Save to database
        const savedBrief = await saveAuditBrief(sessionId, {
            briefText,
            clientSummary: structuredBrief.clientSummary,
            recommendedAuditType: structuredBrief.recommendedAuditType,
            requiredDocuments: structuredBrief.requiredDocuments,
            preliminaryRisks: structuredBrief.preliminaryRisks,
            recommendedNextSteps: structuredBrief.recommendedNextSteps
        });

        return {
            brief: savedBrief,
            fullText: briefText
        };

    } catch (error) {
        console.error('Error generating audit brief:', error);
        throw error;
    }
}

/**
 * Parse brief content to extract structured sections
 */
function parseBriefContent(briefText) {
    const result = {
        clientSummary: '',
        recommendedAuditType: '',
        requiredDocuments: [],
        preliminaryRisks: [],
        recommendedNextSteps: []
    };

    try {
        // Extract client summary (first section)
        const summaryMatch = briefText.match(/\*\*Resumen del Cliente\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
        if (summaryMatch) {
            result.clientSummary = summaryMatch[1].trim();
        }

        // Extract recommended audit type
        const auditTypeMatch = briefText.match(/\*\*Tipo de Auditor[íi]a Recomendada?\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
        if (auditTypeMatch) {
            result.recommendedAuditType = auditTypeMatch[1].trim();
        }

        // Extract required documents (look for bullet points or numbered lists)
        const docsMatch = briefText.match(/\*\*Documentos Requeridos\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
        if (docsMatch) {
            const docsList = docsMatch[1].match(/[-•*]\s*(.+?)(?=\n|$)/g);
            if (docsList) {
                result.requiredDocuments = docsList.map(item => item.replace(/^[-•*]\s*/, '').trim());
            }
        }

        // Extract preliminary risks
        const risksMatch = briefText.match(/\*\*Riesgos Preliminares Detectados\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
        if (risksMatch) {
            const risksList = risksMatch[1].match(/[-•*]\s*(.+?)(?=\n|$)/g);
            if (risksList) {
                result.preliminaryRisks = risksList.map(item => item.replace(/^[-•*]\s*/, '').trim());
            }
        }

        // Extract next steps
        const stepsMatch = briefText.match(/\*\*Pr[óo]ximos Pasos Recomendados\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
        if (stepsMatch) {
            const stepsList = stepsMatch[1].match(/[-•*\d.]\s*(.+?)(?=\n|$)/g);
            if (stepsList) {
                result.recommendedNextSteps = stepsList.map(item => item.replace(/^[-•*\d.]\s*/, '').trim());
            }
        }

    } catch (parseError) {
        console.error('Error parsing brief content:', parseError);
    }

    return result;
}

export default { generateAuditBrief };
