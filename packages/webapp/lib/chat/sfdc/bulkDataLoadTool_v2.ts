// === bulkDataLoadTool_v2.ts ===
// Created: 2025-10-13 00:00
// Purpose: Enhanced AI-powered CSV to Salesforce field mapping tool with direct file processing
// Exports:
//   - bulkDataLoadTool_v2: Tool for intelligent field mapping with inline CSV parsing
// Interactions:
//   - Used by: CRM data loader components for automated field mapping
// Notes:
//   - Processes CSV files directly from message attachments
//   - Uses GraphDatabase for schema analysis and AI for intelligent mapping
//   - Supports multiple data formats (data URLs, base64, signed URLs, ArrayBuffer)

import { tool, CoreMessage, generateObject, UIMessage, ModelMessage } from "ai";
import z from "zod/v4";
import { getSalesforceCredentialsBySub, StoredSalesforceCredentials } from "@/lib/db/salesforce-storage";
import { loadSchemaFromJSON, createSchemaAnalyzer, GraphDatabase } from '@/lib/graph';
import getModel from "../getModel";
import { FieldMappingSchema, BulkDataLoadMappingType } from "@/lib/types";

// Configuration constants
const MAX_BYTES = 100 * 1024 * 1024; // 100MB hard cap
const DEFAULT_SAMPLE_SIZE = 50; // Rows to sample for type inference

/**
 * Type definitions for file parts in message content
 */
type FilePart = {
  type: 'file';
  data: string | ArrayBuffer | Uint8Array | { href?: string } | URL;
  filename?: string;
  mediaType: string;
};

/**
 * Schema for the complete mapping response
 */
export const BulkDataLoadSchema = z.array(FieldMappingSchema);

/**
 * Check if media type indicates CSV content
 */
function isCsvMediaType(mt?: string): boolean {
  if (!mt) return false;
  const t = mt.toLowerCase();
  return t === 'text/csv' || 
         t === 'application/csv' || 
         t.includes('spreadsheet') || 
         t === 'text/plain';
}

/**
 * Check if filename indicates CSV file
 */
function isCsvFilename(fn?: string): boolean {
  return !!fn && fn.toLowerCase().endsWith('.csv');
}

/**
 * Find the most recent CSV file attachment in message history
 * Searches from newest to oldest message
 */
function findNewestCsvFilePart(messages: ModelMessage[]): FilePart | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = (messages[i].content ?? []) as any[];
    for (const p of parts) {
      if (p?.type === 'file' && (isCsvMediaType(p.mediaType) || isCsvFilename(p.filename))) {
        //console.log('Found CSV file part:', p);
        return p as FilePart;
      }
    }
  }
  return undefined;
}

/**
 * Load bytes from various file data formats
 * Supports: data URLs, base64 strings, signed URLs, ArrayBuffer, Uint8Array
 */
async function loadBytes(fp: FilePart): Promise<Uint8Array> {
  // Handle string data (data URL or base64)
  if (typeof fp.data === 'string') {
    const s = fp.data;
    
    // Data URL format
    if (s.startsWith('data:')) {
      const base64 = s.split(',')[1] ?? '';
      return Uint8Array.from(Buffer.from(base64, 'base64'));
    }
    
    // Try base64 decode
    try {
      return Uint8Array.from(Buffer.from(s, 'base64'));
    } catch {
      // Fallback: treat as UTF-8 text
      return new TextEncoder().encode(s);
    }
  }
  
  // Handle URL objects or objects with href
  if (fp.data instanceof URL || typeof (fp.data as any)?.href === 'string') {
    const url = fp.data instanceof URL ? fp.data.toString() : (fp.data as any).href;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  }
  
  // Handle ArrayBuffer
  if (fp.data instanceof ArrayBuffer) {
    return new Uint8Array(fp.data);
  }
  
  // Handle Uint8Array
  if (fp.data instanceof Uint8Array) {
    return fp.data;
  }

  throw new Error('Unsupported file data format.');
}

/**
 * Strip UTF-8 BOM (Byte Order Mark) if present
 */
function stripUtf8Bom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Parse CSV text into rows
 * Simple CSV parser that handles quoted fields and escaped quotes
 */
function parseSimpleCsv(text: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    row.push(currentField.trim());
    rows.push(row);
  }
  
  return rows.filter(row => row.length > 0 && row.some(cell => cell !== ''));
}

/**
 * Infer data types for CSV columns by sampling rows
 * Returns a mapping of column name to inferred type
 */
function inferColumnTypes(
  rows: Record<string, any>[], 
  sampleSize: number = DEFAULT_SAMPLE_SIZE
): Record<string, 'number' | 'boolean' | 'date' | 'string' | 'null'> {
  const types: Record<string, 'number' | 'boolean' | 'date' | 'string' | 'null'> = {};
  
  if (!rows.length) return types;

  const keys = Object.keys(rows[0] ?? {});
  const sample = rows.slice(0, sampleSize);

  for (const k of keys) {
    let kind: typeof types[string] = 'string';
    
    for (const r of sample) {
      const v = r?.[k];
      
      // Handle null/empty values
      if (v === null || v === '') {
        kind = kind === 'string' ? 'string' : kind;
        continue;
      }
      
      const sv = String(v).trim();

      // Check for boolean
      if (/^(true|false)$/i.test(sv)) {
        kind = kind === 'string' ? 'boolean' : kind;
        continue;
      }
      
      // Check for number
      if (!Number.isNaN(Number(sv)) && sv !== '') {
        kind = kind === 'string' ? 'number' : kind;
        continue;
      }
      
      // Check for date (loose check)
      if (!Number.isNaN(Date.parse(sv))) {
        kind = kind === 'string' ? 'date' : kind;
        continue;
      }

      // Default to string if mixed types detected
      kind = 'string';
      break;
    }
    
    types[k] = kind;
  }
  
  return types;
}

/**
 * Parse CSV data from bytes and normalize to array of objects
 */
async function parseCsvData(
  bytes: Uint8Array,
  hasHeader: boolean = true
): Promise<{ rows: Record<string, any>[]; columns: string[]; types: Record<string, any> }> {
  
  // Decode bytes to UTF-8 text
  let text = Buffer.from(bytes).toString('utf8');
  text = stripUtf8Bom(text);

  // Parse CSV using native parser
  const parsedRows = parseSimpleCsv(text);
  
  if (parsedRows.length === 0) {
    return { rows: [], columns: [], types: {} };
  }

  // Normalize to array of objects
  let normalized: Record<string, any>[];
  let columns: string[];
  
  if (hasHeader) {
    // First row is header
    columns = parsedRows[0];
    const dataRows = parsedRows.slice(1);
    
    normalized = dataRows.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach((colName, i) => {
        obj[colName] = row[i] ?? null;
      });
      return obj;
    });
  } else {
    // No header: synthesize column names (col_1, col_2, ...)
    const maxLen = Math.max(...parsedRows.map(r => r.length));
    columns = Array.from({ length: maxLen }, (_, i) => `col_${i + 1}`);
    
    normalized = parsedRows.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach((colName, i) => {
        obj[colName] = row[i] ?? null;
      });
      return obj;
    });
  }

  const types = inferColumnTypes(normalized);

  return { rows: normalized, columns, types };
}

/**
 * Load GraphDatabase from stored describe embed URL
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

/**
 * Generate intelligent field mappings between CSV headers and Salesforce fields
 */
async function generateFieldMappings(
  sobject: string,
  headers: string[],
  csvTypes: Record<string, any>,
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
    csvHeaders: headers,
    csvTypes
  };
  
  //console.log('Schema context prepared:', schemaContext);

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
    - Consider data type compatibility between CSV columns and Salesforce fields
    - Return only successful mappings - omit any CSV fields that cannot be reasonably mapped
    - Preserve the exact CSV field name in the response
    - Include the Salesforce data type for each mapping

    Available Salesforce fields for ${sobject}:
    ${JSON.stringify(schemaContext.availableFields, null, 2)}

    CSV headers with inferred types:
    ${headers.map(h => `${h} (${csvTypes[h] || 'unknown'})`).join(', ')}

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
 * Tool: Bulk Data Load Field Mapping v2
 * Enhanced version with direct CSV file processing from message attachments
 */
export const bulkDataLoadTool = (subId: string) => {
  return tool({
    description: `Parse an attached CSV file and generate intelligent field mappings between CSV headers and Salesforce fields for bulk data loading operations. 
    Automatically detects CSV files in message history and processes them inline.`,
    
    inputSchema: z.object({
      sobject: z.string().describe('The Salesforce object API name (e.g., Account, Contact, Opportunity)'),
      dmlOperation: z.enum(['insert', 'update', 'upsert', 'delete']).describe('The type of DML operation to perform'),
      hasHeader: z.boolean().default(true).describe('Whether the CSV file has a header row'),
      expectedColumns: z.array(z.string()).optional().describe('Optional list of expected column names to validate'),
      returnSample: z.number().int().min(0).max(50).default(5).describe('Number of sample rows to include in response'),
    }),
    
    execute: async ({ 
      sobject, 
      dmlOperation, 
      hasHeader, 
      expectedColumns,
      returnSample 
    }: { 
      sobject: string; 
      dmlOperation: 'insert' | 'update' | 'upsert' | 'delete';
      hasHeader: boolean;
      expectedColumns?: string[];
      returnSample: number;
    }, { messages }) => {
      
      // Validate required inputs
      if (!subId) {
        throw new Error('subId is required for Salesforce authentication');
      }

      if (!sobject || sobject.trim().length === 0) {
        throw new Error('sobject is required');
      }

      console.log(`Processing bulk data load for sobject: ${sobject}, operation: ${dmlOperation}`);

      try {
        // Find CSV attachment in message history
        const filePart = findNewestCsvFilePart(messages);
        if (!filePart) {
          return { 
            ok: false, 
            error: 'No CSV attachment found. Please attach a .csv file to your message.' 
          };
        }

        // Load and validate file size
        // const bytes = await loadBytes(filePart);
        const fileUrl = filePart.data instanceof URL ? filePart.data.toString() : (typeof filePart.data === 'string' ? filePart.data : (filePart.data as any)?.href);
        const fileData = await fetch(fileUrl);
        if (!fileData.ok) {
          return { ok: false, error: `Failed to load CSV file: ${fileData.status} ${fileData.statusText}` };
        } 
        const bytes = new Uint8Array(await fileData.arrayBuffer());
        if (!bytes?.length) {
          return { ok: false, error: 'Could not read CSV bytes.' };
        }
        
        if (bytes.byteLength > MAX_BYTES) {
          return { 
            ok: false, 
            error: `CSV too large (${bytes.byteLength} bytes). Limit is ${MAX_BYTES} bytes.` 
          };
        }

        // Parse CSV data
        const { rows, columns, types } = await parseCsvData(bytes, hasHeader);

        // Validate expected columns if provided
        if (expectedColumns && rows.length) {
          const missing = expectedColumns.filter(c => !columns.includes(c));
          if (missing.length) {
            return { 
              ok: false, 
              error: `Missing expected columns: ${missing.join(', ')}` 
            };
          }
        }

        // Get user credentials
        const credentials = await getSalesforceCredentialsBySub(subId);
        if (!credentials) {
          throw new Error('Failed to retrieve Salesforce credentials');
        }

        // Load GraphDatabase from stored schema
        const graphDb = await loadGraphDatabase(credentials);

        // Generate field mappings using AI
        const mappings = await generateFieldMappings(sobject, columns, types, graphDb);

        // Return comprehensive result
        return {
          ok: true,
          sobject,
          mappings,
          dmlOperation,
          fileUrl,
          csvInfo: {
            filename: filePart.filename ?? 'uploaded.csv',
            totalRows: rows.length,
            columns,
            types,
            sample: returnSample > 0 ? rows.slice(0, returnSample) : [],
          },
          metadata: {
            totalCsvHeaders: columns.length,
            successfulMappings: mappings.length,
            unmappedHeaders: columns.filter(h => !mappings.some(m => m.csvField === h)),
            fileSizeBytes: bytes.byteLength,
          }
        } as BulkDataLoadMappingType;

      } catch (error: any) {
        console.error('Bulk data load mapping failed:', error);
        return {
          ok: false,
          error: error.message || String(error)
        };
      }
    },
  });
};

/**
 * OVERVIEW
 *
 * - Purpose: Enhanced AI-powered field mapping tool that processes CSV files directly from message attachments
 * - Assumptions: 
 *   - User has valid Salesforce credentials with stored schema data
 *   - AI SDK available for intelligent mapping
 *   - CSV files attached as message content parts
 * - Edge Cases: 
 *   - Handles missing schema data, invalid sobject names, unmappable fields gracefully
 *   - Supports multiple file data formats (data URLs, base64, signed URLs, buffers)
 *   - File size validation (12MB limit)
 *   - CSV files with or without headers
 *   - Type inference for better mapping accuracy
 * - How it fits into the system: 
 *   - Enables intelligent data import workflows in CRM data loader components
 *   - Integrates seamlessly with AI chat interface for file processing
 *   - Provides inline CSV parsing without external file storage
 * - Future Improvements:
 *   - Add caching for frequently used mappings
 *   - Support for custom object relationships
 *   - Advanced data type compatibility validation
 *   - Batch processing for large header sets
 *   - Support for additional file formats (Excel, JSON)
 *   - Data transformation rules (e.g., date format conversion)
 *   - Mapping templates for common use cases
 */

/*
 * === bulkDataLoadTool_v2.ts ===
 * Updated: 2025-10-13 00:00
 * Summary: Enhanced AI-powered CSV to Salesforce field mapping tool with inline file processing
 * Key Components:
 *   - bulkDataLoadTool_v2: Main tool function with direct CSV processing
 *   - findNewestCsvFilePart: Locates CSV attachments in message history
 *   - loadBytes: Multi-format file data loading (data URLs, base64, signed URLs, buffers)
 *   - parseCsvData: CSV parsing with header detection and normalization
 *   - inferColumnTypes: Intelligent type inference from CSV data
 *   - generateFieldMappings: Core AI-powered mapping logic with type awareness
 *   - loadGraphDatabase: Schema data loading from stored URLs
 * Dependencies:
 *   - Requires: ai SDK, csv-parse, GraphDatabase, Salesforce credentials, schema analyzer
 * Version History:
 *   v2.0 – Enhanced version with direct file processing from message attachments
 *          Added type inference, file format support, sample data return
 *          Improved error handling and validation
 * Notes:
 *   - Processes files inline without external storage
 *   - Supports multiple file data formats for flexibility
 *   - Type-aware mapping for improved accuracy
 *   - Returns sample data for user validation
 *   - Comprehensive metadata tracking
 */
