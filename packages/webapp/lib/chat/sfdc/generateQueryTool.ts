import { Tool, tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "../helper";


// Tool: Get Fields
export const generateQueryTool = (subId: string) => {
    return tool({
        description: 'Introspect a Salesforce sObject and return a JSON payload listing every valid field available for use.',
        execute : async ({ sobjectType }) => {
            if (!subId) throw new Error('subId is required');
            if (!sobjectType) throw new Error('sobjectType is required');
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/api/salesforce/describe?sub=${encodeURIComponent(subId)}&sobjectType=${encodeURIComponent(sobjectType)}`;
            const res = await fetch(url);
            if (!res.ok) return false;//throw new Error('Failed to fetch fields');
            const data = await res.json();


            return false;
        },
        inputSchema: z.object({
            sobjectType: z.string().describe('The Salesforce sObject type to introspect'),
            description: z.string().describe('Description of what data the user is looking for. Should describe any related objects that should also be retrieved.'),
        }),
    });
}
