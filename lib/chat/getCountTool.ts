import { tool } from "ai";
import z from "zod";


// Tool: Get Fields
export const getCountTool = (subId: string) => {
    return tool({
      description: 'Query for count of records in Salesforce for CRM data.',
      async execute({ sobject, filter }: { sobject: string, filter: string }) {
        if (!subId) throw new Error('subId is required');
        const soql = `SELECT COUNT() FROM ${sobject} WHERE ${filter}`;
        const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/salesforce/query?sub=${encodeURIComponent(subId)}&soql=${encodeURIComponent(soql)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        return data;
      },
      parameters: z.object({
        sobject: z.string().describe('The Salesforce object to query'),
        filter: z.string().describe('SOQL WHERE clause filter to apply, this value cannot be empty. Always use single quotes for string values.'),
      }),
    });
}
