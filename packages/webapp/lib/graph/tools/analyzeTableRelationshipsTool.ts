import { Tool, tool } from "ai";
import z from "zod/v4";
import { GraphDatabase } from "../graph-database";
import { DatabaseSchemaAnalyzer } from "../query-helpers";
import { createSchemaAnalyzer } from "..";


// Tool: Analyze Table Relationships
export const analyzeTableRelationshipsTool = (graph: GraphDatabase) => {
    return tool({
        description: 'Analyze relationships for a specific table including direct relationships, suggested joins, and related tables.',
        execute : async ({ tableName, options }) => {
            if (!graph) throw new Error('GraphDatabase instance is required');
            if (!tableName) throw new Error('tableName is required');
            console.log('analyzeTableRelationshipsTool called with tableName:', tableName, 'options:', options);
            const analyzer = createSchemaAnalyzer(graph);
            const result = analyzer.analyzeTableRelationships(tableName, 'public', {...options, preferredJoinTypes: ['INNER']});
            return result;
        },
        inputSchema: z.object({
            tableName: z.string().describe('The name of the table to analyze relationships for'),
            //schema: z.string().optional().default('public').describe('Optional schema name if the table belongs to a specific schema'),
            options: z.object({
                includeViews: z.boolean().optional().describe('Whether to include views in the analysis'),
                maxJoinDepth: z.number().optional().describe('Maximum depth for join path discovery'),
                //preferredJoinTypes: z.array(z.enum(['INNER', 'LEFT', 'RIGHT', 'FULL'])).optional().describe('Preferred join types for suggestions'),
                excludeTables: z.array(z.string()).optional().describe('Tables to exclude from analysis'),
                schemaFilter: z.array(z.string()).optional().describe('Schemas to filter the analysis to'),
            }).optional().describe('Optional analysis configuration'),
        }),
    });
}