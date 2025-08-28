import { tool } from "ai";
import z from "zod/v4";
import { getBaseUrl } from "../helper";

// Tool: Get Postgres Describe
export const getDescribeTool = (subId: string) => {
  return tool({
    description: 'Introspect a PostgreSQL database or table and return schema metadata (tables, columns, indexes, etc).',
    execute: async ({ table, schema }: { table?: string, schema?: string }) => {
      if (!subId) throw new Error('subId is required');
      const baseUrl = await getBaseUrl();
      let url = `${baseUrl}/api/postgres/describe?sub=${encodeURIComponent(subId)}`;
      if (schema) url += `&schema=${encodeURIComponent(schema)}`;
      if (table) url += `&table=${encodeURIComponent(table)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch schema metadata');
      const data = await res.json();
      return data;
    },
    inputSchema: z.object({
      table: z.string().optional().describe('The table name to introspect. If omitted, returns all tables in the schema.'),
      schema: z.string().optional().describe('The schema name to introspect. Defaults to public.'),
    }),
  });
};
