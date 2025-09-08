import { Tool, tool } from 'ai';
import z from 'zod/v4';
import { getBaseUrl } from '../helper';

// Tool: Update Data (propose + execute)
export const proposeUpdateDataTool = (subId: string) => {
  return tool({
    description: 'Propose changes to Salesforce records from a natural-language request and optionally execute them after approval. Returns a structured proposal and validation issues or execution results.',
    execute: async ({ nlRequest, mode = 'propose', context }: { nlRequest?: string; mode?: 'propose' | 'execute'; context?: any }) => {
      if (!subId) throw new Error('subId is required');
      if (!nlRequest && mode === 'propose') throw new Error('nlRequest is required for propose mode');

      const baseUrl = await getBaseUrl();

        const url = `${baseUrl}/api/salesforce/propose?sub=${encodeURIComponent(subId)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nlRequest, context })
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data;
      
    },
    inputSchema: z.object({
      nlRequest: z.string().optional().describe('Natural-language request describing desired change'),
      context: z.any().optional().describe('Optional context for proposal or execution (e.g., sobject, recordId, proposal)')
    })
  });
};
