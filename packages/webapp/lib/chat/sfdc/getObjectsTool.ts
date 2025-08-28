import { Tool, tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "../helper";

// Tool: Get Objects
export const getObjectsTool = (subId: string) => {
    return tool({
        description: 'Get all Objects available in an environment and return a JSON payload listing every valid Object available for use.',
        execute: async () => {
            if (!subId) throw new Error('subId is required');
            const baseUrl = await getBaseUrl();
            const url = `${baseUrl}/api/salesforce/describe?sub=${encodeURIComponent(subId)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch objects');
            const data = await res.json();
            return data;
        },
        inputSchema: z.object({
        }),
    });
}
