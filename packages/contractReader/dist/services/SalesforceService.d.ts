import { Connection } from 'jsforce';
import { DocumentInfo } from '../types/index.js';
/**
 * OVERVIEW
 *
 * Salesforce Service handles contract document retrieval from Salesforce CRM.
 * This service replicates the n8n workflow's Salesforce queries with:
 * - Contract record lookup
 * - ContentDocumentLink querying
 * - ContentDocument and ContentVersion retrieval
 * - Document binary data download
 *
 * Assumptions:
 * - Salesforce Connection is provided and authenticated externally
 * - Standard Salesforce objects are available (Contract, ContentDocument, etc.)
 * - Documents are attached via ContentDocumentLink
 *
 * Edge Cases:
 * - Contract with no attached documents
 * - Document access permissions
 * - Large document downloads
 *
 * Future Improvements:
 * - Batch processing for multiple contracts
 * - Document metadata caching
 * - Support for custom document fields
 */
export declare class SalesforceService {
    private connection;
    constructor(connection: Connection);
    /**
     * Get all documents linked to a specific contract
     * @param contractId Salesforce Contract ID
     * @returns Array of document information
     */
    getContractDocuments(contractId: string): Promise<DocumentInfo[]>;
    /**
     * Download document content as buffer
     * @param documentInfo Document metadata from getContractDocuments
     * @returns Document content as Buffer
     */
    downloadDocumentContent(documentInfo: DocumentInfo): Promise<Buffer>;
    /**
     * Get contract record by ID
     * @param contractId Salesforce Contract ID
     * @returns Contract record data
     */
    getContract(contractId: string): Promise<any>;
    private getContentDocumentLinks;
    private getContentDocuments;
    private getContentVersions;
    /**
     * Test Salesforce connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Search for contracts by criteria
     * @param criteria Search criteria (name, status, etc.)
     * @returns Array of matching contracts
     */
    searchContracts(criteria: {
        name?: string;
        status?: string;
        accountId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
}
//# sourceMappingURL=SalesforceService.d.ts.map