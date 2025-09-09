
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { openai } from '@ai-sdk/openai';

// Returns an AI model instance based on environment configuration
const getModel = (name = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1') => {

  const openrouter = createOpenRouter({
    apiKey: `${process.env.OPENROUTER_API_KEY}`,
  });
  // You can change the model name here as needed`
  return openrouter(name); // google/gemini-2.0-flash-001 openai/gpt-oss-120b deepseek/deepseek-chat-v3.1 deepseek/deepseek-chat-v3-0324 | google/gemini-2.0-flash-001
  if (process.env.OPENROUTER_API_KEY) {
    
  } else if (process.env.OPENAI_API_KEY) {
    // return openai({
    //   apiKey: process.env.OPENAI_API_KEY,
    //   // You can change the model name here as needed
    //   model: 'gpt-4o', // 'gpt-4o', 'gpt-4o-mini', 'g pt-4', 'gpt-3.5-turbo'
    // });
    return null;
  }
  throw new Error('No AI provider API key configured in environment variables.');
};

export default getModel;