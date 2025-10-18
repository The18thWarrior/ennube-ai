import { Tool, tool } from "ai";
import z from "zod/v4";
import { GraphDatabase } from "../graph-database";
import { DatabaseSchemaAnalyzer } from "../query-helpers";
import { createSchemaAnalyzer } from "..";


// Tool: Get Table Info
export const getAllTableNamesTool = (graph: GraphDatabase) => {
    return tool({
        description: 'Get comprehensive information about a database table including columns, primary keys, foreign keys, and indexes.',
        execute : async ({  }) => {
            if (!graph) throw new Error('GraphDatabase instance is required');
            console.log('getAllTableNamesTool called');
            const analyzer = createSchemaAnalyzer(graph);
            const result = analyzer.getAllTableNames('public');
            return result;
        },
        inputSchema: z.object({
            //tableName: z.string().describe('The name of the table to get information about'),
            //schema: z.string().optional().describe('Optional schema name if the table belongs to a specific schema'),
        }),
    });
}