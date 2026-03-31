import OpenAI from 'openai';

export const generateReport = async (conversationHistory) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    const prompt = `Given this conversation between a lead and our sourcing assistant, extract and format the information as structured JSON.

Conversation:
${JSON.stringify(conversationHistory, null, 2)}

Extract and format as JSON with this exact structure:
{
  "contactName": string,
  "contactPhone": string,
  "contactEmail": string,
  "productType": string,
  "productDescription": string,
  "technicalSpecs": {
    "capacity": string,
    "dimensions": string,
    "power": string,
    "material": string,
    "certifications": string
  },
  "quantity": string,
  "destinationCountry": string,
  "timeline": string,
  "budget": string,
  "urgencyLevel": "low" | "medium" | "high",
  "qualificationScore": number (1-10),
  "recommendedAction": string,
  "keyQuestions": string[] (questions the sourcing team should ask on the call),
  "imagesProvided": boolean,
  "summary": string (2-3 sentence briefing for the call)
}

Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a data extraction specialist. Extract lead qualification data accurately from conversations.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
    });

    try {
        const content = response.choices[0].message.content;
        // Clean up any markdown formatting
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error parsing report JSON:', error);
        return null;
    }
};

export const extractSpecsFromImage = async (imageBase64, description = '') => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Analyze this product/equipment image and extract all visible technical specifications. 
                        
${description ? `Additional context: ${description}` : ''}

Identify:
- Equipment/product type
- Brand name (if visible)
- Model number (if visible)
- Approximate dimensions or size
- Capacity or power rating (if visible)
- Any technical labels, stickers, or markings
- Material (if apparent)
- Use case / application

Format as JSON with this structure:
{
  "equipmentType": string,
  "brand": string,
  "model": string,
  "visibleSpecs": { any specs you can see },
  "estimatedSize": string,
  "useCase": string,
  "questionsToAsk": string[] (what specs to ask the user about)
}

Return ONLY valid JSON.`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 1500
    });

    try {
        const content = response.choices[0].message.content;
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error parsing image analysis:', error);
        return null;
    }
};

export default { generateReport, extractSpecsFromImage };
