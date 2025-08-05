import { AdobeOCROptions } from '../types/index.js';
/**
 * OVERVIEW
 *
 * Adobe OCR Service handles PDF text extraction using Adobe PDF Services API.
 * This service replicates the n8n workflow's Adobe OCR integration with:
 * - OAuth token authentication
 * - File upload to Adobe storage
 * - Job submission and polling
 * - Text and table extraction
 *
 * Assumptions:
 * - PDF files are the primary document type requiring OCR
 * - Adobe credentials are provided via environment variables
 * - Processing may take several seconds and requires polling
 *
 * Edge Cases:
 * - Large PDFs may timeout (handled with configurable retry)
 * - Invalid PDF format (returns meaningful error)
 * - Network interruptions during processing
 *
 * Future Improvements:
 * - Support for other document formats
 * - Batch processing multiple documents
 * - Configurable retry strategies
 */
export declare class AdobeOCRService {
    private readonly clientId;
    private readonly clientSecret;
    private readonly baseUrl;
    private readonly authUrl;
    constructor(clientId: string, clientSecret: string);
    /**
     * Process a PDF document through Adobe OCR
     * @param fileBuffer PDF file as buffer
     * @param fileName Original filename for metadata
     * @param options OCR processing options
     * @returns Extracted text and structured data
     */
    processDocument(fileBuffer: Buffer, fileName: string, options?: Partial<AdobeOCROptions>): Promise<string>;
    private getAccessToken;
    private createUploadAsset;
    private uploadFile;
    private startExtractionJob;
    private pollJobCompletion;
    private downloadAndParseResults;
    private extractTextFromElements;
    /**
     * Test Adobe OCR service connectivity
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=AdobeOCRService.d.ts.map