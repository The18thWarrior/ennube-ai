// === tools/contractReaderTool.ts ===
// Created: 2025-08-02 15:30
// Purpose: AI tool implementation for external consumption of contract reader functionality
// Exports:
//   - createContractReaderTool(): Factory function for AI tool creation
//   - ContractReaderTool: Tool class implementing AI tool interface
// Notes:
//   - Uses `ai` library for tool integration

import { tool } from 'ai';
import { z } from 'zod';
import { Connection } from 'jsforce';
import { ContractExtractionService } from '../services/ContractExtractionService.js';
import { ProcessingOptions } from '../types/index.js';

/**
 * OVERVIEW
 * 
 * AI Tool wrapper for contract reader functionality. This tool exposes
 * the contract extraction workflow through the `ai` library's tool interface,
 * allowing external AI systems to process contracts from Salesforce.
 * 
 * Key capabilities:
 * - Extract contract data from Salesforce records
 * - Process PDF documents with OCR
 * - Return structured contract information
 * - Handle multiple documents per contract
 * 
 * Assumptions:
 * - Salesforce connection is provided and authenticated
 * - Adobe and AI service credentials are available in environment
 * - Tool will be called by AI agents with proper parameters
 * 
 * Future Improvements:
 * - Support for batch processing multiple contracts
 * - Enhanced error reporting for AI systems
 * - Caching mechanisms for frequently accessed contracts
 */

// Input schema for the contract reader tool
const ContractReaderInputSchema = z.object({
  contractId: z.string().describe('Salesforce Contract ID to process'),
  options: z.object({
    skipOCR: z.boolean().optional().describe('Skip OCR processing for PDFs'),
    extractTables: z.boolean().optional().describe('Extract table data from documents'),
    includeRawText: z.boolean().optional().describe('Include raw extracted text in response'),
    aiModel: z.enum(['deepseek', 'openai', 'anthropic']).optional().describe('AI model to use for extraction'),
  }).optional().describe('Processing options'),
});

type ContractReaderInput = z.infer<typeof ContractReaderInputSchema>;

// File processor input schema and type
const FileProcessorInputSchema = z.object({
  fileBase64: z.string().describe('Base64 encoded file content'),
  fileName: z.string().describe('Original filename with extension'),
  options: z.object({
    skipOCR: z.boolean().optional().describe('Skip OCR processing for PDFs'),
    extractTables: z.boolean().optional().describe('Extract table data from documents'),
    includeRawText: z.boolean().optional().describe('Include raw extracted text in response'),
  }).optional().describe('Processing options'),
});
type FileProcessorInput = z.infer<typeof FileProcessorInputSchema>;

/**
 * Create a contract reader tool instance
 * @param salesforceConnection Authenticated Salesforce connection
 * @param serviceOptions Configuration options for underlying services
 * @returns AI tool for contract processing
 */
export function createContractReaderTool(
  salesforceConnection: Connection,
  serviceOptions: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
  } = {}
) {
  const extractionService = new ContractExtractionService(
    salesforceConnection,
    serviceOptions
  );

  return async function contractReader({ contractId, options }: ContractReaderInput) {
    options = options || {};
    try {
      if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
        return {
          success: false,
          error: 'Adobe OCR credentials not configured',
          results: [],
        };
      }
      const results = await extractionService.extractFromSalesforce(
        contractId,
        options as ProcessingOptions
      );
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      return {
        success: successfulResults.length > 0,
        totalDocuments: results.length,
        successfulExtractions: successfulResults.length,
        failedExtractions: failedResults.length,
        contractData: successfulResults.map(r => r.contractData),
        processingTimeMs: results.reduce((sum, r) => sum + r.processingTimeMs, 0),
        errors: failedResults.map(r => r.error).filter(Boolean),
        rawText: options.includeRawText 
          ? successfulResults.map(r => r.rawText).filter(Boolean)
          : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        results: [],
      };
    }
  };
}

/**
 * Create a simplified contract reader tool for direct file processing
 * @param serviceOptions Configuration options for underlying services
 * @returns AI tool for direct file processing
 */
export function createFileProcessorTool(
  serviceOptions: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
  } = {}
) {
  // Create a mock Salesforce connection for direct file processing
  const mockConnection = {
    instanceUrl: '',
    accessToken: '',
  } as Connection;

  const extractionService = new ContractExtractionService(
    mockConnection,
    serviceOptions
  );

  const FileProcessorInputSchema = z.object({
    fileBase64: z.string().describe('Base64 encoded file content'),
    fileName: z.string().describe('Original filename with extension'),
    options: z.object({
      skipOCR: z.boolean().optional().describe('Skip OCR processing for PDFs'),
      extractTables: z.boolean().optional().describe('Extract table data from documents'),
      includeRawText: z.boolean().optional().describe('Include raw extracted text in response'),
    }).optional().describe('Processing options'),
  });

  return async function fileProcessor({ fileBase64 = '', fileName = '', options }: FileProcessorInput) {
    options = options || {};
    try {
      if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
        return {
          success: false,
          error: 'Adobe OCR credentials not configured',
        };
      }
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      const result = await extractionService.processContract(
        fileBuffer,
        fileName,
        options as ProcessingOptions
      );
      return {
        success: result.success,
        contractData: result.contractData,
        processingTimeMs: result.processingTimeMs,
        error: result.error,
        rawText: options.includeRawText ? result.rawText : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  };
}

/*
 * === tools/contractReaderTool.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: AI tool interface for contract reading functionality
 * Key Components:
 *   - createContractReaderTool(): Main Salesforce integration tool
 *   - createFileProcessorTool(): Direct file processing tool
 *   - createConnectionTestTool(): Service connectivity testing
 *   - Zod schemas for input validation
 * Dependencies:
 *   - Requires: ai library, zod, jsforce, ContractExtractionService
 * Version History:
 *   v1.0 – initial AI tool implementation
 * Notes:
 *   - Exposes complete n8n workflow as AI-consumable tools
 *   - Handles both Salesforce and direct file processing workflows
 */
