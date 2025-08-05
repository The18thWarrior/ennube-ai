"use strict";
// === index.ts ===
// Created: 2025-08-02 15:30
// Purpose: Main entry point for contractReader package
// Exports:
//   - All services, components, types, and tools
//   - Factory functions for easy integration
// Notes:
//   - Provides clean API for external consumption
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageInfo = exports.estimateProcessingTime = exports.base64ToBuffer = exports.bufferToBase64 = exports.createSafeFileName = exports.getFileExtension = exports.sanitizeFileName = exports.validateFileSize = exports.detectFileType = exports.AIExtractionError = exports.AdobeOCRError = exports.SalesforceError = exports.ContractReaderError = exports.ContractDataSchema = exports.createFileProcessorTool = exports.createContractReaderTool = exports.ContractList = exports.ContractViewer = exports.ContractExtractionService = exports.SalesforceService = exports.AdobeOCRService = void 0;
exports.createContractReader = createContractReader;
exports.validateEnvironment = validateEnvironment;
/**
 * OVERVIEW
 *
 * Main entry point for the contractReader package. Exports all public APIs
 * including services, React components, TypeScript types, and AI tools.
 *
 * Key exports:
 * - Services for OCR, Salesforce, and contract extraction
 * - React components for UI integration
 * - AI tools for external consumption
 * - TypeScript types for type safety
 *
 * This package replicates the n8n "Contracts Reader Runbeck" workflow
 * in a reusable TypeScript library with React components and AI tools.
 */
// Core Services
var AdobeOCRService_js_1 = require("./services/AdobeOCRService.js");
Object.defineProperty(exports, "AdobeOCRService", { enumerable: true, get: function () { return AdobeOCRService_js_1.AdobeOCRService; } });
var SalesforceService_js_1 = require("./services/SalesforceService.js");
Object.defineProperty(exports, "SalesforceService", { enumerable: true, get: function () { return SalesforceService_js_1.SalesforceService; } });
var ContractExtractionService_js_1 = require("./services/ContractExtractionService.js");
Object.defineProperty(exports, "ContractExtractionService", { enumerable: true, get: function () { return ContractExtractionService_js_1.ContractExtractionService; } });
// React Components
var ContractViewer_js_1 = require("./components/ContractViewer.js");
Object.defineProperty(exports, "ContractViewer", { enumerable: true, get: function () { return ContractViewer_js_1.ContractViewer; } });
var ContractList_js_1 = require("./components/ContractList.js");
Object.defineProperty(exports, "ContractList", { enumerable: true, get: function () { return ContractList_js_1.ContractList; } });
// AI Tools
var contractReaderTool_js_1 = require("./tools/contractReaderTool.js");
Object.defineProperty(exports, "createContractReaderTool", { enumerable: true, get: function () { return contractReaderTool_js_1.createContractReaderTool; } });
Object.defineProperty(exports, "createFileProcessorTool", { enumerable: true, get: function () { return contractReaderTool_js_1.createFileProcessorTool; } });
var index_js_1 = require("./types/index.js");
Object.defineProperty(exports, "ContractDataSchema", { enumerable: true, get: function () { return index_js_1.ContractDataSchema; } });
Object.defineProperty(exports, "ContractReaderError", { enumerable: true, get: function () { return index_js_1.ContractReaderError; } });
Object.defineProperty(exports, "SalesforceError", { enumerable: true, get: function () { return index_js_1.SalesforceError; } });
Object.defineProperty(exports, "AdobeOCRError", { enumerable: true, get: function () { return index_js_1.AdobeOCRError; } });
Object.defineProperty(exports, "AIExtractionError", { enumerable: true, get: function () { return index_js_1.AIExtractionError; } });
// Utility Functions
var fileUtils_js_1 = require("./utils/fileUtils.js");
Object.defineProperty(exports, "detectFileType", { enumerable: true, get: function () { return fileUtils_js_1.detectFileType; } });
Object.defineProperty(exports, "validateFileSize", { enumerable: true, get: function () { return fileUtils_js_1.validateFileSize; } });
Object.defineProperty(exports, "sanitizeFileName", { enumerable: true, get: function () { return fileUtils_js_1.sanitizeFileName; } });
Object.defineProperty(exports, "getFileExtension", { enumerable: true, get: function () { return fileUtils_js_1.getFileExtension; } });
Object.defineProperty(exports, "createSafeFileName", { enumerable: true, get: function () { return fileUtils_js_1.createSafeFileName; } });
Object.defineProperty(exports, "bufferToBase64", { enumerable: true, get: function () { return fileUtils_js_1.bufferToBase64; } });
Object.defineProperty(exports, "base64ToBuffer", { enumerable: true, get: function () { return fileUtils_js_1.base64ToBuffer; } });
Object.defineProperty(exports, "estimateProcessingTime", { enumerable: true, get: function () { return fileUtils_js_1.estimateProcessingTime; } });
const ContractExtractionService_js_2 = require("./services/ContractExtractionService.js");
const contractReaderTool_js_2 = require("./tools/contractReaderTool.js");
/**
 * Create a complete contract reader setup with all services configured
 * @param salesforceConnection Authenticated Salesforce connection
 * @param options Configuration options
 * @returns Configured extraction service and AI tool
 */
function createContractReader(salesforceConnection, options = {}) {
    const extractionService = new ContractExtractionService_js_2.ContractExtractionService(salesforceConnection, options);
    const aiTool = (0, contractReaderTool_js_2.createContractReaderTool)(salesforceConnection, options);
    return {
        extractionService,
        aiTool,
        // Convenience methods
        async processContract(contractId, processingOptions) {
            return extractionService.extractFromSalesforce(contractId, processingOptions);
        },
        async processFile(fileBuffer, fileName, processingOptions) {
            return extractionService.processContract(fileBuffer, fileName, processingOptions);
        },
        async testConnections() {
            return extractionService.testConnections();
        },
    };
}
/**
 * Environment variable validation helper
 */
function validateEnvironment() {
    const required = ['ADOBE_CLIENT_ID', 'ADOBE_CLIENT_SECRET'];
    const optional = ['DEEPSEEK_API_KEY'];
    const missing = required.filter(key => !process.env[key]);
    const warnings = optional.filter(key => !process.env[key]);
    return {
        isValid: missing.length === 0,
        missing,
        warnings,
    };
}
/**
 * Get package version and build info
 */
exports.packageInfo = {
    name: '@ennube/contract-reader',
    version: '1.0.0',
    description: 'AI-powered contract reading and extraction service with Salesforce integration',
    features: [
        'Adobe PDF OCR integration',
        'Salesforce document retrieval',
        'AI-powered contract data extraction',
        'React components for UI',
        'TypeScript type safety',
        'AI tool integration',
    ],
    supportedFormats: ['PDF', 'DOCX', 'TXT'],
    requirements: {
        node: '>=16.0.0',
        react: '>=18.0.0',
        salesforce: 'API v59.0+',
    },
};
/*
 * === index.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: Main package entry point with complete API exports
 * Key Components:
 *   - All service classes and React components
 *   - AI tools for external integration
 *   - Type definitions and utility functions
 *   - Factory functions for easy setup
 * Dependencies:
 *   - Requires: All internal modules
 * Version History:
 *   v1.0 – initial package exports
 * Notes:
 *   - Provides clean, comprehensive API for external use
 *   - Includes convenience methods and environment validation
 */
//# sourceMappingURL=index.js.map