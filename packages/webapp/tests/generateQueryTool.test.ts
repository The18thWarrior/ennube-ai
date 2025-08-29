// // === generateQueryTool.test.ts ===
// // Created: 2025-08-27 00:00
// // Purpose: Unit tests for generateQueryTool with comprehensive coverage
// // Coverage:
// //   - Happy path query generation and execution
// //   - Input validation scenarios
// //   - Error handling for API failures
// //   - Vector store integration testing
// // Notes:
// //   - Mocks all external dependencies for fast, reliable tests
// //   - Uses Jest for testing framework

// // Global fetch mock (single assignment)
// global.fetch = jest.fn();

// // Mock external dependencies before importing modules that reference node_modules ESM
// jest.mock('../lib/chat/sfdc/embeddings');
// jest.mock('../lib/chat/sfdc/vectorStore');
// // Provide an explicit factory so `getBaseUrl` is a jest.fn() before any real module is loaded.
// jest.mock('../lib/chat/helper', () => ({
//   getBaseUrl: jest.fn(),
//   // Export any additional helpers used by the code under test as mocks here if needed
// }));
// jest.mock('ai', () => ({
//   tool: jest.fn((config: any) => config),
//   generateObject: jest.fn()
// }));
// jest.mock('@ai-sdk/openai', () => ({
//   openai: jest.fn(() => 'mocked-model')
// }));

// // Now import modules under test after mocks are registered
// import { generateQueryTool, QueryGenerationSchema } from '../lib/chat/sfdc/generateQueryTool';
// import { createSalesforceVectorStore } from '../lib/chat/sfdc/vectorStore';
// import { embedText } from '../lib/chat/sfdc/embeddings';

// const mockEmbedText = embedText as jest.MockedFunction<typeof embedText>;
// const mockCreateVectorStore = createSalesforceVectorStore as jest.MockedFunction<typeof createSalesforceVectorStore>;
// const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// // Mock data
// const mockDescribeResponse = {
//   describe: {
//     name: 'Account',
//     label: 'Account',
//     keyPrefix: '001',
//     fields: [
//       {
//         name: 'Id',
//         label: 'Account ID',
//         type: 'id',
//         inlineHelpText: 'Unique identifier for the account'
//       },
//       {
//         name: 'Name',
//         label: 'Account Name',
//         type: 'string',
//         length: 255
//       },
//       {
//         name: 'Industry',
//         label: 'Industry',
//         type: 'picklist',
//         picklistValues: [
//           { label: 'Technology', value: 'Technology' },
//           { label: 'Healthcare', value: 'Healthcare' }
//         ]
//       }
//     ],
//     childRelationships: []
//   }
// };

// const mockQueryResponse = {
//   totalSize: 2,
//   done: true,
//   records: [
//     { Id: '0011234567890123', Name: 'Acme Corp', Industry: 'Technology' },
//     { Id: '0011234567890124', Name: 'Global Health Inc', Industry: 'Healthcare' }
//   ]
// };

// const mockVectorStore = {
//   upsert: jest.fn(),
//   query: jest.fn(),
//   getByPrefix: jest.fn(),
//   clear: jest.fn(),
//   size: jest.fn()
// };

// describe('generateQueryTool', () => {
//   const testSubId = 'test-sub-123';
//   const testSobjectType = 'Account';
//   const testDescription = 'Find all technology companies';

//   beforeEach(() => {
//     jest.clearAllMocks();

//     // Setup default mocks
//     mockCreateVectorStore.mockReturnValue(mockVectorStore as any);
//     mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);

//     mockVectorStore.upsert.mockResolvedValue(undefined);
//     mockVectorStore.query.mockResolvedValue([
//       {
//         id: 'Account:Name',
//         score: 0.95,
//         payload: {
//           sobjectType: 'Account',
//           fieldName: 'Name',
//           label: 'Account Name',
//           type: 'string'
//         }
//       },
//       {
//         id: 'Account:Industry',
//         score: 0.90,
//         payload: {
//           sobjectType: 'Account',
//           fieldName: 'Industry',
//           label: 'Industry',
//           type: 'picklist',
//           picklistValues: ['Technology', 'Healthcare']
//         }
//       }
//     ]);

//     // Mock getBaseUrl from the mocked helper module
//     const helper = require('../lib/chat/helper');
//     helper.getBaseUrl.mockResolvedValue('https://test-api.example.com');
//   });

//   describe('Happy Path', () => {
//     it('should successfully generate and execute a query', async () => {
//       // Mock successful API responses
//       mockFetch
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDescribeResponse)
//         } as any)
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockQueryResponse)
//         } as any);

//       // Mock AI generateObject
//       const { generateObject } = require('ai');
//       generateObject.mockResolvedValue({
//         object: {
//           sql: 'SELECT Id, Name, Industry FROM Account WHERE Industry = \'Technology\' LIMIT 100',
//           tablesUsed: ['Account'],
//           rationale: 'Query filters accounts by technology industry as requested',
//           confidence: 0.95
//         }
//       });

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(true);
//       expect(result.query).toBeDefined();
//       expect(result.results).toBeDefined();
//       expect(result.metadata).toBeDefined();
      
//       // Verify vector store was used
//       expect(mockVectorStore.upsert).toHaveBeenCalledWith(expect.any(Array));
//       expect(mockVectorStore.query).toHaveBeenCalledWith(
//         expect.any(Array),
//         50 // default topK
//       );
      
//       // Verify embeddings were created
//       expect(mockEmbedText).toHaveBeenCalledTimes(4); // 3 fields + description
//     });

//     it('should validate SELECT-only SQL', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(mockDescribeResponse)
//       } as any);

//       // Mock AI generateObject returning unsafe SQL
//       const { generateObject } = require('ai');
//       generateObject.mockResolvedValue({
//         object: {
//           sql: 'DELETE FROM Account WHERE Industry = \'Technology\'',
//           tablesUsed: ['Account'],
//           rationale: 'Attempting unsafe operation',
//           confidence: 0.95
//         }
//       });

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('non-SELECT statements');
//     });
//   });

//   describe('Input Validation', () => {
//     it('should reject empty subId', async () => {
//       const tool = generateQueryTool('');
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('subId is required');
//     });

//     it('should reject empty sobjectType', async () => {
//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: '',
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('sobjectType is required');
//     });

//     it('should reject empty description', async () => {
//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: ''
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('description is required');
//     });

//     it('should reject whitespace-only description', async () => {
//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: '   \n\t   '
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('description is required');
//     });
//   });

//   describe('Error Handling', () => {
//     it('should handle describe API failure', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: false,
//         status: 404,
//         statusText: 'Not Found'
//       } as any);

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('Failed to fetch describe');
//     });

//     it('should handle invalid describe response', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve({ invalid: 'response' })
//       } as any);

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('Invalid describe response');
//     });

//     it('should handle empty fields in describe', async () => {
//       const emptyDescribeResponse = {
//         describe: {
//           name: 'Account',
//           label: 'Account',
//           keyPrefix: '001',
//           fields: [],
//           childRelationships: []
//         }
//       };

//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(emptyDescribeResponse)
//       } as any);

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('No fields found');
//     });

//     it('should handle embedding failures gracefully', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(mockDescribeResponse)
//       } as any);

//       mockEmbedText.mockRejectedValue(new Error('Embedding service unavailable'));

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('Embedding service unavailable');
//     });

//     it('should handle query execution failure', async () => {
//       mockFetch
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDescribeResponse)
//         } as any)
//         .mockResolvedValueOnce({
//           ok: false,
//           status: 500,
//           statusText: 'Internal Server Error'
//         } as any);

//       const { generateObject } = require('ai');
//       generateObject.mockResolvedValue({
//         object: {
//           sql: 'SELECT Id, Name FROM Account LIMIT 100',
//           tablesUsed: ['Account'],
//           rationale: 'Basic account query',
//           confidence: 0.95
//         }
//       });

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('Query execution failed');
//     });

//     it('should handle no relevant fields found', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(mockDescribeResponse)
//       } as any);

//       mockVectorStore.query.mockResolvedValue([]); // No similar fields

//       const tool = generateQueryTool(testSubId);
//       const result = await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(result.success).toBe(false);
//       expect(result.error).toContain('No relevant fields found');
//     });
//   });

//   describe('Vector Store Integration', () => {
//     it('should create proper vector store entries', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(mockDescribeResponse)
//       } as any);

//       const tool = generateQueryTool(testSubId);
//       await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       // Verify upsert was called with correct structure
//       const upsertCall = mockVectorStore.upsert.mock.calls[0][0];
//       expect(upsertCall).toHaveLength(3); // 3 fields in mock response
      
//       const firstEntry = upsertCall[0];
//       expect(firstEntry).toEqual({
//         id: 'Account:Id',
//         vector: expect.any(Array),
//         payload: {
//           sobjectType: 'Account',
//           fieldName: 'Id',
//           label: 'Account ID',
//           type: 'id',
//           helpText: 'Unique identifier for the account',
//           picklistValues: undefined
//         }
//       });
//     });

//     it('should query vector store with description embedding', async () => {
//       mockFetch.mockResolvedValueOnce({
//         ok: true,
//         json: () => Promise.resolve(mockDescribeResponse)
//       } as any);

//       const tool = generateQueryTool(testSubId);
//       await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       // Verify query was called with description embedding
//       expect(mockVectorStore.query).toHaveBeenCalledWith(
//         [0.1, 0.2, 0.3, 0.4, 0.5], // mocked embedding
//         50 // default topK
//       );
//     });
//   });

//   describe('AI Integration', () => {
//     it('should call generateObject with proper context', async () => {
//       mockFetch
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockDescribeResponse)
//         } as any)
//         .mockResolvedValueOnce({
//           ok: true,
//           json: () => Promise.resolve(mockQueryResponse)
//         } as any);

//       const { generateObject } = require('ai');
//       generateObject.mockResolvedValue({
//         object: {
//           sql: 'SELECT Id, Name, Industry FROM Account LIMIT 100',
//           tablesUsed: ['Account'],
//           rationale: 'Basic account query',
//           confidence: 0.95
//         }
//       });

//       const tool = generateQueryTool(testSubId);
//       await tool.execute({
//         sobjectType: testSobjectType,
//         description: testDescription
//       });

//       expect(generateObject).toHaveBeenCalledWith({
//         model: 'mocked-model',
//         schema: QueryGenerationSchema,
//         prompt: expect.stringContaining('Find all technology companies')
//       });

//       const call = generateObject.mock.calls[0][0];
//       expect(call.prompt).toContain('Account.Name (Account Name) - string');
//       expect(call.prompt).toContain('Account.Industry (Industry) - picklist');
//     });
//   });
// });

// /**
//  * OVERVIEW
//  *
//  * - Purpose: Comprehensive test coverage for generateQueryTool functionality
//  * - Assumptions: All external dependencies are properly mocked for isolated testing
//  * - Edge Cases: Covers input validation, API failures, empty responses, and security validation
//  * - Testing Strategy: Unit tests with mocked dependencies for fast, reliable CI execution
//  * - Future Improvements:
//  *   - Add integration tests with real API responses
//  *   - Performance testing for large field sets
//  *   - End-to-end testing with actual Salesforce sandbox
//  */

// /*
//  * === generateQueryTool.test.ts ===
//  * Updated: 2025-08-27 00:00
//  * Summary: Comprehensive unit tests for semantic SOQL query generation
//  * Key Test Areas:
//  *   - Happy path query generation and execution
//  *   - Input validation and error handling
//  *   - Vector store integration and field processing
//  *   - AI model integration and context building
//  * Dependencies:
//  *   - Jest for testing framework
//  *   - Mocked external APIs and services
//  * Version History:
//  *   v1.0 – initial comprehensive test implementation
//  * Notes:
//  *   - All external dependencies mocked for fast execution
//  *   - Covers security validation for SELECT-only queries
//  *   - Tests both success and failure scenarios
//  */