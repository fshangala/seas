import { ChatOpenAI } from '@langchain/openai';

/**
 * Centralized OpenAI model configuration.
 * Supports environment variables for API key and custom base URL.
 */
export const openaiModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  },
  modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4o',
  temperature: 0,
});
