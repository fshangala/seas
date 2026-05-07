'use server';

import markingKeyAgent from '@/lib/agents/marking_key_agent';
import { Tables } from '@/lib/types/database.types';

export default async function aiGenerateMarkingKey({ 
    question,
    options
} : {
    question: Tables<'questions'>,
    options: Tables<'options'>[]
}) {
    const prompt = `
    Please generate a marking key for the following assessment content:
    
    Question:
    ${JSON.stringify(question)}
    
    Options:
    ${options.map((opt) => `- ${JSON.stringify(opt)}`).join('\n')}`;
    
    const res = await markingKeyAgent.invoke({
        messages: [
            {
                role: 'user',
                content: prompt,
            }
        ]
    });
    return res.structuredResponse;
}