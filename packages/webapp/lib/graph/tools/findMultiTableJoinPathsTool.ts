import { Tool, tool } from "ai";
import z from "zod/v4";
import { GraphDatabase } from "../graph-database";
import { DatabaseSchemaAnalyzer } from "../query-helpers";
import { createSchemaAnalyzer } from "..";


// Tool: Find Multi-Table Join Paths
export const findMultiTableJoinPathsTool = (graph: GraphDatabase) => {
    return tool({
        description: 'Find optimal join paths to connect multiple tables, returning an array of join suggestions to connect all specified tables.',
        execute : async ({ tableNames }) => {
            if (!graph) throw new Error('GraphDatabase instance is required');
            if (!tableNames || tableNames.length < 2) throw new Error('At least 2 table names are required');
            console.log('findMultiTableJoinPathsTool called with tableNames:', tableNames);
            const analyzer = createSchemaAnalyzer(graph);
            const result = analyzer.findMultiTableJoinPaths(tableNames, 'public');
            return result;
        },
        inputSchema: z.object({
            tableNames: z.array(z.string()).min(2).describe('Array of table names to connect with join paths'),
            //schema: z.string().optional().describe('Optional schema name if the tables belong to a specific schema'),
        }),
    });
}