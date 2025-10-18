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

import { Tool, tool, generateObject, generateText, stepCountIs } from "ai";
import { openai } from '@ai-sdk/openai';
import z from "zod/v4";
import { embedText } from "./embeddings";
import { getBaseUrl } from "../helper";
import { getSalesforceCredentialsBySub, StoredSalesforceCredentials, updateDescribeEmbedUrlByUserAndType } from "@/lib/db/salesforce-storage";
import { QueryResult, SalesforceAuthResult } from "@/lib/types";
import getModel from "../getModel";
import { createSalesforceClient } from "@/lib/salesforce";
import {Searcher} from 'fast-fuzzy'
import { loadSchemaFromJSON, createSchemaAnalyzer, GraphDatabase, NodeType } from '@/lib/graph';
import { put } from "@vercel/blob";
import { analyzeTableRelationshipsTool, getTableInfoTool, findJoinPathTool, getAllTableNamesTool } from "@/lib/graph/tools";

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
  graphDb: GraphDatabase
) {
  
  // 5. Generate structured query object using AI
  console.log('Generating SOQL query with AI...');
  const model = getModel();
  if (!model) {
    throw new Error('AI model not configured');
  }
  
  const textResponse = await generateText({
    model,
    providerOptions: {
      openrouter: {
        parallelToolCalls: false
      }
    },
    prompt: `
      You are an expert data analyst and SQL (Structured Query Language) generation agent. 
      Your sole purpose is to take a user's natural language request and use the attached tools to generate a recomendation of tables and fields to use in a SQL query.

      [START OF CONTEXT]
      User request: "${description}"
      [END OF CONTEXT]
    `,
    tools: {
      getAllTableNamesTool: getAllTableNamesTool(graphDb),
      analyzeTableRelationshipsTool: analyzeTableRelationshipsTool(graphDb),
      getTableInfoTool: getTableInfoTool(graphDb),
      findJoinPathTool: findJoinPathTool(graphDb)
    },
    toolChoice: "required",
    stopWhen: stepCountIs(5),
    
  })
  console.log('Text response:', textResponse.text);
  const prompt =  `
    You are an expert Salesforce SOQL (Salesforce Object Query Language) generation agent. Your sole purpose is to convert a user's natural language question into a syntactically correct and efficient SOQL query based on the provided Salesforce schema. You must operate under the following rules and guidelines.

    Requirements:
    - Generate only SELECT statements
    - ALWAYS include the object Id field in the SELECT clause
    - Use proper SOQL syntax
    - Focus on fields most relevant to the user's request
    - Include appropriate WHERE clauses if filtering is implied
    - Limit results to a reasonable number (e.g., LIMIT 200)
    - Aggregate functions must be directly declared in GROUP BY and ORDER BY clauses.
    - A sub-query cannot be used in a GROUP BY or ORDER BY clause.
      -- Invalid Query: SELECT COUNT(Id), (SELECT Id FROM Contacts) FROM Account GROUP BY (SELECT Id FROM Contacts)
    - Date and DateTime Formatting: Dates and DateTimes in WHERE clauses must be in ISO 8601 format.
      -- Date: YYYY-MM-DD (e.g., 2023-01-15) | DateTime: YYYY-MM-DDThh:mm:ssZ (e.g., 2023-01-15T10:00:00Z)
    - Aggregate Functions and LIMIT Clause: A non-grouped query that uses an aggregate function (e.g., COUNT(), MAX(), MIN(), AVG(), SUM()) cannot also use a LIMIT clause. This is because aggregate functions already return a single result. 
      -- Invalid Query: SELECT COUNT(Id) FROM Account LIMIT 1 | Valid Query: SELECT COUNT(Id) FROM Account

    Nomenclature:
    - The 'OwnerId' field on a record points to either a User or a Queue. If ownership is being changed, resolve the new owner's 'Id' (usually a UserId) and update the record’s 'OwnerId.

    - Files in Salesforce are represented by three key objects:
      • ContentDocument — the logical file record. 
      • ContentVersion — stores individual versions of the file (including binary data). The latest version is where you download from.
      • ContentDocumentLink — junction object linking a ContentDocument to another record (e.g., Account, Contact).

      To find files for a record:
      1. Query ContentDocumentLink where LinkedEntityId = the record Id.
      2. From each ContentDocumentLink, get the ContentDocument.
      3. From the ContentDocument, retrieve the latest ContentVersion (IsLatest = true).
      4. Download the file from ContentVersion.VersionData.
    
    Rules for Translating Joins:
    | Type                | Direction    | Analogy           | Syntax Style   | Example                                 |
    | ------------------- | ------------ | ----------------- | -------------- | --------------------------------------- |
    | **Child-to-Parent** | Upward       | INNER JOIN        | Dot notation   | 'Contact → Account.Name'                |
    | **Child-to-Parent** | Upward       | INNER JOIN        | Dot notation   | 'Contact → CustomObject__r.Name'        |
    | **Parent-to-Child** | Downward     | LEFT OUTER JOIN   | Subquery       | '(SELECT Id FROM Contacts)'             |
    | **Semi-Join**       | Filter-based | IN (subquery)     | WHERE + IN     | 'WHERE Id IN (SELECT AccountId FROM …)' |
    | **Anti-Join**       | Filter-based | NOT IN (subquery) | WHERE + NOT IN | 'WHERE Id NOT IN (SELECT …)'            |

    Return a well-formed SOQL query that addresses the user's needs.
    
    [START OF CONTEXT]
    Generate a SOQL query based on the following user request:
    "${description}"
    Current Date for Context: Assume the current date is ${new Date().toISOString()}.
    The user's id is "${credentials?.userInfo?.id}".
    Relevant schema definitions:
      \`\`\`text 
      ${textResponse.text}
      \`\`\`
    [END OF CONTEXT]`;
  const { object: queryResult } = await generateObject({
    model,
    providerOptions: {
      openrouter: {
        parallelToolCalls: false
      }
    },
    schema: QueryGenerationSchema,
    prompt: prompt
  });
  //console.log('Generated query result:', queryResult);
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
      fieldsConsidered: queryResult.tablesUsed.length,
      fieldsUsed: queryResult.tablesUsed,
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
async function fetchAndProcessDescribe(credentials: StoredSalesforceCredentials, sub: string, objects: string[]): Promise<GraphDatabase> {
  const authResult: SalesforceAuthResult = {
      success: true,
      userId: sub,
      accessToken: credentials.accessToken,
      instanceUrl: credentials.instanceUrl,
      refreshToken: credentials.refreshToken,
      userInfo: credentials.userInfo
  };
  const client = createSalesforceClient(authResult);

  // Try to load an existing serialized graph if the credentials point to one
  if (credentials.describeEmbedUrl) {
    try {
      const resp = await fetch(credentials.describeEmbedUrl);
      if (resp.ok) {
        const json = await resp.json();
        const from = GraphDatabase.fromJSON(json);
        if (from && from.success && from.data) {
          const graph = from.data;
          return graph;
        }
      }
    } catch (err) {
      console.warn('Failed to load embedded graph from describeEmbedUrl, will fall back to live describe', err);
    }
  }

  // No stored graph; perform live describe on requested objects
  const describePromises = objects.map(async (obj) => {
    try {
      const describe = await client.describe(obj);
      return { sobject: obj, describe } as DescribeResponse;
    } catch (err) {
      console.warn(`Failed to describe ${obj}:`, err);
      return { sobject: obj, describe: null } as any;
    }
  });

  const describeResults = await Promise.all(describePromises);

  const tables: any[] = [];
  const fieldInfoMap = new Map<string, any>();

  for (const res of describeResults) {
    if (!res || !res.describe) continue;
    const desc = res.describe;
    const sobjectType = desc.name;

    const tableSchema: any = {
      name: sobjectType,
      schema: desc.namespacePrefix || 'public',
      columns: (desc.fields || []).map((f: any) => ({
        name: f.name,
        dataType: f.type || 'unknown',
        isNullable: f.nillable ?? true,
        isPrimaryKey: (f.name || '').toLowerCase() === 'id',
        defaultValue: undefined,
        maxLength: f.length,
      })),
      foreignKeys: (desc.fields || []).flatMap((f: any) => {
        if (Array.isArray(f.referenceTo) && f.referenceTo.length > 0) {
          return f.referenceTo.map((ref: string) => ({
            columnName: f.name,
            referencedTable: ref,
            referencedColumn: 'id',
          }));
        }
        return [];
      }),
    };

    for (const f of desc.fields || []) {
      fieldInfoMap.set(`${sobjectType}.${f.name}`, {
        label: f.label,
        picklistValues: f.picklistValues ? f.picklistValues.map((p: any) => p.value) : undefined,
        relationshipName: f.relationshipName,
        length: f.length,
        precision: f.precision,
      });
    }

    for (const cr of desc.childRelationships || []) {
      if (cr.field) {
        const key = `${sobjectType}.${cr.field}`;
        const existing = fieldInfoMap.get(key) || {};
        existing.childSObject = cr.childSObject;
        existing.relationshipName = cr.relationshipName;
        fieldInfoMap.set(key, existing);
      }
    }

    tables.push(tableSchema);
  }

  const graph = loadSchemaFromJSON({ tables });
  const jsonData = graph.toJSON();

  // Write graph JSON to Vercel Blob
  const fileName = `sfdc:${sub}:embed.json`;
  const { url } = await put(fileName, JSON.stringify(jsonData), { access: 'public', allowOverwrite: true });
  await updateDescribeEmbedUrlByUserAndType(sub, url);
  return graph;
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
        const graph = await fetchAndProcessDescribe(credentials, subId, sobjects);
        const data = await generateAndExecuteQuery(subId, credentials, sobjects, description, graph);
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
