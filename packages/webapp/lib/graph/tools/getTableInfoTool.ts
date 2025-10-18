import { Tool, tool } from "ai";
import z from "zod/v4";
import { GraphDatabase } from "../graph-database";
import { DatabaseSchemaAnalyzer } from "../query-helpers";
import { createSchemaAnalyzer } from "..";


// Tool: Get Table Info
export const getTableInfoTool = (graph: GraphDatabase) => {
    return tool({
        description: 'Get comprehensive information about a database table including columns, primary keys, foreign keys, and indexes.',
        execute : async ({ tableName }) => {
            if (!graph) throw new Error('GraphDatabase instance is required');
            if (!tableName) throw new Error('tableName is required');
            console.log('getTableInfoTool called with tableName:', tableName);
            const analyzer = createSchemaAnalyzer(graph);
            const result = analyzer.getTableInfo(tableName, 'public');
            return result;
        },
        inputSchema: z.object({
            tableName: z.string().describe('The name of the table to get information about'),
            //schema: z.string().optional().describe('Optional schema name if the table belongs to a specific schema'),
        }),
    });
}