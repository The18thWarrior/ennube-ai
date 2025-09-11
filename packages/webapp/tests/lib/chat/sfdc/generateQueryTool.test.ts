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
// === generateQueryTool.test.ts ===
// Created: 2025-08-27 00:00
// Purpose: Unit tests for generateQueryTool with comprehensive coverage
// Coverage:
//   - Happy path query generation and execution
//   - Input validation scenarios
//   - Error handling for API failures
//   - Vector store integration testing
// Notes:
//   - Mocks all external dependencies for fast, reliable tests
//   - Uses Jest for testing framework

// Global fetch mock (single assignment)
global.fetch = jest.fn();

// Mock external dependencies before importing modules that reference node_modules ESM
jest.mock('@/lib/chat/sfdc/embeddings');
jest.mock('@/lib/chat/sfdc/vectorStore');
// Provide an explicit factory so `getBaseUrl` is a jest.fn() before any real module is loaded.
jest.mock('@/lib/chat/helper', () => ({
	getBaseUrl: jest.fn(),
	// Export any additional helpers used by the code under test as mocks here if needed
}));
jest.mock('ai', () => ({
	tool: jest.fn((config: any) => ({
		// emulate the tool wrapper used in production which exposes an execute method
		execute: config.execute,
		inputSchema: config.inputSchema,
		description: config.description
	})),
	generateObject: jest.fn()
}));
jest.mock('@ai-sdk/openai', () => ({
	openai: jest.fn(() => 'mocked-model')
}));

// Mock internal alias modules that may pull ESM-only dependencies (e.g., nanoid)
jest.mock('@/lib/db/salesforce-storage', () => ({
	getSalesforceCredentialsBySub: jest.fn().mockResolvedValue({
		accessToken: 'mock-token',
		instanceUrl: 'https://instance.test',
		refreshToken: 'mock-refresh',
		userInfo: { id: 'user-1' }
	}),
	StoredSalesforceCredentials: {}
}));

jest.mock('@/lib/salesforce', () => ({
	createSalesforceClient: jest.fn(() => ({
		describeGlobal: jest.fn().mockResolvedValue({
			sobjects: [
				{ name: 'Account', label: 'Account', labelPlural: 'Accounts', queryable: true }
			]
		}),
		describe: jest.fn().mockResolvedValue({
			fields: [
				{ name: 'Id', label: 'Account ID', type: 'id' },
				{ name: 'Name', label: 'Account Name', type: 'string' },
				{ name: 'Industry', label: 'Industry', type: 'picklist', picklistValues: [{ label: 'Technology', value: 'Technology' }, { label: 'Healthcare', value: 'Healthcare' }] }
			],
			childRelationships: []
		})
	}))
}));

jest.mock('@/lib/types', () => ({}));

// Now import modules under test after mocks are registered
import { generateQueryTool, QueryGenerationSchema } from '@/lib/chat/sfdc/generateQueryTool';
import { createSalesforceVectorStore } from '@/lib/chat/sfdc/vectorStore';
import { embedText } from '@/lib/chat/sfdc/embeddings';

const mockEmbedText = embedText as jest.MockedFunction<typeof embedText>;
const mockCreateVectorStore = createSalesforceVectorStore as jest.MockedFunction<typeof createSalesforceVectorStore>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Helper to safely call tool.execute with TypeScript
const exec = (tool: any, args: any) => {
	if (!tool) {
		try {
			const ai = require('ai');
			console.error('exec: ai.tool mock:', ai.tool);
		} catch (e) {
			console.error('exec: require(ai) failed', e);
		}
		console.error('exec: tool is undefined');
		throw new Error('Tool is undefined');
	}
	if (typeof tool.execute === 'function') return tool.execute(args);
	if (typeof tool === 'function') return tool(args);
	console.error('exec: tool has unexpected shape', Object.keys(tool));
	throw new Error('Tool has no execute');
};

// Mock data
const mockDescribeResponse = {
	describe: {
		name: 'Account',
		label: 'Account',
		keyPrefix: '001',
		fields: [
			{
				name: 'Id',
				label: 'Account ID',
				type: 'id',
				inlineHelpText: 'Unique identifier for the account'
			},
			{
				name: 'Name',
				label: 'Account Name',
				type: 'string',
				length: 255
			},
			{
				name: 'Industry',
				label: 'Industry',
				type: 'picklist',
				picklistValues: [
					{ label: 'Technology', value: 'Technology' },
					{ label: 'Healthcare', value: 'Healthcare' }
				]
			}
		],
		childRelationships: []
	}
};

const mockQueryResponse = {
	totalSize: 2,
	done: true,
	records: [
		{ Id: '0011234567890123', Name: 'Acme Corp', Industry: 'Technology' },
		{ Id: '0011234567890124', Name: 'Global Health Inc', Industry: 'Healthcare' }
	]
};

const mockVectorStore = {
	upsert: jest.fn(),
	query: jest.fn(),
	getByPrefix: jest.fn(),
	clear: jest.fn(),
	size: jest.fn()
};

describe('generateQueryTool', () => {
	const testSubId = 'test-sub-123';
	const testSobjectType = 'Account';
	const testDescription = 'Find all technology companies';

	beforeEach(() => {
		// clear mocks but keep mock implementations (so mockFetch reference stays valid)
		jest.clearAllMocks();
		// reset the existing global.fetch mock instead of reassigning it so mockFetch variable remains valid
		mockFetch.mockReset();

		// Setup default mocks
		mockCreateVectorStore.mockReturnValue(mockVectorStore as any);
		mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);

		mockVectorStore.upsert.mockResolvedValue(undefined);
		mockVectorStore.query.mockResolvedValue([
			{
				id: 'Account:Name',
				score: 0.95,
				payload: {
					sobjectType: 'Account',
					fieldName: 'Name',
					label: 'Account Name',
					type: 'string'
				}
			},
			{
				id: 'Account:Industry',
				score: 0.90,
				payload: {
					sobjectType: 'Account',
					fieldName: 'Industry',
					label: 'Industry',
					type: 'picklist',
					picklistValues: ['Technology', 'Healthcare']
				}
			}
		]);

		// Mock getBaseUrl from the mocked helper module
		const helper = require('@/lib/chat/helper');
		helper.getBaseUrl.mockResolvedValue('https://test-api.example.com');

		// Reset salesforce client mock to default successful describe behavior with a name field
		const salesforce = require('@/lib/salesforce');
		salesforce.createSalesforceClient.mockReturnValue({
			describeGlobal: jest.fn().mockResolvedValue({
				sobjects: [
					{ name: 'Account', label: 'Account', labelPlural: 'Accounts', queryable: true }
				]
			}),
			describe: jest.fn().mockResolvedValue({
				name: 'Account',
				fields: [
					{ name: 'Id', label: 'Account ID', type: 'id', inlineHelpText: 'Unique identifier for the account' },
					{ name: 'Name', label: 'Account Name', type: 'string', length: 255 },
					{ name: 'Industry', label: 'Industry', type: 'picklist', picklistValues: [{ label: 'Technology', value: 'Technology' }, { label: 'Healthcare', value: 'Healthcare' }] }
				],
				childRelationships: []
			})
		});

		// Mock credentials lookup
		const storage = require('@/lib/db/salesforce-storage');
		storage.getSalesforceCredentialsBySub.mockResolvedValue({
			accessToken: 'mock-token',
			instanceUrl: 'https://instance.test',
			refreshToken: 'mock-refresh',
			userInfo: { id: 'user-1' }
		});
	});

	describe('Happy Path', () => {
		it('should successfully generate and execute a query', async () => {
			// Mock successful API response for the query execution
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockQueryResponse)
			} as any);

			// Mock AI generateObject
			const { generateObject } = require('ai');
			generateObject.mockResolvedValue({
				object: {
					sql: "SELECT Id, Name, Industry FROM Account WHERE Industry = 'Technology' LIMIT 100",
					tablesUsed: ['Account'],
					rationale: 'Query filters accounts by technology industry as requested',
					confidence: 0.95
				}
			});

					const tool = generateQueryTool(testSubId);
					console.log('TOOL RETURNED (happy path):', tool);
					const result = await exec(tool, {
						sobjects: [testSobjectType],
						description: testDescription
					});

			// The tool returns an object containing query, results, and metadata
			expect(result.query).toBeDefined();
			expect(result.results).toBeDefined();
			expect(result.metadata).toBeDefined();

			// Verify embeddings were created (description embedding)
			expect(mockEmbedText).toHaveBeenCalledTimes(1);
		});

		it('should validate SELECT-only SQL', async () => {
			// Mock AI generateObject returning unsafe SQL
			const { generateObject } = require('ai');
			generateObject.mockResolvedValue({
				object: {
					sql: "DELETE FROM Account WHERE Industry = 'Technology'",
					tablesUsed: ['Account'],
					rationale: 'Attempting unsafe operation',
					confidence: 0.95
				}
			});

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('non-SELECT statements');
		});
	});

	describe('Input Validation', () => {
		it('should reject empty subId', async () => {
			const tool = generateQueryTool('');
					await expect(exec(tool, {
						sobjects: [testSobjectType],
						description: testDescription
					})).rejects.toThrow('subId is required for Salesforce authentication');
		});

		it('should reject empty sobjectType', async () => {
			const tool = generateQueryTool(testSubId);
					await expect(exec(tool, {
						sobjects: [''],
						description: testDescription
					})).rejects.toThrow();
		});

		it('should reject empty description', async () => {
			const tool = generateQueryTool(testSubId);
					await expect(exec(tool, {
						sobjects: [testSobjectType],
						description: ''
					})).rejects.toThrow('description is required to understand what data you are looking for');
		});

		it('should reject whitespace-only description', async () => {
			const tool = generateQueryTool(testSubId);
					await expect(exec(tool, {
						sobjects: [testSobjectType],
						description: '   \n\t   '
					})).rejects.toThrow('description is required to understand what data you are looking for');
		});
	});

	describe('Error Handling', () => {
		it('should handle describe API failure', async () => {
			// Make the salesforce client fail when fetching global describes
			const salesforce = require('@/lib/salesforce');
			salesforce.createSalesforceClient.mockReturnValue({
				describeGlobal: jest.fn().mockRejectedValue(new Error('Failed to fetch describe'))
			});

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('Failed to fetch describe');
		});

		it('should handle invalid describe response', async () => {
			// Return a describe with no fields
			const salesforce = require('@/lib/salesforce');
			salesforce.createSalesforceClient.mockReturnValue({
				describeGlobal: jest.fn().mockResolvedValue({
					sobjects: [ { name: 'Account', label: 'Account', labelPlural: 'Accounts', queryable: true } ]
				}),
				describe: jest.fn().mockResolvedValue({})
			});

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('No relevant fields found');
		});

		it('should handle empty fields in describe', async () => {
			const emptyDescribeResponse = {
				describe: {
					name: 'Account',
					label: 'Account',
					keyPrefix: '001',
					fields: [],
					childRelationships: []
				}
			};

			const salesforce = require('@/lib/salesforce');
			salesforce.createSalesforceClient.mockReturnValue({
				describeGlobal: jest.fn().mockResolvedValue({
					sobjects: [ { name: 'Account', label: 'Account', labelPlural: 'Accounts', queryable: true } ]
				}),
				describe: jest.fn().mockResolvedValue(emptyDescribeResponse.describe)
			});

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('No relevant fields found');
		});

		it('should handle embedding failures gracefully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockDescribeResponse)
			} as any);

			mockEmbedText.mockRejectedValue(new Error('Embedding service unavailable'));

					const tool = generateQueryTool(testSubId);
					await expect(exec(tool, {
						sobjects: [testSobjectType],
						description: testDescription
					})).rejects.toThrow('Embedding service unavailable');
		});

		it('should handle query execution failure', async () => {
			// Mock generateObject to return a valid SELECT
			const { generateObject } = require('ai');
			generateObject.mockResolvedValue({
				object: {
					sql: 'SELECT Id, Name FROM Account LIMIT 100',
					tablesUsed: ['Account'],
					rationale: 'Basic account query',
					confidence: 0.95
				}
			});

			// Mock query execution to fail with structured json error
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ error: 'bad', details: 'oops' })
			} as any);

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('Query execution failed');
		});

		it('should handle no relevant fields found', async () => {
			// Make describe return no fields
			const salesforce = require('@/lib/salesforce');
			salesforce.createSalesforceClient.mockReturnValue({
				describeGlobal: jest.fn().mockResolvedValue({
					sobjects: [ { name: 'Account', label: 'Account', labelPlural: 'Accounts', queryable: true } ]
				}),
				describe: jest.fn().mockResolvedValue({ fields: [], childRelationships: [] })
			});

			const tool = generateQueryTool(testSubId);
			await expect(exec(tool, {
				sobjects: [testSobjectType],
				description: testDescription
			})).rejects.toThrow('No relevant fields found');
		});
	});

	describe('AI Integration', () => {
		it('should call generateObject with proper context', async () => {
				mockFetch
					.mockResolvedValueOnce({
						ok: true,
						json: () => Promise.resolve(mockDescribeResponse)
					} as any)
					.mockResolvedValueOnce({
						ok: true,
						json: () => Promise.resolve(mockQueryResponse)
					} as any);

				const { generateObject } = require('ai');
				generateObject.mockResolvedValue({
					object: {
						sql: 'SELECT Id, Name, Industry FROM Account LIMIT 100',
						tablesUsed: ['Account'],
						rationale: 'Basic account query',
						confidence: 0.95
					}
				});

				const tool = generateQueryTool(testSubId);
				await exec(tool, {
					sobjects: [testSobjectType],
					description: testDescription
				});

				// Accept any model object; assert generateObject was called and the schema/prompt are present
				expect(generateObject).toHaveBeenCalled();
				const call = generateObject.mock.calls[0][0];
				expect(call.prompt).toEqual(expect.stringContaining('Find all technology companies'));
				// Ensure the schema passed is the QueryGenerationSchema reference
				expect(call.schema).toBe(QueryGenerationSchema);
				// relaxed checks: prompt should contain field names
				expect(call.prompt).toEqual(expect.stringContaining('Name'));
				expect(call.prompt).toEqual(expect.stringContaining('Industry'));
		});
	});
});

/**
 * OVERVIEW
 *
 * - Purpose: Comprehensive test coverage for generateQueryTool functionality
 * - Assumptions: All external dependencies are properly mocked for isolated testing
 * - Edge Cases: Covers input validation, API failures, empty responses, and security validation
 * - Testing Strategy: Unit tests with mocked dependencies for fast, reliable CI execution
 * - Future Improvements:
 *   - Add integration tests with real API responses
 *   - Performance testing for large field sets
 *   - End-to-end testing with actual Salesforce sandbox
 *
 */

/*
 * === generateQueryTool.test.ts ===
 * Updated: 2025-08-27 00:00
 * Summary: Comprehensive unit tests for semantic SOQL query generation
 * Key Test Areas:
 *   - Happy path query generation and execution
 *   - Input validation and error handling
 *   - Vector store integration and field processing
 *   - AI model integration and context building
 * Dependencies:
 *   - Jest for testing framework
 *   - Mocked external APIs and services
 * Version History:
 *   v1.0 – initial comprehensive test implementation
 * Notes:
 *   - All external dependencies mocked for fast execution
 *   - Covers security validation for SELECT-only queries
 *   - Tests both success and failure scenarios
 *
 */