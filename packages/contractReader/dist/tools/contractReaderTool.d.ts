import { z } from 'zod';
import { Connection } from 'jsforce';
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
declare const ContractReaderInputSchema: z.ZodObject<{
    contractId: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        skipOCR: z.ZodOptional<z.ZodBoolean>;
        extractTables: z.ZodOptional<z.ZodBoolean>;
        includeRawText: z.ZodOptional<z.ZodBoolean>;
        aiModel: z.ZodOptional<z.ZodEnum<["deepseek", "openai", "anthropic"]>>;
    }, "strip", z.ZodTypeAny, {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
        aiModel?: "deepseek" | "openai" | "anthropic" | undefined;
    }, {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
        aiModel?: "deepseek" | "openai" | "anthropic" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    contractId: string;
    options?: {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
        aiModel?: "deepseek" | "openai" | "anthropic" | undefined;
    } | undefined;
}, {
    contractId: string;
    options?: {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
        aiModel?: "deepseek" | "openai" | "anthropic" | undefined;
    } | undefined;
}>;
type ContractReaderInput = z.infer<typeof ContractReaderInputSchema>;
declare const FileProcessorInputSchema: z.ZodObject<{
    fileBase64: z.ZodString;
    fileName: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        skipOCR: z.ZodOptional<z.ZodBoolean>;
        extractTables: z.ZodOptional<z.ZodBoolean>;
        includeRawText: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
    }, {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    fileBase64: string;
    fileName: string;
    options?: {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
    } | undefined;
}, {
    fileBase64: string;
    fileName: string;
    options?: {
        includeRawText?: boolean | undefined;
        extractTables?: boolean | undefined;
        skipOCR?: boolean | undefined;
    } | undefined;
}>;
type FileProcessorInput = z.infer<typeof FileProcessorInputSchema>;
/**
 * Create a contract reader tool instance
 * @param salesforceConnection Authenticated Salesforce connection
 * @param serviceOptions Configuration options for underlying services
 * @returns AI tool for contract processing
 */
export declare function createContractReaderTool(salesforceConnection: Connection, serviceOptions?: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
}): ({ contractId, options }: ContractReaderInput) => Promise<{
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
/**
 * Create a simplified contract reader tool for direct file processing
 * @param serviceOptions Configuration options for underlying services
 * @returns AI tool for direct file processing
 */
export declare function createFileProcessorTool(serviceOptions?: {
    adobeClientId?: string;
    adobeClientSecret?: string;
    deepSeekApiKey?: string;
}): ({ fileBase64, fileName, options }: FileProcessorInput) => Promise<{
    success: boolean;
    error: string;
    contractData?: undefined;
    processingTimeMs?: undefined;
    rawText?: undefined;
} | {
    success: boolean;
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
    };
    processingTimeMs: number;
    error: string | undefined;
    rawText: string | undefined;
}>;
export {};
//# sourceMappingURL=contractReaderTool.d.ts.map