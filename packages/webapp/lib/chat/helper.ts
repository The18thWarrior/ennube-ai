
import { headers } from 'next/headers';
// System prompt for the Data Steward Agent
import { DATA_STEWARD_SYSTEM_PROMPT } from '@/lib/prompts/data-steward-system-prompt';
import { PROSPECT_FINDER_SYSTEM_PROMPT } from '../prompts/prospect-finder-system-prompt';
import { getWorkflowTool } from './callWorkflowTool';
import { getCountTool } from './getCountTool';
import { getDataVisualizerTool } from './getDataVisualizerTool';
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
import { Tool } from 'ai';
import { CONTRACT_READER_SYSTEM_PROMPT } from '../prompts/contract-reader-system-prompt';

export const getPrompt = (agent: 'data-steward' | 'prospect-finder' | 'contract-reader') => {
    return agent === 'data-steward' ? DATA_STEWARD_SYSTEM_PROMPT : agent === 'contract-reader' ? CONTRACT_READER_SYSTEM_PROMPT : PROSPECT_FINDER_SYSTEM_PROMPT;
}

export async function getBaseUrl() {
    const _headers = await headers();
    const host = _headers.get('host');
    //const host = await headers()?.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'; // Adjust based on your environment
    return `${protocol}://${host}`;
}

export const getTools = async (agent: 'data-steward' | 'prospect-finder' | 'contract-reader', userId: string) : Promise<Record<string, Tool>> => {
    if (agent === 'data-steward') {
        return {
            getCredentials: getCredentialsTool(userId),
            getSFDCFieldDescribeTool: getSFDCFieldsTool(userId),
            getSFDCDataTool: getSFDCDataTool(userId),
            getSFDCObjectDescribeTool: getSFDCObjectTool(userId),
            //getPostgresDataTool: getPostgresDataTool(userId),
            //getPostgresDescribeTool: getPostgresDescribeTool(userId),
            //getCount: getCountTool(userId),
            callWorkflowTool: getWorkflowTool(agent)
        };
    } else if (agent === 'prospect-finder') {
        return {
            getCredentials: getCredentialsTool(userId),
            getSFDCFieldDescribeTool: getSFDCFieldsTool(userId),
            getSFDCDataTool: getSFDCDataTool(userId),
            // getPostgresDataTool: getPostgresDataTool(userId),
            // getPostgresDescribeTool: getPostgresDescribeTool(userId),
            getCustomerProfilesTool: getCustomerProfilesTool(userId),
            createCustomerProfileTool: createCustomerProfileTool(userId),
            updateCustomerProfileTool: updateCustomerProfileTool(userId),
            //getCount: getCountTool(userId),
            callWorkflowTool: getWorkflowTool(agent),
        };
    } else if (agent === 'contract-reader') {
        return {
            getCredentials: getCredentialsTool(userId),
            getSFDCFieldDescribeTool: getSFDCFieldsTool(userId),
            getSFDCDataTool: getSFDCDataTool(userId),
            // getPostgresDataTool: getPostgresDataTool(userId),
            // getPostgresDescribeTool: getPostgresDescribeTool(userId),
            //getCount: getCountTool(userId),
            callWorkflowTool: getWorkflowTool(agent)
        };
    }

    return {
        getCredentials: getCredentialsTool(userId),
        getSFDCFieldDescribeTool: getSFDCFieldsTool(userId),
        getSFDCDataTool: getSFDCDataTool(userId),
        getPostgresDataTool: getPostgresDataTool(userId),
        getPostgresDescribeTool: getPostgresDescribeTool(userId),
        //getCount: getCountTool(userId)
    };

}   