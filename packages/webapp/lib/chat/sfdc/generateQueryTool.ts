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
// Delay importing helper at runtime to avoid loading heavy modules during test-time
import { createSalesforceVectorStore, VectorStoreEntry } from "./vectorStore";
import { embedText, createFieldText, createChildRelationshipText } from "./embeddings";
import { getBaseUrl } from "../helper";
import { openrouter } from "@openrouter/ai-sdk-provider";

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
 * Global vector store instance (in-memory for development)
 * Lazily initialized to avoid calling into concrete implementations at module import time
 */
let vectorStore: ReturnType<typeof createSalesforceVectorStore> | null = null;
function getVectorStore() {
  if (!vectorStore) {
    vectorStore = createSalesforceVectorStore();
  }
  return vectorStore as ReturnType<typeof createSalesforceVectorStore>;
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
async function fetchAndProcessDescribe(subId: string, sobjectType: string): Promise<VectorStoreEntry[]> {
  const { getBaseUrl } = await import('../helper');
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/salesforce/describe?sub=${encodeURIComponent(subId)}&sobjectType=${encodeURIComponent(sobjectType)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch describe for ${sobjectType}: ${response.status} ${response.statusText}`);
  }
  
  const data: DescribeResponse = await response.json();
  
  if (!data.describe || !data.describe.fields) {
    throw new Error(`Invalid describe response for ${sobjectType}`);
  }
  
  const entries: VectorStoreEntry[] = [];
  for (const field of data.describe.fields) {
    try {
      // Create text representation for embedding
      const fieldText = createFieldText({
        sobjectType: data.describe.name,
        fieldName: field.name,
        label: field.label,
        type: field.type,
        helpText: field.inlineHelpText,
        relationshipName: field.relationshipName,
        picklistValues: field.picklistValues?.map(pv => pv.value)
      });
      
      // Generate embedding
      const vector = await embedText(fieldText);
      if (!vector || vector.length === 0) {
        throw new Error('Failed to generate embedding');
      }
      // Create vector store entry
      const entry: VectorStoreEntry = {
        id: `${data.describe.name}:${field.name}`,
        vector,
        payload: {
          sobjectType: data.describe.name,
          fieldName: field.name,
          label: field.label,
          type: field.type,
          helpText: field.inlineHelpText,
          relationshipName: field.relationshipName,
          picklistValues: field.picklistValues?.map(pv => pv.value)
        }
      };
      
      entries.push(entry);
    } catch (error) {
      // If embedding fails, propagate a clear error so callers/tests can react
      if (error instanceof Error && error.message.includes('Embedding')) {
        throw new Error('Embedding service unavailable');
      }
      console.warn(`Failed to process field ${field.name} for ${sobjectType}:`, error);
      // Continue processing other fields for non-embedding related errors
    }
  }

  for (const child of data.describe.childRelationships) {
    try {
      // Create text representation for embedding
      const childText = createChildRelationshipText({
        childSObject: child.childSObject,
        field: child.field,
        relationshipName: child.relationshipName
      });
      // Generate embedding
      const vector = await embedText(childText);
      if (!vector || vector.length === 0) {
        throw new Error('Failed to generate embedding');
      }
      // Create vector store entry
      const entry: VectorStoreEntry = {
        id: `${data.describe.name}:${child.relationshipName}`,
        vector,
        payload: {
          sobjectType: child.childSObject,
          fieldName: child.field,
          parentSobjectType: data.describe.name,
          relationshipName: child.relationshipName
        }
      };
      
      entries.push(entry);
    } catch (err) {
      console.warn(`Failed to process child relationship ${child.relationshipName} for ${sobjectType}:`, err);
    }
  }
  
  

  return entries;
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
  sobjectType: string, 
  description: string, 
  topK: number = 50
) {
  // 1. Fetch and store describe metadata
  console.log(`Fetching describe metadata for ${sobjectType}...`);
  const fieldEntries = await fetchAndProcessDescribe(subId, sobjectType);
  
  if (fieldEntries.length === 0) {
    throw new Error(`No fields found for ${sobjectType}`);
  }
  
  // 2. Upsert to vector store
  await getVectorStore().upsert(fieldEntries);
  
  // 3. Embed user description and find similar fields
  console.log('Finding relevant fields based on description...');
  const descriptionVector = await embedText(description);
  const similarFields = await getVectorStore().query(descriptionVector, topK);
  
  if (similarFields.length === 0) {
    throw new Error('No relevant fields found for the given description');
  }
  
  // 4. Build context for AI generation
  const fieldContext = similarFields
    .slice(0, 20) // Limit to top 20 for token efficiency
    .map(field => {
      if (field.payload) {
        return `${field.payload.sobjectType}.${field.payload.fieldName} (${field.payload.label}) - ${field.payload.type}`;
      }
      return '[Unknown field: missing payload]';
    })
    .join('\n');
  
  const prompt = `Generate a SOQL query for Salesforce based on the following user request:
"${description}"

Available fields for ${sobjectType}:
${fieldContext}

Requirements:
- Generate only SELECT statements
- Use proper SOQL syntax
- Focus on fields most relevant to the user's request
- Include appropriate WHERE clauses if filtering is implied
- Limit results to a reasonable number (e.g., LIMIT 200)

Return a well-formed SOQL query that addresses the user's needs.`;

  // 5. Generate structured query object using AI
  console.log('Generating SOQL query with AI...');
  const model = openrouter('deepseek/deepseek-chat-v3.1'); // Use efficient model for query generation
  
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
  
  // 6. Validate generated SQL
  if (!validateSelectOnly(queryResult.sql)) {
    throw new Error(`Generated SQL contains non-SELECT statements: ${queryResult.sql}`);
  }
  
  // 7. Execute query via Salesforce API
  console.log('Executing generated SOQL query...');
  const baseUrl = await getBaseUrl();
  const queryUrl = `${baseUrl}/api/salesforce/query?sub=${encodeURIComponent(subId)}&soql=${encodeURIComponent(queryResult.sql)}`;
  
  const queryResponse = await fetch(queryUrl);
  if (!queryResponse.ok) {
    throw new Error(`Query execution failed: ${queryResponse.status} ${queryResponse.statusText}`);
  }
  
  const queryData = await queryResponse.json();
  
  // 8. Return comprehensive result
  return {
    query: queryResult,
    results: queryData,
    metadata: {
      fieldsConsidered: similarFields.length,
      fieldsUsed: similarFields.slice(0, 20).length,
      sobjectType,
      description
    }
  };
}

// Tool: Generate Query
export const generateQueryTool = (subId: string) => {
  return tool({
    description: 'Generate and execute intelligent Salesforce SOQL queries based on natural language descriptions. Uses semantic field discovery to find relevant data.',
    inputSchema: z.object({
      sobjectType: z.string().describe('The Salesforce sObject type to query (e.g., "Account", "Contact", "Opportunity")'),
      description: z.string().describe('Natural language description of what data you are looking for. Be specific about the fields, filters, or relationships you need.'),
    }),
    execute: async ({ sobjectType, description }: { sobjectType: string; description: string }) => {
      // Validate required inputs - return structured error objects for predictable tool behavior
      if (!subId) {
        throw new Error('subId is required for Salesforce authentication');
      }

      if (!sobjectType) {
        throw new Error('sobjectType is required to specify the Salesforce object');
      }

      if (!description || description.trim().length === 0) {
        throw new Error('description is required to understand what data you are looking for');
      }

      try {
        console.log(`Starting query generation for ${sobjectType} with description: "${description}"`);
        const result = await generateAndExecuteQuery(subId, sobjectType, description);
        
        // return {
        //   success: true,
        //   ...result
        // };
        return {
          ...result.results
        }
      } catch (error: { message?: string } | any) {
        console.error('Query generation failed:', error);
        throw new Error(error.message || String(error));
        // return {
        //   success: false,
        //   error: error instanceof Error ? error.message : String(error),
        //   sobjectType,
        //   description
        // };
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
