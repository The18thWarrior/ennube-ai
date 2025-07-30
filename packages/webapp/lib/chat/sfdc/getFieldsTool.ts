import { Tool, tool } from "ai";
import z from "zod";
import { getBaseUrl } from "../helper";


// Tool: Get Fields
export const getFieldsTool = (subId: string) => {
    return tool({
        description: 'Introspect a Salesforce sObject and return a JSON payload listing every valid field available for use.',
        async execute({ sobjectType, limit = 1 }: { sobjectType: string, limit?: number}) {
            if (!subId) throw new Error('subId is required');
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/api/salesforce/describe?sub=${encodeURIComponent(subId)}&sobjectType=${encodeURIComponent(sobjectType)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch fields');
            const data = await res.json();
            return data;
        },
        parameters: z.object({
            sobjectType: z.string().describe('The Salesforce sObject type to introspect'),
            limit: z.number().optional().default(1).describe('Optional limit on the number of fields to return'),
        }),
    });
}
