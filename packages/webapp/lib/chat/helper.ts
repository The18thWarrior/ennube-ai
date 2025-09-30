
import { headers } from 'next/headers';
// System prompt for the Data Steward Agent
import { DATA_STEWARD_SYSTEM_PROMPT } from '@/lib/prompts/data-steward-system-prompt';
import { PROSPECT_FINDER_SYSTEM_PROMPT } from '../prompts/prospect-finder-system-prompt';
import { getWorkflowTool } from './callWorkflowTool';
import { getCountTool } from './getCountTool';
import { getPostgresDataTool } from './postgres/getDataTool';
import { getCredentialsTool } from './sfdc/getCredentialsTool';
import { getSFDCDataTool } from './sfdc/getDataTool';
import { getFieldsTool as getSFDCFieldsTool} from '@/lib/chat/sfdc/getFieldsTool';
import { getObjectsTool as getSFDCObjectTool} from '@/lib/chat/sfdc/getObjectsTool';
import { getDescribeTool as getPostgresDescribeTool } from '@/lib/chat/postgres/getDescribeTool';
import { getCustomerProfilesTool } from './internal/getCustomerProfiles';
import { createCustomerProfileTool } from './internal/createCustomerProfile';
import { updateCustomerProfile } from '../db/customer-profile-storage';
import { updateCustomerProfileTool } from './internal/updateCustomerProfile';
import { parseFileTool } from './parseFileTool';
import { getFileTool } from './sfdc/getFileTool';
import { Tool } from 'ai';
import { CONTRACT_READER_SYSTEM_PROMPT } from '../prompts/contract-reader-system-prompt';
import { generateQueryTool } from './sfdc/generateQueryTool';
import { proposeUpdateDataTool } from './sfdc/proposeUpdateDataTool';
import { getPrompt as getPromptCache } from '@/lib/cache/prompt-cache';
import { webSearchTool } from './webSearchTool';

export const getPrompt = async (agent: 'data-steward' | 'prospect-finder' | 'contract-reader') => {
  const cachePrompt = await getPromptCache(agent);
  // TODO: use cached prompt if found
  //if (cachePrompt) return cachePrompt.prompt;
  return agent === 'data-steward' ? DATA_STEWARD_SYSTEM_PROMPT : agent === 'contract-reader' ? CONTRACT_READER_SYSTEM_PROMPT : PROSPECT_FINDER_SYSTEM_PROMPT;
}

export async function getBaseUrl() {
    const _headers = await headers();
    const host = _headers.get('host');
    //const host = await headers()?.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'; // Adjust based on your environment
    return `${protocol}://${host}`;
}

export const getTools = async (agent: 'data-steward' | 'prospect-finder' | 'contract-reader', userId: string, webSearch: boolean = false) : Promise<Record<string, Tool>> => {
    
  const baseTools = {
    getSFDCDataTool: generateQueryTool(userId),
    proposeUpdateSFDCDataTool: proposeUpdateDataTool(userId),
    getSFDCFileTool: getFileTool(userId),
    parseFileTool: parseFileTool(userId),
    //getPostgresDataTool: getPostgresDataTool(userId),
    //getPostgresDescribeTool: getPostgresDescribeTool(userId),
  };
  const _baseTools = webSearch ? { ...baseTools, webSearchTool: webSearchTool(userId), } : { ...baseTools };
  if (agent === 'data-steward') {
    return {
      ..._baseTools,
      callWorkflowTool: getWorkflowTool(agent)
    };
    } else if (agent === 'prospect-finder') {
      return {
        ..._baseTools,
        getCustomerProfilesTool: getCustomerProfilesTool(userId),
        createCustomerProfileTool: createCustomerProfileTool(userId),
        updateCustomerProfileTool: updateCustomerProfileTool(userId),
        callWorkflowTool: getWorkflowTool(agent)
      };
    } else if (agent === 'contract-reader') {
      return {
        ..._baseTools,
        callWorkflowTool: getWorkflowTool(agent)
      };
    }

    return _baseTools;

}   