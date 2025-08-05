import { Connection } from 'jsforce';
import { DocumentInfo, ProcessingOptions, ProcessingResult } from '../types/index';
/**
 * OVERVIEW
 *
 * Contract Extraction Service orchestrates the complete contract processing workflow:
 * 1. Document retrieval from Salesforce
 * 2. OCR processing for PDFs using Adobe services
 * 3. AI-powered contract data extraction
 * 4. Structured data validation and return
 *
 * This service replicates the complete n8n workflow in a TypeScript class structure.
 *
 * Assumptions:
 * - Environment variables contain Adobe and AI service credentials
 * - Salesforce connection is authenticated and provided
 * - Documents are primarily PDF format requiring OCR
 *
 * Edge Cases:
 * - Mixed document formats (PDF vs others)
 * - OCR failures or timeouts
 * - AI extraction returning incomplete data
 * - Network connectivity issues
 *
 * Future Improvements:
 * - Support for multiple AI models
 * - Caching of processed documents
 * - Batch processing capabilities
 * - Enhanced validation and data cleaning
 */
export declare class ContractExtractionService {
    private adobeOCRService;
    private salesforceService;
    private aiModel;
    constructor(salesforceConnection: Connection, options?: {
        adobeClientId?: string;
        adobeClientSecret?: string;
        deepSeekApiKey?: string;
    });
    /**
     * Process a contract from Salesforce
     * @param contractId Salesforce Contract ID
     * @param options Processing configuration options
     * @returns Processing results with extracted contract data
     */
    extractFromSalesforce(contractId: string, options?: ProcessingOptions): Promise<ProcessingResult[]>;
    /**
     * Process a single document for contract data extraction
     * @param document Document information from Salesforce
     * @param options Processing configuration
     * @returns Processing result with extracted data
     */
    processDocument(document: DocumentInfo, options?: ProcessingOptions): Promise<ProcessingResult>;
    /**
     * Process contract content directly (without Salesforce)
     * @param fileBuffer Document content as buffer
     * @param fileName Original filename
     * @param options Processing configuration
     * @returns Processing result
     */
    processContract(fileBuffer: Buffer, fileName: string, options?: ProcessingOptions): Promise<ProcessingResult>;
    private extractContractDataWithAI;
    private buildExtractionPrompt;
    private parseAIResponse;
    private validateContractData;
    private extractTextFromBuffer;
    /**
     * Test all service connections
     */
    testConnections(): Promise<{
        salesforce: boolean;
        adobeOCR: boolean;
        ai: boolean;
    }>;
}
//# sourceMappingURL=ContractExtractionService.d.ts.map