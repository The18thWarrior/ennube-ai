"use strict";
// === types/index.ts ===
// Created: 2025-08-02 15:30
// Purpose: Type definitions for contract reader functionality
// Exports:
//   - ContractData: Structured contract information
//   - DocumentInfo: Salesforce document metadata
//   - ProcessingOptions: Configuration for document processing
// Notes:
//   - Based on n8n workflow output structure
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIExtractionError = exports.AdobeOCRError = exports.SalesforceError = exports.ContractReaderError = exports.ContractDataSchema = void 0;
const zod_1 = require("zod");
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
exports.ContractDataSchema = zod_1.z.object({
    contractSummary: zod_1.z.string().optional(),
    contractType: zod_1.z.string().optional(),
    contractStartDate: zod_1.z.string().optional(),
    contractEndDate: zod_1.z.string().optional(),
    customer: zod_1.z.string().optional(),
    customerAddress: zod_1.z.string().optional(),
    contractTerms: zod_1.z.string().optional(),
    productsSold: zod_1.z.string().optional(),
    contractAmount: zod_1.z.string().optional(),
    subscription: zod_1.z.string().optional(),
    subscriptionProduct: zod_1.z.string().optional(),
    customerSignor: zod_1.z.string().optional(),
    customerSignedDate: zod_1.z.string().optional(),
    companySignor: zod_1.z.string().optional(),
    companySignedDate: zod_1.z.string().optional(),
});
// Error types for better error handling
class ContractReaderError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ContractReaderError';
    }
}
exports.ContractReaderError = ContractReaderError;
class SalesforceError extends ContractReaderError {
    constructor(message, details) {
        super(message, 'SALESFORCE_ERROR', details);
    }
}
exports.SalesforceError = SalesforceError;
class AdobeOCRError extends ContractReaderError {
    constructor(message, details) {
        super(message, 'ADOBE_OCR_ERROR', details);
    }
}
exports.AdobeOCRError = AdobeOCRError;
class AIExtractionError extends ContractReaderError {
    constructor(message, details) {
        super(message, 'AI_EXTRACTION_ERROR', details);
    }
}
exports.AIExtractionError = AIExtractionError;
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
//# sourceMappingURL=index.js.map