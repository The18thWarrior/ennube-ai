"use strict";
// === services/ContractExtractionService.ts ===
// Created: 2025-08-02 15:30
// Purpose: Main contract extraction service coordinating OCR and AI processing
// Exports:
//   - ContractExtractionService: Main orchestration service
//   - processContract(): Complete contract processing workflow
//   - extractFromSalesforce(): Process contracts from Salesforce
// Notes:
//   - Integrates AdobeOCRService, SalesforceService, and AI extraction
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractExtractionService = void 0;
const ai_sdk_provider_1 = require("@openrouter/ai-sdk-provider");
const ai_1 = require("ai");
const index_1 = require("../types/index");
const AdobeOCRService_1 = require("./AdobeOCRService");
const SalesforceService_1 = require("./SalesforceService");
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
class ContractExtractionService {
    constructor(salesforceConnection, options = {}) {
        this.aiModel = null;
        // Initialize Adobe OCR service
        const adobeClientId = options.adobeClientId || process.env.ADOBE_CLIENT_ID;
        const adobeClientSecret = options.adobeClientSecret || process.env.ADOBE_CLIENT_SECRET;
        if (!adobeClientId || !adobeClientSecret) {
            throw new index_1.ContractReaderError('Adobe OCR credentials not provided', 'MISSING_CREDENTIALS');
        }
        this.adobeOCRService = new AdobeOCRService_1.AdobeOCRService(adobeClientId, adobeClientSecret);
        // Initialize Salesforce service
        this.salesforceService = new SalesforceService_1.SalesforceService(salesforceConnection);
        // Initialize AI model (OpenRouter) with runtime adapter for type compatibility
        const openRouterApiKey = options.deepSeekApiKey || process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
        if (openRouterApiKey) {
            const openrouter = (0, ai_sdk_provider_1.createOpenRouter)({ apiKey: openRouterApiKey });
            const rawModel = openrouter.completion('google/gemini-2.0-flash-001');
            // Adapter: wrap doGenerate and doStream to normalize stream part types
            this.aiModel = {
                ...rawModel,
                provider: (rawModel).provider || 'openrouter',
                async doGenerate(options) {
                    const result = await (rawModel).doGenerate(options);
                    return result;
                },
                async doStream(options) {
                    const result = await (rawModel).doStream(options);
                    if (result && result.stream) {
                        const origStream = result.stream;
                        const patchedStream = new ReadableStream({
                            start(controller) {
                                const reader = origStream.getReader();
                                function pump() {
                                    reader.read().then((value) => {
                                        if (value.done) {
                                            controller.close();
                                            return;
                                        }
                                        controller.enqueue(value.value);
                                        pump();
                                    });
                                }
                                pump();
                            }
                        });
                        return { ...result, stream: patchedStream };
                    }
                    return result;
                }
            };
        }
    }
    /**
     * Process a contract from Salesforce
     * @param contractId Salesforce Contract ID
     * @param options Processing configuration options
     * @returns Processing results with extracted contract data
     */
    async extractFromSalesforce(contractId, options = {}) {
        try {
            const startTime = Date.now();
            // Step 1: Get contract documents from Salesforce
            const documents = await this.salesforceService.getContractDocuments(contractId);
            if (documents.length === 0) {
                return [{
                        success: false,
                        contractData: {},
                        error: 'No documents found for contract',
                        processingTimeMs: Date.now() - startTime,
                    }];
            }
            // Step 2: Process each document
            const results = [];
            for (const document of documents) {
                try {
                    const result = await this.processDocument(document, options);
                    results.push(result);
                }
                catch (error) {
                    results.push({
                        success: false,
                        contractData: {},
                        error: error instanceof Error ? error.message : 'Unknown processing error',
                        processingTimeMs: Date.now() - startTime,
                    });
                }
            }
            return results;
        }
        catch (error) {
            throw new index_1.ContractReaderError(`Failed to extract contract from Salesforce: ${contractId}`, 'SALESFORCE_EXTRACTION_ERROR', { contractId, error });
        }
    }
    /**
     * Process a single document for contract data extraction
     * @param document Document information from Salesforce
     * @param options Processing configuration
     * @returns Processing result with extracted data
     */
    async processDocument(document, options = {}) {
        const startTime = Date.now();
        try {
            // Step 1: Download document content
            const documentBuffer = await this.salesforceService.downloadDocumentContent(document);
            // Step 2: Extract text (with OCR if PDF)
            let extractedText;
            if (document.fileExtension.toLowerCase() === 'pdf' && !options.skipOCR) {
                // Use Adobe OCR for PDF documents
                extractedText = await this.adobeOCRService.processDocument(documentBuffer, document.title, {
                    elementsToExtract: options.extractTables ? ['text', 'tables'] : ['text'],
                    clientId: process.env.ADOBE_CLIENT_ID,
                    clientSecret: process.env.ADOBE_CLIENT_SECRET,
                });
            }
            else {
                // For non-PDF documents, convert buffer to text (basic implementation)
                extractedText = this.extractTextFromBuffer(documentBuffer, document.fileExtension);
            }
            // Step 3: Extract contract data using AI
            const contractData = await this.extractContractDataWithAI(extractedText, options);
            // Step 4: Validate extracted data
            const validatedData = this.validateContractData(contractData);
            return {
                success: true,
                contractData: validatedData,
                rawText: options.includeRawText ? extractedText : undefined,
                processingTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                contractData: {},
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Process contract content directly (without Salesforce)
     * @param fileBuffer Document content as buffer
     * @param fileName Original filename
     * @param options Processing configuration
     * @returns Processing result
     */
    async processContract(fileBuffer, fileName, options = {}) {
        const startTime = Date.now();
        try {
            // Determine file type from extension
            const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
            // Step 1: Extract text
            let extractedText;
            if (fileExtension === 'pdf' && !options.skipOCR) {
                extractedText = await this.adobeOCRService.processDocument(fileBuffer, fileName, {
                    elementsToExtract: options.extractTables ? ['text', 'tables'] : ['text'],
                    clientId: process.env.ADOBE_CLIENT_ID,
                    clientSecret: process.env.ADOBE_CLIENT_SECRET,
                });
            }
            else {
                extractedText = this.extractTextFromBuffer(fileBuffer, fileExtension);
            }
            // Step 2: Extract contract data using AI
            const contractData = await this.extractContractDataWithAI(extractedText, options);
            // Step 3: Validate extracted data
            const validatedData = this.validateContractData(contractData);
            return {
                success: true,
                contractData: validatedData,
                rawText: options.includeRawText ? extractedText : undefined,
                processingTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                success: false,
                contractData: {},
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTimeMs: Date.now() - startTime,
            };
        }
    }
    async extractContractDataWithAI(text, options) {
        try {
            if (!this.aiModel) {
                throw new index_1.AIExtractionError('AI model not initialized');
            }
            const prompt = this.buildExtractionPrompt(text);
            // Use the AI model with generateText from 'ai' library
            const response = await (0, ai_1.generateText)({
                model: this.aiModel,
                prompt,
                //maxSteps: 5,
                temperature: 0.1,
            });
            // Parse the JSON response
            const extractedData = this.parseAIResponse(response.text);
            return extractedData;
        }
        catch (error) {
            throw new index_1.AIExtractionError(`AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { text: text.substring(0, 500), error });
        }
    }
    buildExtractionPrompt(text) {
        return `Please review the legal text below and extract any of the following information using the JSON format.

${text}

Extract any of the following information using the JSON format:

{
  "contractSummary": "This is a summary of the contract providing the parties listed, dates enacted and dates to be terminated as well as any other pertinent information recorded in the contract text.",
  "contractType": "Amendment, MSA, etc.",
  "contractStartDate": "June 1st, 2025",
  "contractEndDate": "July 31st, 2025",
  "customer": "Wise Wolves Inc.",
  "customerAddress": "1001 4th Ave. New York City, New York 48321",
  "contractTerms": "Term a, Term b, Term c",
  "productsSold": "Consulting Services, Staffing, AI Services, etc",
  "contractAmount": "100,000.00",
  "subscription": "No",
  "subscriptionProduct": "No Subscription",
  "customerSignor": "John Smith",
  "customerSignedDate": "June 1st, 2025",
  "companySignor": "Alex Garcia",
  "companySignedDate": "June 2nd, 2025"
}

Extract information from the file. Extract dates, names, terms. Do not output any information not present in the document.`;
    }
    parseAIResponse(response) {
        try {
            // Clean up the response to find JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in AI response');
            }
            const jsonString = jsonMatch[0];
            const parsed = JSON.parse(jsonString);
            // Convert to our expected format (handle case differences)
            const contractData = {
                contractSummary: parsed.contractSummary || parsed['Contract Summary'],
                contractType: parsed.contractType || parsed['Contract Type'],
                contractStartDate: parsed.contractStartDate || parsed['Contract Start Date'],
                contractEndDate: parsed.contractEndDate || parsed['Contract End Date'],
                customer: parsed.customer || parsed.Customer,
                customerAddress: parsed.customerAddress || parsed['Customer Address'],
                contractTerms: parsed.contractTerms || parsed['Contract Terms'],
                productsSold: parsed.productsSold || parsed['Products Sold'],
                contractAmount: parsed.contractAmount || parsed['Contract Amount'],
                subscription: parsed.subscription || parsed['Subscription?'],
                subscriptionProduct: parsed.subscriptionProduct || parsed['Subscription Product'],
                customerSignor: parsed.customerSignor || parsed['Customer Signor'],
                customerSignedDate: parsed.customerSignedDate || parsed['Customer Signed Date'],
                companySignor: parsed.companySignor || parsed['Company Signor'],
                companySignedDate: parsed.companySignedDate || parsed['Company Signed Date'],
            };
            return contractData;
        }
        catch (error) {
            throw new index_1.AIExtractionError('Failed to parse AI response as JSON', { response, error });
        }
    }
    validateContractData(data) {
        try {
            return index_1.ContractDataSchema.parse(data);
        }
        catch (error) {
            // Log validation errors but return data anyway (with warnings)
            console.warn('Contract data validation warnings:', error);
            return data;
        }
    }
    extractTextFromBuffer(buffer, fileExtension) {
        // Basic text extraction for non-PDF files
        // This is a simplified implementation - could be enhanced with specific parsers
        switch (fileExtension.toLowerCase()) {
            case 'txt':
                return buffer.toString('utf-8');
            case 'docx':
                // Would need a proper DOCX parser in production
                return buffer.toString('utf-8').replace(/[^\x20-\x7E]/g, ' ');
            default:
                // Attempt UTF-8 decoding
                return buffer.toString('utf-8');
        }
    }
    /**
     * Test all service connections
     */
    async testConnections() {
        const results = {
            salesforce: false,
            adobeOCR: false,
            ai: false,
        };
        try {
            results.salesforce = await this.salesforceService.testConnection();
        }
        catch (error) {
            console.warn('Salesforce connection test failed:', error);
        }
        try {
            results.adobeOCR = await this.adobeOCRService.testConnection();
        }
        catch (error) {
            console.warn('Adobe OCR connection test failed:', error);
        }
        try {
            results.ai = !!this.aiModel;
        }
        catch (error) {
            console.warn('AI model test failed:', error);
        }
        return results;
    }
}
exports.ContractExtractionService = ContractExtractionService;
/*
 * === services/ContractExtractionService.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: Main orchestration service for contract processing
 * Key Components:
 *   - extractFromSalesforce(): Complete Salesforce workflow
 *   - processContract(): Direct file processing
 *   - AI-powered contract data extraction
 *   - Service integration and error handling
 * Dependencies:
 *   - Requires: jsforce, @deepseek/api, AdobeOCRService, SalesforceService
 * Version History:
 *   v1.0 – initial extraction service implementation
 * Notes:
 *   - Replicates complete n8n workflow in TypeScript
 *   - Handles both PDF and non-PDF document types
 */
//# sourceMappingURL=ContractExtractionService.js.map