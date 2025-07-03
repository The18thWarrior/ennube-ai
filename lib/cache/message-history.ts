
import { Redis } from '@upstash/redis';
import type { Message } from 'ai';

// Configure your Upstash Redis connection here or via env vars
const redisUrl = process.env.KV_REST_API_URL || '';
const redisToken = process.env.KV_REST_API_TOKEN || '';
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const THREAD_PREFIX = 'chat:thread:'; // chat:thread:<threadId>
const USER_THREADS_PREFIX = 'chat:user:'; // chat:user:<subId>

export interface ThreadHistory {
  threadId: string;
  messages: Message[];
  lastUpdated: number;
  currentAgent?: string;
  name: string | null;
}

export async function getThread(threadId: string): Promise<ThreadHistory | null> {
  const data = await redis.get<ThreadHistory>(THREAD_PREFIX + threadId);
  //console.log('Retrieved thread:', data);
  if (!data) return null;
  try {
    return data;
  } catch {
    return null;
  }
}

export async function setThread(threadId: string, subId: string, messages: Message[], name: string | null): Promise<void> {
  let existingThread = await getThread(threadId);
  if (existingThread) {
    if (messages.length > 0) existingThread.messages = [...messages];
    existingThread.lastUpdated = Date.now();
    //console.log('Updated thread name:', name);
    if (name) existingThread.name = name;
    await redis.set(THREAD_PREFIX + threadId, JSON.stringify(existingThread));
  } else {
    await redis.set(THREAD_PREFIX + threadId, JSON.stringify({ threadId, messages, lastUpdated: Date.now(), name }));
  }
  
  
  // Add threadId to user's set of threads
  await redis.sadd(USER_THREADS_PREFIX + subId, threadId);
}

export async function deleteThread(threadId: string, subId?: string): Promise<void> {
  await redis.del(THREAD_PREFIX + threadId);
  if (subId) {
    await redis.srem(USER_THREADS_PREFIX + subId, threadId);
  }
}

export async function getUserThreads(subId: string): Promise<string[]> {
  return await redis.smembers(USER_THREADS_PREFIX + subId);
}

export async function getAllUserHistories(subId: string): Promise<ThreadHistory[]> {
  const threadIds = await getUserThreads(subId);
  if (!threadIds.length) return [];
  const results = await redis.mget(...threadIds.map((id) => THREAD_PREFIX + id));
  return threadIds.map((threadId, i) => {
    const data = results[i];
    let history: ThreadHistory = { threadId, messages: [], lastUpdated: 0, name: null };
    if (data) {
      try {
        history = data as ThreadHistory;
      } catch {}
    }
    return history;
  });
}

// Optionally, a method to clear all threads for a user
export async function deleteAllUserThreads(subId: string): Promise<void> {
  const threadIds = await getUserThreads(subId);
  if (threadIds.length) {
    const delKeys = threadIds.map((id) => THREAD_PREFIX + id);
    await redis.del(...delKeys);
  }
  await redis.del(USER_THREADS_PREFIX + subId);
}
