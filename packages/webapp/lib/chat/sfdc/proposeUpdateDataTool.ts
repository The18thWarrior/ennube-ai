import { Tool, tool } from 'ai';
import z from 'zod/v4';
import { getBaseUrl } from '../helper';

const ProposalRequestSchema = z.object({
  nlRequest: z.string().describe('Natural-language request describing desired change'),
  operation: z.enum(['create','update', 'delete']),
  sobject: z.string().describe('Salesforce object type, e.g. Account, Contact'),
  recordIds: z.array(z.string()).describe('List of record IDs to use for update/delete operations'),
});


//const combinedSchema = z.union([ProposalRequestSchemaUpdate, ProposalRequestSchemaCreate]);
// Tool: Update Data (propose + execute)
export const proposeUpdateDataTool = (subId: string) => {
  return tool({
    description: 'Propose changes to Salesforce records. Returns a structured proposal. ALWAYS use the getSFDCDataTool first to validate current record state before proposing changes.',
    execute: async ( params : z.infer<typeof ProposalRequestSchema>) => {
      if (!subId) throw new Error('subId is required');
      if (!params.nlRequest) throw new Error('nlRequest is required for propose mode');
      const baseUrl = await getBaseUrl();

      const url = `${baseUrl}/api/salesforce/propose?sub=${encodeURIComponent(subId)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to generate proposal: ' + (data.error || 'Unknown error'));
      return data;
      
    },
    inputSchema: ProposalRequestSchema
  });
};
