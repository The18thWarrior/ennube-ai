import { tool } from "ai";
import z from "zod";


// Tool: Get Fields
export const getDataTool = (subId: string) => {
    return tool({
      description: 'Query Salesforce for CRM data.',
      async execute({ limit, sobject, filter }: { limit: number, sobject: string, filter: string }) {
        if (!subId) throw new Error('subId is required');
        const soql = `SELECT FIELDS(ALL) FROM ${sobject} WHERE ${filter} LIMIT ${limit}`;
        const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/salesforce/query?sub=${encodeURIComponent(subId)}&soql=${encodeURIComponent(soql)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        return data;
      },
      parameters: z.object({
        limit: z.number().describe('The maximum number of records to return. Defaults to 100. Maximum is 200.').default(100),
        sobject: z.string().describe('The Salesforce object to query'),
        filter: z.string().describe('SOQL WHERE clause filter to apply, this value cannot be empty. Always use single quotes for string values.'),
      }),
    });
}
