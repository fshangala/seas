'use server';

import marking_agent from '@/lib/agents/marking_agent';
import { Tables } from '@/lib/types/database.types';

export async function aiMarking({
    question,
    response,
    marking_key,
}: {
    question: Tables<'questions'>,
    response: Tables<'responses'>,
    marking_key: Tables<'marking_keys'>,
}) {
    const prompt = `
    Please mark this candidate response.
    
    Question: ${JSON.stringify(question)}
    Response: ${JSON.stringify(response)}
    Marking Key: ${JSON.stringify(marking_key)}`;

    const res = await marking_agent.invoke({
        messages: [
            {
                role: 'user',
                content: prompt,
            }
        ]
    });

    return res.structuredResponse;
}