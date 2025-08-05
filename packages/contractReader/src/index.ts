// === index.ts ===
// Created: 2025-08-02 15:30
// Purpose: Main entry point for contractReader package
// Exports:
//   - All services, components, types, and tools
//   - Factory functions for easy integration
// Notes:
//   - Provides clean API for external consumption

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
export { AdobeOCRService } from './services/AdobeOCRService.js';
export { SalesforceService } from './services/SalesforceService.js';
export { ContractExtractionService } from './services/ContractExtractionService.js';

// React Components
export { ContractViewer } from './components/ContractViewer.js';
export { ContractList } from './components/ContractList.js';
export type { ContractViewerProps } from './components/ContractViewer.js';
export type { ContractListProps } from './components/ContractList.js';

// AI Tools
export { 
  createContractReaderTool,
  createFileProcessorTool 
} from './tools/contractReaderTool.js';

// Types and Interfaces
export type {
  ContractData,
  DocumentInfo,
  ContentDocumentLink,
  ProcessingOptions,
  ProcessingResult,
  AdobeOCROptions,
  AdobeOCRResponse,
  FileUploadInfo,
  JobStatusResponse,
} from './types/index.js';

export {
  ContractDataSchema,
  ContractReaderError,
  SalesforceError,
  AdobeOCRError,
  AIExtractionError,
} from './types/index.js';

// Utility Functions
export {
  detectFileType,
  validateFileSize,
  sanitizeFileName,
  getFileExtension,
  createSafeFileName,
  bufferToBase64,
  base64ToBuffer,
  estimateProcessingTime,
} from './utils/fileUtils.js';

export type { FileInfo } from './utils/fileUtils.js';

// Factory Functions for Common Use Cases

import { Connection } from 'jsforce';
import { ContractExtractionService } from './services/ContractExtractionService.js';
import { createContractReaderTool } from './tools/contractReaderTool.js';

/**
 * Create a complete contract reader setup with all services configured
 * @param salesforceConnection Authenticated Salesforce connection
 * @param options Configuration options
 * @returns Configured extraction service and AI tool
 */
export function createContractReader(
  salesforceConnection: Connection,
  options: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
  } = {}
) {
  const extractionService = new ContractExtractionService(
    salesforceConnection,
    options
  );

  const aiTool = createContractReaderTool(salesforceConnection, options);

  return {
    extractionService,
    aiTool,
    
    // Convenience methods
    async processContract(contractId: string, processingOptions?: any) {
      return extractionService.extractFromSalesforce(contractId, processingOptions);
    },
    
    async processFile(fileBuffer: Buffer, fileName: string, processingOptions?: any) {
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
export function validateEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
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
export const packageInfo = {
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
