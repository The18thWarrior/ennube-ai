// === services/AdobeOCRService.ts ===
// Created: 2025-08-02 15:30
// Purpose: Adobe PDF Services OCR integration for document text extraction
// Exports:
//   - AdobeOCRService: Class for PDF OCR processing
//   - processDocument(): Main OCR processing method
// Notes:
//   - Handles authentication, file upload, job processing, and text extraction

// axios removed, using fetch instead
import FormData from 'form-data';
import { 
  AdobeOCROptions, 
  AdobeOCRResponse, 
  FileUploadInfo, 
  JobStatusResponse,
  AdobeOCRError 
} from '../types/index.js';

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

export class AdobeOCRService {
  private readonly baseUrl = 'https://pdf-services.adobe.io';
  private readonly authUrl = 'https://pdf-services.adobe.io/token';
  
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string
  ) {}

  /**
   * Process a PDF document through Adobe OCR
   * @param fileBuffer PDF file as buffer
   * @param fileName Original filename for metadata
   * @param options OCR processing options
   * @returns Extracted text and structured data
   */
  async processDocument(
    fileBuffer: Buffer, 
    fileName: string,
    options: Partial<AdobeOCROptions> = {}
  ): Promise<string> {
    try {
      const startTime = Date.now();
      
      // Step 1: Get authentication token
      const accessToken = await this.getAccessToken();
      
      // Step 2: Create upload asset
      const uploadInfo = await this.createUploadAsset(accessToken);
      
      // Step 3: Upload file
      await this.uploadFile(fileBuffer, uploadInfo.uploadUri);
      
      // Step 4: Start extraction job
      const jobLocation = await this.startExtractionJob(
        accessToken, 
        uploadInfo.assetID,
        options.elementsToExtract || ['text', 'tables']
      );
      
      // Step 5: Poll for completion
      const result = await this.pollJobCompletion(accessToken, jobLocation);
      
      // Step 6: Download and parse results
      const extractedText = await this.downloadAndParseResults(result.content!.downloadUri);
      
      const processingTime = Date.now() - startTime;
      console.log(`Adobe OCR completed in ${processingTime}ms for file: ${fileName}`);
      
      return extractedText;
      
    } catch (error) {
      throw new AdobeOCRError(
        `Adobe OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { fileName, error }
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);

      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: (formData as any).getHeaders ? (formData as any).getHeaders() : {},
        body: formData as any,
      });
      if (!response.ok) {
        throw new AdobeOCRError('Failed to authenticate with Adobe PDF Services', { status: response.status });
      }
      const data = await response.json();
      return `Bearer ${data.access_token}`;
    } catch (error) {
      throw new AdobeOCRError('Failed to authenticate with Adobe PDF Services', { error });
    }
  }

  private async createUploadAsset(accessToken: string): Promise<FileUploadInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/assets`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.clientId,
          'Authorization': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaType: 'application/pdf' }),
      });
      if (!response.ok) {
        throw new AdobeOCRError('Failed to create upload asset', { status: response.status });
      }
      return await response.json();
    } catch (error) {
      throw new AdobeOCRError('Failed to create upload asset', { error });
    }
  }

  private async uploadFile(fileBuffer: Buffer, uploadUri: string): Promise<void> {
    try {
      const uploadResponse = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: new Uint8Array(fileBuffer),
      });
      if (!uploadResponse.ok) {
        throw new AdobeOCRError('Failed to upload file to Adobe storage', { status: uploadResponse.status });
      }
    } catch (error) {
      throw new AdobeOCRError('Failed to upload file to Adobe storage', { error });
    }
  }

  private async startExtractionJob(
    accessToken: string, 
    assetID: string,
    elementsToExtract: string[]
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/operation/extractpdf`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.clientId,
          'Authorization': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetID, elementsToExtract }),
      });
      if (!response.ok) {
        throw new AdobeOCRError('Failed to start extraction job', { status: response.status });
      }
      const location = response.headers.get('location');
      if (!location) {
        throw new AdobeOCRError('No job location returned from Adobe API');
      }
      return location;
    } catch (error) {
      throw new AdobeOCRError('Failed to start extraction job', { error });
    }
  }

  private async pollJobCompletion(
    accessToken: string, 
    jobLocation: string,
    maxAttempts = 30,
    pollIntervalMs = 2000
  ): Promise<JobStatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(jobLocation, {
          method: 'GET',
          headers: {
            'X-API-Key': this.clientId,
            'Authorization': accessToken,
          },
        });
        if (!response.ok) {
          if (attempt === maxAttempts - 1) {
            throw new AdobeOCRError('Job polling exceeded maximum attempts', { status: response.status });
          }
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          continue;
        }
        const data: JobStatusResponse = await response.json();
        if (data.status === 'done') {
          return data;
        }
        if (data.status === 'failed') {
          throw new AdobeOCRError('Adobe OCR job failed', { jobResponse: data });
        }
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new AdobeOCRError('Job polling exceeded maximum attempts', { error });
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    }

    throw new AdobeOCRError('Adobe OCR job timed out');
  }

  private async downloadAndParseResults(downloadUri: string): Promise<string> {
    try {
      const response = await fetch(downloadUri);
      if (!response.ok) {
        throw new AdobeOCRError('Failed to download OCR results', { status: response.status });
      }
      const data: AdobeOCRResponse = await response.json();
      return this.extractTextFromElements(data.elements);
    } catch (error) {
      throw new AdobeOCRError('Failed to download or parse OCR results', { error });
    }
  }

  private extractTextFromElements(elements: AdobeOCRResponse['elements']): string {
    if (!Array.isArray(elements)) {
      throw new AdobeOCRError('Invalid elements structure in OCR response');
    }

    const textParts: string[] = [];
    let tableCount = 0;

    for (const element of elements) {
      // Extract plain text
      if (typeof element.Text === 'string') {
        textParts.push(element.Text.trim());
      }

      // Extract table data
      if (element.Type === 'Table' && Array.isArray(element.Rows)) {
        tableCount++;
        textParts.push(`\n\n[Table ${tableCount}]`);

        for (const row of element.Rows) {
          const cells = row.Cells || [];
          const rowText = cells.map(cell => cell.Text?.trim() || '').join(' | ');
          textParts.push(rowText);
        }

        textParts.push('\n');
      }
    }

    // Clean up whitespace and return joined text
    return textParts
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Test Adobe OCR service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

/*
 * === services/AdobeOCRService.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: Adobe PDF Services OCR integration service
 * Key Components:
 *   - processDocument(): Main OCR processing workflow
 *   - getAccessToken(): OAuth authentication
 *   - File upload and job polling mechanisms
 *   - Text and table extraction from OCR results
 * Dependencies:
 *   - Requires: fetch API, form-data, Adobe PDF Services API
 * Version History:
 *   v1.0 – initial Adobe OCR integration
 * Notes:
 *   - Implements complete n8n workflow in TypeScript
 *   - Includes robust error handling and retry logic
 */
