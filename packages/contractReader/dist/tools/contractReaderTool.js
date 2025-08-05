"use strict";
// === tools/contractReaderTool.ts ===
// Created: 2025-08-02 15:30
// Purpose: AI tool implementation for external consumption of contract reader functionality
// Exports:
//   - createContractReaderTool(): Factory function for AI tool creation
//   - ContractReaderTool: Tool class implementing AI tool interface
// Notes:
//   - Uses `ai` library for tool integration
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContractReaderTool = createContractReaderTool;
exports.createFileProcessorTool = createFileProcessorTool;
const zod_1 = require("zod");
const ContractExtractionService_js_1 = require("../services/ContractExtractionService.js");
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
const ContractReaderInputSchema = zod_1.z.object({
    contractId: zod_1.z.string().describe('Salesforce Contract ID to process'),
    options: zod_1.z.object({
        skipOCR: zod_1.z.boolean().optional().describe('Skip OCR processing for PDFs'),
        extractTables: zod_1.z.boolean().optional().describe('Extract table data from documents'),
        includeRawText: zod_1.z.boolean().optional().describe('Include raw extracted text in response'),
        aiModel: zod_1.z.enum(['deepseek', 'openai', 'anthropic']).optional().describe('AI model to use for extraction'),
    }).optional().describe('Processing options'),
});
// File processor input schema and type
const FileProcessorInputSchema = zod_1.z.object({
    fileBase64: zod_1.z.string().describe('Base64 encoded file content'),
    fileName: zod_1.z.string().describe('Original filename with extension'),
    options: zod_1.z.object({
        skipOCR: zod_1.z.boolean().optional().describe('Skip OCR processing for PDFs'),
        extractTables: zod_1.z.boolean().optional().describe('Extract table data from documents'),
        includeRawText: zod_1.z.boolean().optional().describe('Include raw extracted text in response'),
    }).optional().describe('Processing options'),
});
/**
 * Create a contract reader tool instance
 * @param salesforceConnection Authenticated Salesforce connection
 * @param serviceOptions Configuration options for underlying services
 * @returns AI tool for contract processing
 */
function createContractReaderTool(salesforceConnection, serviceOptions = {}) {
    const extractionService = new ContractExtractionService_js_1.ContractExtractionService(salesforceConnection, serviceOptions);
    return async function contractReader({ contractId, options }) {
        options = options || {};
        try {
            if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
                return {
                    success: false,
                    error: 'Adobe OCR credentials not configured',
                    results: [],
                };
            }
            const results = await extractionService.extractFromSalesforce(contractId, options);
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
        }
        catch (error) {
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
function createFileProcessorTool(serviceOptions = {}) {
    // Create a mock Salesforce connection for direct file processing
    const mockConnection = {
        instanceUrl: '',
        accessToken: '',
    };
    const extractionService = new ContractExtractionService_js_1.ContractExtractionService(mockConnection, serviceOptions);
    const FileProcessorInputSchema = zod_1.z.object({
        fileBase64: zod_1.z.string().describe('Base64 encoded file content'),
        fileName: zod_1.z.string().describe('Original filename with extension'),
        options: zod_1.z.object({
            skipOCR: zod_1.z.boolean().optional().describe('Skip OCR processing for PDFs'),
            extractTables: zod_1.z.boolean().optional().describe('Extract table data from documents'),
            includeRawText: zod_1.z.boolean().optional().describe('Include raw extracted text in response'),
        }).optional().describe('Processing options'),
    });
    return async function fileProcessor({ fileBase64 = '', fileName = '', options }) {
        options = options || {};
        try {
            if (!process.env.ADOBE_CLIENT_ID || !process.env.ADOBE_CLIENT_SECRET) {
                return {
                    success: false,
                    error: 'Adobe OCR credentials not configured',
                };
            }
            const fileBuffer = Buffer.from(fileBase64, 'base64');
            const result = await extractionService.processContract(fileBuffer, fileName, options);
            return {
                success: result.success,
                contractData: result.contractData,
                processingTimeMs: result.processingTimeMs,
                error: result.error,
                rawText: options.includeRawText ? result.rawText : undefined,
            };
        }
        catch (error) {
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
//# sourceMappingURL=contractReaderTool.js.map