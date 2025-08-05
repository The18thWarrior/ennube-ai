// === types/index.ts ===
// Created: 2025-08-02 15:30
// Purpose: Type definitions for contract reader functionality
// Exports:
//   - ContractData: Structured contract information
//   - DocumentInfo: Salesforce document metadata
//   - ProcessingOptions: Configuration for document processing
// Notes:
//   - Based on n8n workflow output structure

import { z } from 'zod';

/**
 * OVERVIEW
 * 
 * Type definitions for the contract reader package. These types are based on
 * the structured output from the n8n workflow and provide type safety for
 * contract data extraction, document processing, and Salesforce integration.
 * 
 * Key assumptions:
 * - Contract dates may be in various formats and need parsing
 * - Not all contract fields will always be present
 * - Document processing may fail and needs error handling
 * 
 * Future improvements:
 * - Add validation schemas for different contract types
 * - Support for multi-language contracts
 * - Enhanced error categorization
 */

// Zod schema for contract data validation
export const ContractDataSchema = z.object({
  contractSummary: z.string().optional(),
  contractType: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  customer: z.string().optional(),
  customerAddress: z.string().optional(),
  contractTerms: z.string().optional(),
  productsSold: z.string().optional(),
  contractAmount: z.string().optional(),
  subscription: z.string().optional(),
  subscriptionProduct: z.string().optional(),
  customerSignor: z.string().optional(),
  customerSignedDate: z.string().optional(),
  companySignor: z.string().optional(),
  companySignedDate: z.string().optional(),
});

export type ContractData = z.infer<typeof ContractDataSchema>;

export interface DocumentInfo {
  id: string;
  title: string;
  fileExtension: string;
  fileType: string;
  contentSize: number;
  versionData: string;
  createdDate: string;
  ownerId: string;
  parentId?: string;
}

export interface ContentDocumentLink {
  id: string;
  linkedEntityId: string;
  contentDocumentId: string;
}

export interface ProcessingOptions {
  skipOCR?: boolean;
  aiModel?: 'deepseek' | 'openai' | 'anthropic';
  extractTables?: boolean;
  includeRawText?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  contractData: ContractData;
  rawText?: string;
  error?: string;
  processingTimeMs: number;
}

export interface AdobeOCROptions {
  elementsToExtract: ('text' | 'tables')[];
  clientId: string;
  clientSecret: string;
}

export interface AdobeOCRResponse {
  version: {
    json_export: string;
    page_segmentation: string;
    schema: string;
    structure: string;
    table_structure: string;
  };
  extended_metadata: {
    page_count: number;
    pdf_version: string;
    language: string;
    [key: string]: any;
  };
  elements: Array<{
    Text?: string;
    Type?: string;
    Bounds?: number[];
    Font?: any;
    Path?: string;
    Rows?: Array<{
      Cells: Array<{
        Text?: string;
      }>;
    }>;
  }>;
}

export interface FileUploadInfo {
  uploadUri: string;
  assetID: string;
}

export interface JobStatusResponse {
  status: 'in-progress' | 'done' | 'failed';
  content?: {
    downloadUri: string;
  };
  error?: string;
}

// Error types for better error handling
export class ContractReaderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ContractReaderError';
  }
}

export class SalesforceError extends ContractReaderError {
  constructor(message: string, details?: any) {
    super(message, 'SALESFORCE_ERROR', details);
  }
}

export class AdobeOCRError extends ContractReaderError {
  constructor(message: string, details?: any) {
    super(message, 'ADOBE_OCR_ERROR', details);
  }
}

export class AIExtractionError extends ContractReaderError {
  constructor(message: string, details?: any) {
    super(message, 'AI_EXTRACTION_ERROR', details);
  }
}

/*
 * === types/index.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: Comprehensive type definitions for contract reading functionality
 * Key Components:
 *   - ContractData: Structured contract information with validation
 *   - DocumentInfo: Salesforce document metadata
 *   - ProcessingOptions: Configuration for document processing
 *   - Error classes: Specific error types for different failure modes
 * Dependencies:
 *   - Requires: zod for schema validation
 * Version History:
 *   v1.0 – initial type definitions
 * Notes:
 *   - Optional fields accommodate incomplete contract data
 *   - Zod schema enables runtime validation
 */
