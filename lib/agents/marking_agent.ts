import { createAgent } from 'langchain';
import { openaiModel } from '../models/openai_model';
import * as z from 'zod';

const markingResponseSchema = z.object({
  marks: z.number().describe("The suggested mark out of the maximum possible."),
  reasoning: z.string().describe("The reasoning for the suggested mark."),
});

export default createAgent({
  model: openaiModel,
  systemPrompt: 'You are a helpful assistant that evaluates student responses based on the question, marking key, and grading notes. Provide a suggested mark out of the maximum possible along with reasoning.',
  tools: [],
  responseFormat: markingResponseSchema,
});
