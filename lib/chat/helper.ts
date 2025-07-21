
import { headers } from 'next/headers';
// System prompt for the Data Steward Agent
import { DATA_STEWARD_SYSTEM_PROMPT } from '@/lib/prompts/data-steward-system-prompt';
import { PROSPECT_FINDER_SYSTEM_PROMPT } from '../prompts/prospect-finder-system-prompt';

export const getPrompt = (agent: 'data-steward' | 'prospect-finder') => {
    return agent === 'data-steward' ? DATA_STEWARD_SYSTEM_PROMPT : PROSPECT_FINDER_SYSTEM_PROMPT;
}


export async function getBaseUrl() {
    const _headers = await headers();
    const host = _headers.get('host');
    //const host = await headers()?.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'; // Adjust based on your environment
    return `${protocol}://${host}`;
}