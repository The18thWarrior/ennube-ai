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
export { AdobeOCRService } from './services/AdobeOCRService.js';
export { SalesforceService } from './services/SalesforceService.js';
export { ContractExtractionService } from './services/ContractExtractionService.js';
export { ContractViewer } from './components/ContractViewer.js';
export { ContractList } from './components/ContractList.js';
export type { ContractViewerProps } from './components/ContractViewer.js';
export type { ContractListProps } from './components/ContractList.js';
export { createContractReaderTool, createFileProcessorTool } from './tools/contractReaderTool.js';
export type { ContractData, DocumentInfo, ContentDocumentLink, ProcessingOptions, ProcessingResult, AdobeOCROptions, AdobeOCRResponse, FileUploadInfo, JobStatusResponse, } from './types/index.js';
export { ContractDataSchema, ContractReaderError, SalesforceError, AdobeOCRError, AIExtractionError, } from './types/index.js';
export { detectFileType, validateFileSize, sanitizeFileName, getFileExtension, createSafeFileName, bufferToBase64, base64ToBuffer, estimateProcessingTime, } from './utils/fileUtils.js';
export type { FileInfo } from './utils/fileUtils.js';
import { Connection } from 'jsforce';
import { ContractExtractionService } from './services/ContractExtractionService.js';
/**
 * Create a complete contract reader setup with all services configured
 * @param salesforceConnection Authenticated Salesforce connection
 * @param options Configuration options
 * @returns Configured extraction service and AI tool
 */
export declare function createContractReader(salesforceConnection: Connection, options?: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
}): {
    extractionService: ContractExtractionService;
    aiTool: ({ contractId, options }: {
        contractId: string;
        options?: {
            includeRawText?: boolean | undefined;
            extractTables?: boolean | undefined;
            skipOCR?: boolean | undefined;
            aiModel?: "deepseek" | "openai" | "anthropic" | undefined;
        } | undefined;
    }) => Promise<{
        success: boolean;
        error: string;
        results: never[];
        totalDocuments?: undefined;
        successfulExtractions?: undefined;
        failedExtractions?: undefined;
        contractData?: undefined;
        processingTimeMs?: undefined;
        errors?: undefined;
        rawText?: undefined;
    } | {
        success: boolean;
        totalDocuments: number;
        successfulExtractions: number;
        failedExtractions: number;
        contractData: {
            contractSummary?: string | undefined;
            contractType?: string | undefined;
            contractStartDate?: string | undefined;
            contractEndDate?: string | undefined;
            customer?: string | undefined;
            customerAddress?: string | undefined;
            contractTerms?: string | undefined;
            productsSold?: string | undefined;
            contractAmount?: string | undefined;
            subscription?: string | undefined;
            subscriptionProduct?: string | undefined;
            customerSignor?: string | undefined;
            customerSignedDate?: string | undefined;
            companySignor?: string | undefined;
            companySignedDate?: string | undefined;
        }[];
        processingTimeMs: number;
        errors: (string | undefined)[];
        rawText: (string | undefined)[] | null;
        error?: undefined;
        results?: undefined;
    }>;
    processContract(contractId: string, processingOptions?: any): Promise<import("./types/index.js").ProcessingResult[]>;
    processFile(fileBuffer: Buffer, fileName: string, processingOptions?: any): Promise<import("./types/index.js").ProcessingResult>;
    testConnections(): Promise<{
        salesforce: boolean;
        adobeOCR: boolean;
        ai: boolean;
    }>;
};
/**
 * Environment variable validation helper
 */
export declare function validateEnvironment(): {
    isValid: boolean;
    missing: string[];
    warnings: string[];
};
/**
 * Get package version and build info
 */
export declare const packageInfo: {
    name: string;
    version: string;
    description: string;
    features: string[];
    supportedFormats: string[];
    requirements: {
        node: string;
        react: string;
        salesforce: string;
    };
};
//# sourceMappingURL=index.d.ts.map