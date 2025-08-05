// === services/SalesforceService.ts ===
// Created: 2025-08-02 15:30
// Purpose: Salesforce integration service for contract document retrieval
// Exports:
//   - SalesforceService: Class for Salesforce data operations
//   - getContractDocuments(): Retrieve documents linked to contracts
//   - downloadDocumentContent(): Download document binary data
// Notes:
//   - Uses JSForce for Salesforce API integration

import jsforce, { Connection } from 'jsforce';
import { 
  DocumentInfo, 
  ContentDocumentLink, 
  SalesforceError 
} from '../types/index.js';

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

export class SalesforceService {
  constructor(private connection: Connection) {}

  /**
   * Get all documents linked to a specific contract
   * @param contractId Salesforce Contract ID
   * @returns Array of document information
   */
  async getContractDocuments(contractId: string): Promise<DocumentInfo[]> {
    try {
      // Step 1: Get ContentDocumentLinks for the contract
      const documentLinks = await this.getContentDocumentLinks(contractId);
      
      if (documentLinks.length === 0) {
        return [];
      }

      // Step 2: Get ContentDocument records
      const documentIds = documentLinks.map(link => link.contentDocumentId);
      const documents = await this.getContentDocuments(documentIds);

      // Step 3: Get ContentVersion records with binary data info
      const documentInfos: DocumentInfo[] = [];
      
      for (const doc of documents) {
        const versions = await this.getContentVersions(doc.Id);
        
        for (const version of versions) {
          documentInfos.push({
            id: version.Id,
            title: version.Title,
            fileExtension: version.FileExtension,
            fileType: doc.FileType,
            contentSize: version.ContentSize,
            versionData: version.VersionData,
            createdDate: doc.CreatedDate,
            ownerId: doc.OwnerId,
            parentId: contractId,
          });
        }
      }

      return documentInfos;

    } catch (error) {
      throw new SalesforceError(
        `Failed to retrieve contract documents for ID: ${contractId}`,
        { contractId, error }
      );
    }
  }

  /**
   * Download document content as buffer
   * @param documentInfo Document metadata from getContractDocuments
   * @returns Document content as Buffer
   */
  async downloadDocumentContent(documentInfo: DocumentInfo): Promise<Buffer> {
    try {
      // Get Salesforce instance URL and session ID
      const instanceUrl = this.connection.instanceUrl;
      const sessionId = this.connection.accessToken;

      if (!instanceUrl || !sessionId) {
        throw new SalesforceError('Invalid Salesforce connection - missing instance URL or session');
      }

      // Construct download URL
      const downloadUrl = `${instanceUrl}${documentInfo.versionData}`;

      // Download with Salesforce authentication using fetch
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        throw new SalesforceError(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      throw new SalesforceError(
        `Failed to download document: ${documentInfo.title}`,
        { documentInfo, error }
      );
    }
  }

  /**
   * Get contract record by ID
   * @param contractId Salesforce Contract ID
   * @returns Contract record data
   */
  async getContract(contractId: string): Promise<any> {
    try {
      const query = `
        SELECT Id, 
               AccountId, 
               ActivatedDate, 
               BillingCity, 
               BillingCountry, 
               BillingPostalCode, 
               BillingState, 
               BillingStreet, 
               CompanySignedDate, 
               CompanySignedId, 
               ContractNumber, 
               ContractTerm, 
               CustomerSignedDate, 
               CustomerSignedId, 
               Description, 
               EndDate, 
               Name, 
               OwnerExpirationNotice, 
               OwnerId, 
               Pricebook2Id, 
               SpecialTerms, 
               StartDate, 
               Status, 
               StatusCode, 
               CreatedById, 
               CreatedDate, 
               LastActivityDate, 
               LastModifiedById, 
               LastModifiedDate 
        FROM Contract
        WHERE Id = '${contractId}'
      `;

      const result = await this.connection.query(query);
      
      if (result.records.length === 0) {
        throw new SalesforceError(`Contract not found: ${contractId}`);
      }

      return result.records[0];

    } catch (error) {
      throw new SalesforceError(
        `Failed to retrieve contract: ${contractId}`,
        { contractId, error }
      );
    }
  }

  private async getContentDocumentLinks(contractId: string): Promise<ContentDocumentLink[]> {
    const query = `
      SELECT Id, 
             LinkedEntityId,
             ContentDocumentId
      FROM ContentDocumentLink
      WHERE LinkedEntityId = '${contractId}'
    `;

    const result = await this.connection.query(query);
    return result.records as ContentDocumentLink[];
  }

  private async getContentDocuments(documentIds: string[]): Promise<any[]> {
    if (documentIds.length === 0) {
      return [];
    }

    const documentIdList = documentIds.map(id => `'${id}'`).join(',');
    const query = `
      SELECT Id, 
             Title, 
             FileExtension, 
             FileType,
             LastViewedDate,
             ParentId,
             SharingPrivacy,
             OwnerId,
             CreatedDate 
      FROM ContentDocument
      WHERE Id IN (${documentIdList})
    `;

    const result = await this.connection.query(query);
    return result.records;
  }

  private async getContentVersions(contentDocumentId: string): Promise<any[]> {
    const query = `
      SELECT Id, 
             Title, 
             FileExtension, 
             VersionData, 
             ContentSize
      FROM ContentVersion
      WHERE ContentDocumentId = '${contentDocumentId}'
    `;

    const result = await this.connection.query(query);
    return result.records;
  }

  /**
   * Test Salesforce connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connection.query('SELECT Id FROM User LIMIT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search for contracts by criteria
   * @param criteria Search criteria (name, status, etc.)
   * @returns Array of matching contracts
   */
  async searchContracts(criteria: {
    name?: string;
    status?: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      let whereClause = '';
      const conditions: string[] = [];

      if (criteria.name) {
        conditions.push(`Name LIKE '%${criteria.name}%'`);
      }
      
      if (criteria.status) {
        conditions.push(`Status = '${criteria.status}'`);
      }
      
      if (criteria.accountId) {
        conditions.push(`AccountId = '${criteria.accountId}'`);
      }
      
      if (criteria.startDate) {
        conditions.push(`StartDate >= ${criteria.startDate.toISOString().split('T')[0]}`);
      }
      
      if (criteria.endDate) {
        conditions.push(`EndDate <= ${criteria.endDate.toISOString().split('T')[0]}`);
      }

      if (conditions.length > 0) {
        whereClause = ` WHERE ${conditions.join(' AND ')}`;
      }

      const limit = criteria.limit || 100;
      const query = `
        SELECT Id, 
               Name, 
               ContractNumber, 
               Status, 
               StartDate, 
               EndDate, 
               AccountId,
               CreatedDate
        FROM Contract${whereClause}
        ORDER BY CreatedDate DESC
        LIMIT ${limit}
      `;

      const result = await this.connection.query(query);
      return result.records;

    } catch (error) {
      throw new SalesforceError('Failed to search contracts', { criteria, error });
    }
  }
}

/*
 * === services/SalesforceService.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: Salesforce integration for contract document retrieval
 * Key Components:
 *   - getContractDocuments(): Complete document retrieval workflow
 *   - downloadDocumentContent(): Binary document download
 *   - searchContracts(): Contract search functionality
 *   - SOQL queries matching n8n workflow structure
 * Dependencies:
 *   - Requires: jsforce, fetch API, authenticated Salesforce connection
 * Version History:
 *   v1.0 – initial Salesforce integration
 * Notes:
 *   - Replicates exact SOQL queries from n8n workflow
 *   - Handles ContentDocument/ContentVersion relationships
 */
