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
export declare const ContractDataSchema: z.ZodObject<{
    contractSummary: z.ZodOptional<z.ZodString>;
    contractType: z.ZodOptional<z.ZodString>;
    contractStartDate: z.ZodOptional<z.ZodString>;
    contractEndDate: z.ZodOptional<z.ZodString>;
    customer: z.ZodOptional<z.ZodString>;
    customerAddress: z.ZodOptional<z.ZodString>;
    contractTerms: z.ZodOptional<z.ZodString>;
    productsSold: z.ZodOptional<z.ZodString>;
    contractAmount: z.ZodOptional<z.ZodString>;
    subscription: z.ZodOptional<z.ZodString>;
    subscriptionProduct: z.ZodOptional<z.ZodString>;
    customerSignor: z.ZodOptional<z.ZodString>;
    customerSignedDate: z.ZodOptional<z.ZodString>;
    companySignor: z.ZodOptional<z.ZodString>;
    companySignedDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
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
export declare class ContractReaderError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class SalesforceError extends ContractReaderError {
    constructor(message: string, details?: any);
}
export declare class AdobeOCRError extends ContractReaderError {
    constructor(message: string, details?: any);
}
export declare class AIExtractionError extends ContractReaderError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=index.d.ts.map