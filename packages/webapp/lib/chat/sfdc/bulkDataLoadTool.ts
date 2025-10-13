// === bulkDataLoad.ts ===
// Created: 2025-10-11 00:00
// Purpose: AI-powered CSV to Salesforce field mapping tool for bulk data loading
// Exports:
//   - bulkDataLoadTool: Tool for intelligent field mapping between CSV headers and Salesforce fields
// Interactions:
//   - Used by: CRM data loader components for automated field mapping
// Notes:
//   - Uses GraphDatabase for schema analysis and AI for intelligent mapping

import { Tool, tool, generateObject } from "ai";
import z from "zod/v4";
import { getSalesforceCredentialsBySub, StoredSalesforceCredentials } from "@/lib/db/salesforce-storage";
import { loadSchemaFromJSON, createSchemaAnalyzer, GraphDatabase } from '@/lib/graph';
import getModel from "../getModel";
import { FieldMappingSchema, BulkDataLoadMappingType } from "@/lib/types";



/**
 * Schema for the complete mapping response
 */
export const BulkDataLoadSchema = z.array(FieldMappingSchema);

/**
 * Generate intelligent field mappings between CSV headers and Salesforce fields
 * @param subId User subscription ID
 * @param sobject Salesforce object API name
 * @param headers Comma-separated CSV column headers
 * @param graphDb GraphDatabase instance with schema information
 * @returns Array of successful field mappings
 */
async function generateFieldMappings(
  sobject: string,
  headers: string[],
  graphDb: GraphDatabase
): Promise<z.infer<typeof BulkDataLoadSchema>> {
  console.log('Generating field mappings for:', { sobject, headers });

  // Get schema analyzer and table info
  const analyzer = createSchemaAnalyzer(graphDb);
  const tableInfo = analyzer.getTableInfo(sobject, 'public');

  if (!tableInfo || !tableInfo.columns) {
    throw new Error(`No schema information found for sobject: ${sobject}`);
  }

  // Prepare schema context for AI
  const schemaContext = {
    sobject,
    availableFields: tableInfo.columns.map(col => ({
      name: col.name,
      dataType: col.dataType,
      isNullable: col.isNullable,
      isPrimaryKey: col.isPrimaryKey,
      maxLength: col.maxLength
    })),
    csvHeaders: headers
  };
  console.log('Schema context prepared:', schemaContext);
  // Use AI to generate mappings
  const model = getModel();
  if (!model) {
    throw new Error('AI model not configured');
  }

  const prompt = `
    You are an expert data mapping specialist. Your task is to intelligently map CSV column headers to Salesforce fields based on the provided schema information.

    Rules:
    - Only map CSV headers that have a reasonable match in the Salesforce schema
    - Use exact field name matches when possible (case-insensitive)
    - Use semantic similarity for partial matches (e.g., "First Name" -> "FirstName")
    - Consider common variations and abbreviations
    - Return only successful mappings - omit any CSV fields that cannot be reasonably mapped
    - Preserve the exact CSV field name in the response
    - Include the Salesforce data type for each mapping

    Available Salesforce fields for ${sobject}:
    ${JSON.stringify(schemaContext.availableFields, null, 2)}

    CSV headers to map:
    ${headers.join(', ')}

    Return an array of mappings. If no reasonable mappings can be found for a CSV header, omit it entirely.
  `;

  const { object: mappings } = await generateObject({
    model,
    providerOptions: {
      openrouter: {
        parallelToolCalls: false
      }
    },
    schema: BulkDataLoadSchema,
    prompt
  });

  console.log('Generated field mappings:', mappings);
  return mappings;
}

/**
 * Load GraphDatabase from stored describe embed URL
 * @param credentials User Salesforce credentials
 * @returns GraphDatabase instance
 */
async function loadGraphDatabase(credentials: StoredSalesforceCredentials): Promise<GraphDatabase> {
  if (!credentials.describeEmbedUrl) {
    throw new Error('No describe embed URL found in credentials');
  }

  try {
    const response = await fetch(credentials.describeEmbedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema data: ${response.status}`);
    }

    const jsonData = await response.json();
    const graph = GraphDatabase.fromJSON(jsonData);

    if (!graph.success || !graph.data) {
      throw new Error('Failed to load GraphDatabase from stored schema');
    }

    return graph.data;
  } catch (error) {
    console.error('Error loading GraphDatabase:', error);
    throw new Error(`Failed to load schema data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Tool: Bulk Data Load Field Mapping
export const bulkDataLoadTool = (subId: string) => {
  return tool({
    description: 'Generate intelligent field mappings between CSV headers and Salesforce fields for bulk data loading operations.',
    inputSchema: z.object({
      sobject: z.string().describe('The Salesforce object API name (e.g., Account, Contact, Opportunity)'),
      dmlOperation: z.enum(['insert', 'update', 'upsert', 'delete']).describe('The type of DML operation to perform'),
      headers: z.string().describe('Comma-separated list of CSV column headers to map to Salesforce fields'),
      fileUrl: z.string().describe('URL of the CSV file to be processed')
    }),
    execute: async ({ sobject, headers, fileUrl, dmlOperation }: { sobject: string; headers: string; fileUrl: string; dmlOperation: 'insert' | 'update' | 'upsert' | 'delete' }) => {
      // Validate required inputs
      if (!subId) {
        throw new Error('subId is required for Salesforce authentication');
      }

      if (!sobject || sobject.trim().length === 0) {
        throw new Error('sobject is required');
      }

      if (!headers || headers.trim().length === 0) {
        throw new Error('headers is required');
      }

      // Parse headers
      const csvHeaders = headers.split(',').map(h => h.trim()).filter(h => h.length > 0);
      if (csvHeaders.length === 0) {
        throw new Error('No valid CSV headers provided');
      }

      console.log(`Generating field mappings for sobject: ${sobject}, headers: ${csvHeaders.join(', ')}`);

      try {
        // Get user credentials
        const credentials = await getSalesforceCredentialsBySub(subId);
        if (!credentials) {
          throw new Error('Failed to retrieve Salesforce credentials');
        }

        // Load GraphDatabase from stored schema
        const graphDb = await loadGraphDatabase(credentials);

        // Generate field mappings using AI
        const mappings = await generateFieldMappings(sobject, csvHeaders, graphDb);

        return {
          sobject,
          mappings,
          fileUrl,
          dmlOperation,
          metadata: {
            totalCsvHeaders: csvHeaders.length,
            successfulMappings: mappings.length,
            unmappedHeaders: csvHeaders.filter(h => !mappings.some(m => m.csvField === h))
          }
        } as BulkDataLoadMappingType;

      } catch (error: any) {
        console.error('Bulk data load mapping failed:', error.message);
        throw new Error(error.message || String(error));
      }
    },
  });
};

/**
 * OVERVIEW
 *
 * - Purpose: Provide AI-powered field mapping between CSV data and Salesforce objects for bulk operations
 * - Assumptions: User has valid Salesforce credentials with stored schema data, AI SDK available
 * - Edge Cases: Handles missing schema data, invalid sobject names, unmappable fields gracefully
 * - How it fits into the system: Enables intelligent data import workflows in CRM data loader components
 * - Future Improvements:
 *   - Add caching for frequently used mappings
 *   - Support for custom object relationships
 *   - Validation of data type compatibility
 *   - Batch processing for large header sets
 */

/*
 * === bulkDataLoad.ts ===
 * Updated: 2025-10-11 00:00
 * Summary: AI-powered CSV to Salesforce field mapping tool
 * Key Components:
 *   - bulkDataLoadTool: Main tool function for AI integration
 *   - generateFieldMappings: Core AI-powered mapping logic
 *   - loadGraphDatabase: Schema data loading from stored URLs
 * Dependencies:
 *   - Requires: ai SDK, GraphDatabase, Salesforce credentials, schema analyzer
 * Version History:
 *   v1.0 – initial implementation with AI-powered field mapping
 * Notes:
 *   - Uses semantic matching for intelligent field discovery
 *   - Only returns successful mappings, filtering out unmappable fields
 *   - Integrates with existing GraphDatabase schema storage
 */