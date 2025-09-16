// === generateQueryTool.ts ===
// Created: 2025-08-27 00:00
// Purpose: Generate Salesforce SOQL queries using AI and vector similarity search
// Exports:
//   - generateQueryTool: Tool for semantic SOQL generation
//   - QueryGenerationSchema: Zod schema for structured SQL generation
// Interactions:
//   - Used by: AI chat system for intelligent Salesforce querying
// Notes:
//   - Uses vector store for field discovery and AI SDK for query generation
//   - Validates SQL is SELECT-only for security

import { Tool, tool, generateObject } from "ai";
import { openai } from '@ai-sdk/openai';
import z from "zod/v4";
import { embedText } from "./embeddings";
import { getBaseUrl } from "../helper";
import { getSalesforceCredentialsBySub, StoredSalesforceCredentials } from "@/lib/db/salesforce-storage";
import { QueryResult, SalesforceAuthResult } from "@/lib/types";
import getModel from "../getModel";
import { createSalesforceClient } from "@/lib/salesforce";
import {Searcher} from 'fast-fuzzy'

/**
 * Zod schema for structured SQL generation
 */
export const QueryGenerationSchema = z.object({
  sql: z.string().describe('A single SELECT-only SOQL statement using standard Salesforce syntax'),
  tablesUsed: z.array(z.string()).nonempty().describe('Array of Salesforce object types used in the query'),
  rationale: z.string().max(500).describe('Brief explanation of the query logic and field selection'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the generated query (0-1)')
});

export type QueryGenerationResult = z.infer<typeof QueryGenerationSchema>;

/**
 * Interface for describe API response
 */
interface DescribeResponse {
  describe: {
    name: string;
    label: string;
    keyPrefix: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      inlineHelpText?: string;
      picklistValues?: Array<{ label: string; value: string }>;
      relationshipName?: string;
      length?: number;
      precision?: number;
    }>;
    childRelationships: Array<{
      childSObject: string;
      field: string;
      relationshipName: string;
    }>;
  };
}


/**
 * Generate SOQL query using AI and vector similarity
 * @param subId User subscription ID
 * @param sobjectType Primary Salesforce object type
 * @param description User description of desired data
 * @param topK Number of top similar fields to consider (default: 50)
 * @returns Query execution results
 */
async function generateAndExecuteQuery(
  subId: string, 
  credentials: StoredSalesforceCredentials,
  sobjectTypes: string[], 
  description: string,
  similarFields: QueryResult[]
) {
  
  if (similarFields.length === 0) {
    throw new Error('No relevant fields found for the given description');
  }
  console.log(`Found ${similarFields.length} relevant fields for query generation`);
  console.log('objects', sobjectTypes)
  console.log('Current description', description);
  //console.log('All fields:', similarFields.map(f => f.payload ? `${f.payload.sobjectType}.${f.payload.fieldName} ${f.score}` : '[No payload]'));
  // 4. Build context for AI generation
  // const fieldContext = similarFields
  //   .slice(0, 20) // Limit to top 20 for token efficiency
  //   .map(field => {
  //     if (field.payload) {
  //       return `${field.payload.sobjectType}.${field.payload.fieldName} (${field.payload.label}) - ${field.payload.type}`;
  //     }
  //   })
  //   .join('\n');
  const fieldContext = JSON.stringify(similarFields.reduce((acc, f) => {
    if (f.payload) {
      if (!Object.keys(acc).includes(f.payload.sobjectType as string) ) {
        acc[f.payload.sobjectType as string] = {
          fields: [],
          childRelationships: []
        };
      }
      if (f.payload.fieldName) {
        // Build field object and only add optional keys when present
        const field: Record<string, any> = {
          apiName: f.payload.fieldName,
          type: f.payload.type,
        };

        if (f.payload.relationshipName) {
          field.relationshipName = f.payload.relationshipName;
        }

        if (Array.isArray(f.payload.picklistValues) && f.payload.picklistValues.length > 0) {
          field.picklistValues = f.payload.picklistValues;
        }

        acc[f.payload.sobjectType as string].fields.push(field);
      }

      if (f.payload.childSObject) {
        acc[f.payload.sobjectType as string].childRelationships.push({
          childSObject: f.payload.childSObject,
          field: f.payload.fieldName,
          relationshipName: f.payload.relationshipName
        });
      }
      // acc.push({
      //   sobjectType: f.payload.sobjectType,
      //   fieldName: f.payload.fieldName,
      //   label: f.payload.label,
      //   type: f.payload.type
      // });
    }
    return acc;
  }, {} as Record<string, any>));


  const prompt = `
    You are an expert Salesforce SOQL (Salesforce Object Query Language) generation agent. Your sole purpose is to convert a user's natural language question into a syntactically correct and efficient SOQL query based on the provided Salesforce schema. You must operate under the following rules and guidelines.
    Requirements:
    - Generate only SELECT statements
    - Use proper SOQL syntax
    - Focus on fields most relevant to the user's request
    - Include appropriate WHERE clauses if filtering is implied
    - Limit results to a reasonable number (e.g., LIMIT 200)
    - Aggregate functions must be directly declared in GROUP BY and ORDER BY clauses.
    - Date and DateTime Formatting: Dates and DateTimes in WHERE clauses must be in ISO 8601 format.
    -- Date: YYYY-MM-DD (e.g., 2023-01-15) | DateTime: YYYY-MM-DDThh:mm:ssZ (e.g., 2023-01-15T10:00:00Z)
    - Aggregate Functions and LIMIT Clause: A non-grouped query that uses an aggregate function (e.g., COUNT(), MAX(), MIN(), AVG(), SUM()) cannot also use a LIMIT clause. This is because aggregate functions already return a single result. 
    -- Invalid Query: SELECT COUNT(Id) FROM Account LIMIT 1 | Valid Query: SELECT COUNT(Id) FROM Account

    Return a well-formed SOQgL query that addresses the user's needs.
    
    [START OF CONTEXT]
    Generate a SOQL query based on the following user request:
    "${description}"
    Current Date for Context: Assume the current date is ${new Date().toISOString()}.
    The user's id is "${credentials?.userInfo?.id}".

    Relevant schema definitions:
    \`\`\`json
    ${fieldContext}
    \`\`\`
    [END OF CONTEXT]`;
  // 5. Generate structured query object using AI
  console.log('Generating SOQL query with AI...');
  const model = getModel();
  if (!model) {
    throw new Error('AI model not configured');
  }
  const { object: queryResult } = await generateObject({
    model,
    providerOptions: {
      openrouter: {
        parallelToolCalls: false
      }
    },
    schema: QueryGenerationSchema,
    prompt
  });
  console.log('Generated query result:', queryResult);
  //console.log('Generated query result:', queryResult);
  // 6. Validate generated SQL
  if (!validateSelectOnly(queryResult.sql)) {
    throw new Error(`Generated SQL contains non-SELECT statements: ${queryResult.sql}`);
  }
  
  // 7. Execute query via Salesforce API
  console.log('Executing generated SOQL query...', queryResult.sql);
  const baseUrl = await getBaseUrl();
  const queryUrl = `${baseUrl}/api/salesforce/query?sub=${encodeURIComponent(subId)}&soql=${encodeURIComponent(queryResult.sql)}`;
  
  const queryResponse = await fetch(queryUrl);
  if (!queryResponse.ok) {
    const errorData = await queryResponse.json();
    throw new Error(`Query execution failed: ${errorData.error} => ${errorData.details}`);
  }
  
  const queryData = await queryResponse.json();
  
  // 8. Return comprehensive result
  return {
    query: queryResult,
    results: queryData,
    metadata: {
      fieldsConsidered: similarFields.length,
      fieldsUsed: similarFields.slice(0, 20).length,
      sobjectTypes: '' + sobjectTypes.join(', '),
      description
    }
  };
}

/**
 * Validate that SQL contains only SELECT statements
 * @param sql SQL string to validate
 * @returns true if valid SELECT-only, false otherwise
 */
function validateSelectOnly(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  
  // Must start with SELECT
  if (!trimmed.startsWith('SELECT')) {
    return false;
  }
  
  // Check for prohibited keywords (basic validation)
  // const prohibited = ['INSERT ', 'UPDATE ', 'DELETE ', 'DROP ', 'CREATE ', 'ALTER ', 'TRUNCATE '];
  // for (const keyword of prohibited) {
  //   if (trimmed.includes(keyword)) {
  //     return false;
  //   }
  // }
  
  return true;
}
/**
 * Fetch and process sObject describe metadata
 * @param subId User subscription ID
 * @param sobjectType Salesforce object type
 * @returns Processed field metadata
 */
async function fetchAndProcessDescribe(credentials: StoredSalesforceCredentials, sub: string, objects: string[]): Promise<QueryResult[]> {
  const authResult: SalesforceAuthResult = {
      success: true,
      userId: sub,
      accessToken: credentials.accessToken,
      instanceUrl: credentials.instanceUrl,
      refreshToken: credentials.refreshToken,
      userInfo: credentials.userInfo
  };
  const client = createSalesforceClient(authResult);
  const globalResults = await client.describeGlobal();
  // const searcher = new Searcher(objects);
  const objectsLower = objects.map(o => o.toLowerCase());
  const filteredObjects = globalResults.sobjects.filter(obj => (objectsLower.includes(obj.name.toLowerCase()) || objectsLower.includes(obj.label.toLowerCase()) || objectsLower.includes(obj.labelPlural.toLowerCase())) && obj.queryable);

  const describePromises = filteredObjects.map(obj => client.describe(obj.name));
  const describeResults = await Promise.all(describePromises);
  const allFields: QueryResult[] = describeResults.flatMap((desc): QueryResult[] => {
    if (!desc || !desc.fields) return [];
    return desc.fields.map(field => ({
      // Provide a deterministic unique id required by QueryResult interface
      id: `${desc.name}.${field.name}`,
      score: 1, // Placeholder score; actual similarity scoring happens later
      payload: {
        sobjectType: desc.name,
        fieldName: field.name,
        label: field.label,
        type: field.type,
        //inlineHelpText: field.inlineHelpText,
        picklistValues: field.picklistValues ? field.picklistValues.map(p => p.value) : undefined,
        relationshipName: field.relationshipName,
        length: field.length,
        precision: field.precision,
        // Include child relationship info if applicable
        childSObject: desc.childRelationships.find(cr => cr.field === field.name)?.childSObject
      }
    }));
  });
  return allFields;
}

// Tool: Generate Query
export const generateQueryTool = (subId: string) => {
  return tool({
    description: 'Generate and execute intelligent Salesforce SOQL queries based on natural language descriptions. Uses semantic field discovery to find relevant data.',
    inputSchema: z.object({
      sobjects: z.array(z.string()).describe('Primary Salesforce object types to query, e.g. Account, Contact, Opportunity.'),
      description: z.string().describe('Natural language description of what data you are looking for.'),
    }),
    execute: async ({ description, sobjects }: { description: string, sobjects: string[] }) => {
      // Validate required inputs - return structured error objects for predictable tool behavior
      if (!subId) {
        throw new Error('subId is required for Salesforce authentication');
      }

      if (!description || description.trim().length === 0) {
        throw new Error('description is required to understand what data you are looking for');
      }
      console.log(`Generating query for sobjects: ${sobjects.join(', ')} with description: "${description}"`);
      const credentials = await getSalesforceCredentialsBySub(subId);
          
      if (!credentials) {
          throw new Error('Failed to fetch credentials');
      }

      // const queryEmbedding = await embedText(description);
      // if (!queryEmbedding || queryEmbedding.length === 0) {
      //   throw new Error('Failed to generate query embedding');
      // }

      try {
        console.log(`Starting query generation for with description: "${description}"`);
        const query_result = await fetchAndProcessDescribe(credentials, subId, sobjects);
        const data = await generateAndExecuteQuery(subId, credentials, sobjects, description, query_result);
        return data;
      } catch (error: { message?: string } | any) {
        console.error('Query generation failed:', error.message);
        throw new Error(error.message || String(error));
      }
    },
  });
};

/**
 * OVERVIEW
 *
 * - Purpose: Enable intelligent SOQL query generation using semantic field discovery and AI
 * - Assumptions: User has valid Salesforce credentials stored, AI SDK generateObject available
 * - Edge Cases: Handles missing fields, invalid SQL, API failures, and embedding errors gracefully
 * - How it fits into the system: Provides semantic querying capability for AI chat agents
 * - Future Improvements:
 *   - Add query result caching for performance
 *   - Support for multi-object queries with JOIN-like logic
 *   - Query optimization suggestions
 *   - Field relationship understanding for automatic joins
 */

/*
 * === generateQueryTool.ts ===
 * Updated: 2025-08-27 00:00
 * Summary: AI-powered SOQL query generation with semantic field discovery
 * Key Components:
 *   - generateQueryTool: Main tool function for AI integration
 *   - generateAndExecuteQuery: Core query generation and execution logic
 *   - QueryGenerationSchema: Structured output validation with Zod
 * Dependencies:
 *   - Requires: ai SDK, vectorStore, embeddings, Salesforce API access
 * Version History:
 *   v1.0 – initial stub implementation
 *   v2.0 – complete semantic query generation with vector store integration
 * Notes:
 *   - Uses gpt-4o-mini for cost-effective query generation
 *   - Validates all SQL is SELECT-only for security
 *   - Maintains vector store in memory for development use
 */
