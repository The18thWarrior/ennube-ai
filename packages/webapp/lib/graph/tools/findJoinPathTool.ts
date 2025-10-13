import { Tool, tool } from "ai";
import z from "zod/v4";
import { GraphDatabase } from "../graph-database";
import { DatabaseSchemaAnalyzer } from "../query-helpers";
import { createSchemaAnalyzer } from "..";


// Tool: Find Join Path
export const findJoinPathTool = (graph: GraphDatabase) => {
    return tool({
        description: 'Find the best join path between two tables, returning a join suggestion with condition and confidence score.',
        execute : async ({ fromTable, toTable }) => {
            if (!graph) throw new Error('GraphDatabase instance is required');
            if (!fromTable) throw new Error('fromTable is required');
            if (!toTable) throw new Error('toTable is required');
            console.log('findJoinPathTool called with fromTable:', fromTable, 'toTable:', toTable);
            const analyzer = createSchemaAnalyzer(graph);
            const result = analyzer.findJoinPath(fromTable, toTable, 'public');
            return result;
        },
        inputSchema: z.object({
            fromTable: z.string().describe('The source table name for the join path'),
            toTable: z.string().describe('The target table name for the join path'),
            //schema: z.string().optional().describe('Optional schema name if the tables belong to a specific schema'),
        }),
    });
}