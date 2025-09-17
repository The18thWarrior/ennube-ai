
import { Redis } from '@upstash/redis';
import type { UIMessage } from 'ai';

// Configure your Upstash Redis connection here or via env vars
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const PROMPT_PREFIX = 'prompt:thread:'; // prompt:thread:<threadId>
export interface Prompt {
  agent: string;
  prompt: string;
}

export async function getPrompt(agent: string): Promise<Prompt | null> {
  const data = await redis.get<Prompt>(PROMPT_PREFIX + agent);
  //console.log('Retrieved thread:', data);
  if (!data) return null;
  try {
    return data;
  } catch {
    return null;
  }
}

export async function setPrompt(agent: string, prompt: string): Promise<void> {
  await redis.set(PROMPT_PREFIX + agent, JSON.stringify({ agent, prompt }));
}

export async function deletePrompt(agent: string): Promise<void> {
  await redis.del(PROMPT_PREFIX + agent);
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const keys = await redis.keys(PROMPT_PREFIX + '*');
  const prompts: Prompt[] = [];
  for (const key of keys) {
    const data = await redis.get<Prompt>(key);
    if (data) {
      try {
        prompts.push(data);
      } catch {
        // skip invalid data
      }
    }
  }
  return prompts;
}