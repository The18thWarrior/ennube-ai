import { tool } from "ai";
import z from "zod";
import { getBaseUrl } from "../helper";
import { error } from "console";

// Tool: Get Postgres Data
export const getPostgresDataTool = (subId: string) => {
  return tool({
    description: 'Query a connected PostgreSQL database for data using SQL.',
    async execute({ sql, params }: { sql: string, params?: unknown[] }) {
      console.log('getPostgresDataTool called with:', { sql, params, subId });
      if (!subId) return { error: 'subId is required'};
      if (!sql) return { error: 'SQL query is required' };
      const baseUrl = await getBaseUrl();
      const url = `${baseUrl}/api/postgres/query`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params: params || [], sub: subId })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error fetching Postgres data:', errorText);
        return { error: 'Failed to fetch data', details: errorText };
      }
      const data = await res.json();
      console.log('Postgres data fetched:', data);
      return data;
    },
    parameters: z.object({
      sql: z.string().describe('The SQL query to execute. Use parameterized queries with $1, $2, etc. for values.'),
      params: z.array(z.any()).optional().describe('Array of parameters for the SQL query, if any.'),
    }),
  });
};
