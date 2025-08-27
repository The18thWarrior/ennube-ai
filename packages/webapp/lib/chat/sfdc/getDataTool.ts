import { tool } from "ai";
import z from "zod";
import { getBaseUrl } from "../helper";


// Tool: Get Fields
export const getSFDCDataTool = (subId: string) => {
    return tool({
      description: 'Query Salesforce for CRM data.',
      execute: async ({ limit, sobject, filter, orderBy }) => {
        console.log('getDataTool called with:', { limit, sobject, filter, subId });
        if (!subId) throw new Error('subId is required');
        const soql = `SELECT FIELDS(ALL) FROM ${sobject} ${filter && filter.length > 0 ? `WHERE ${filter}` : ""} ${orderBy && orderBy.length > 0 ? `ORDER BY ${orderBy}` : ""} LIMIT ${limit || 100}`;
        const baseUrl = await getBaseUrl();
        const url = `${baseUrl}/api/salesforce/query?sub=${encodeURIComponent(subId)}&soql=${encodeURIComponent(soql)}`;
        const res = await fetch(url);
        if (!res.ok) return false;//throw new Error('Failed to fetch data');
        const data = await res.json();
        //console.log('Data fetched:', data);
        return data;
      },
      inputSchema: z.object({
        limit: z.number().describe('The maximum number of records to return. Defaults to 100. Maximum is 200.'),
        sobject: z.string().describe('The Salesforce object to query, do not speculate on this value if you are not sure. Use the getSFDCObjectDescribeTool if in doubt.'),
        filter: z.string().optional().describe('SOQL WHERE clause filter to apply, this value cannot be empty. Always use single quotes for string values.'),
        orderBy: z.string().optional().describe('SOQL ORDER BY clause to sort the results.')
      })
    });
}
