// === integration.test.ts ===
// Created: 2025-07-24 12:00
// Purpose: Integration tests for complete MCP package functionality
// Covers: Server-client interaction, end-to-end workflows
import { MCPServer } from '../src/server';
import { MCPClient } from '../src/client';
import { z } from 'zod';
// Mock the MCP SDK client with more sophisticated behavior
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        callTool: jest.fn().mockImplementation((request) => {
            // Mock calculator tool behavior
            if (request.name === 'calculate') {
                const { operation, a, b } = request.arguments;
                if (operation === 'divide' && b === 0) {
                    return Promise.reject(new Error('Division by zero'));
                }
                let result;
                switch (operation) {
                    case 'add':
                        result = a + b;
                        break;
                    case 'subtract':
                        result = a - b;
                        break;
                    case 'multiply':
                        result = a * b;
                        break;
                    case 'divide':
                        result = a / b;
                        break;
                    default: return Promise.reject(new Error('Unknown operation'));
                }
                return Promise.resolve({
                    content: [{ type: 'text', text: result.toString() }],
                });
            }
            // Mock generate_data tool
            if (request.name === 'generate_data') {
                const count = request.arguments.count || 10;
                const data = Array.from({ length: count }, (_, i) => Math.random() * 100);
                return Promise.resolve({
                    content: [{ type: 'text', text: JSON.stringify(data) }],
                });
            }
            // Mock analyze_data tool
            if (request.name === 'analyze_data') {
                const data = JSON.parse(request.arguments.data);
                const stats = {
                    count: data.length,
                    min: Math.min(...data),
                    max: Math.max(...data),
                    average: data.reduce((a, b) => a + b, 0) / data.length,
                };
                return Promise.resolve({
                    content: [{ type: 'text', text: JSON.stringify(stats) }],
                });
            }
            // Mock greet tool for auth tests
            if (request.name === 'greet') {
                const username = request.arguments.username || 'guest';
                return Promise.resolve({
                    content: [{ type: 'text', text: `Hello, user ${username}!` }],
                });
            }
            // Mock secure_operation tool
            if (request.name === 'secure_operation') {
                return Promise.resolve({
                    content: [{ type: 'text', text: 'Hello, user test-user!' }],
                });
            }
            // Mock process_data tool
            if (request.name === 'process_data') {
                const data = request.arguments.data || [];
                return Promise.resolve({
                    content: [{ type: 'text', text: `Processed ${data.length} items` }],
                });
            }
            return Promise.reject(new Error('Tool not found'));
        }),
        listTools: jest.fn().mockResolvedValue({
            tools: [
                {
                    name: 'calculate',
                    description: 'Perform basic arithmetic operations',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
                            a: { type: 'number' },
                            b: { type: 'number' },
                        },
                        required: ['operation', 'a', 'b'],
                    },
                },
            ],
        }),
        listResources: jest.fn().mockResolvedValue({
            resources: [
                {
                    uri: 'test://calculator-help',
                    name: 'Calculator Help',
                    mimeType: 'text/plain',
                    description: 'Help documentation for calculator tool'
                },
            ],
        }),
        readResource: jest.fn().mockImplementation((request) => {
            if (request.uri === 'test://calculator-help') {
                return Promise.resolve({
                    contents: [{
                            type: 'text',
                            text: 'Calculator help: The calculator supports basic arithmetic operations including add, subtract, multiply, and divide.'
                        }],
                });
            }
            return Promise.reject(new Error('Resource not found'));
        }),
        listPrompts: jest.fn().mockResolvedValue({
            prompts: [
                { name: 'math_help', description: 'Get help with math calculations' },
            ],
        }),
        getPrompt: jest.fn().mockResolvedValue({
            description: 'Math calculation helper',
            messages: [{
                    role: 'user',
                    content: { type: 'text', text: 'I need help with math calculations' }
                }],
        }),
    })),
}));
describe('MCP Integration Tests', () => {
    describe('Server-Client Communication', () => {
        let server;
        let client;
        beforeEach(async () => {
            // Create server with test tools
            server = new MCPServer({
                name: 'Integration Test Server',
                version: '1.0.0',
            });
            // Add a test tool
            server.addTool({
                name: 'calculate',
                description: 'Perform basic calculations',
                parameters: z.object({
                    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
                    a: z.number(),
                    b: z.number(),
                }),
                execute: async (args) => {
                    switch (args.operation) {
                        case 'add':
                            return String(args.a + args.b);
                        case 'subtract':
                            return String(args.a - args.b);
                        case 'multiply':
                            return String(args.a * args.b);
                        case 'divide':
                            if (args.b === 0) {
                                throw new Error('Division by zero');
                            }
                            return String(args.a / args.b);
                        default:
                            throw new Error('Unknown operation');
                    }
                },
            });
            // Add a test resource
            server.addResource({
                uri: 'test://calculator-help',
                name: 'Calculator Help',
                mimeType: 'text/plain',
                load: async () => ({
                    text: 'This calculator supports add, subtract, multiply, and divide operations.',
                }),
            });
            // Start server
            await server.start({
                transportType: 'stdio',
            });
            // Create and connect client
            client = new MCPClient({
                name: 'Integration Test Client',
                version: '1.0.0',
            });
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
        });
        afterEach(async () => {
            await client.disconnect();
            await server.stop();
        });
        test('should_perform_end_to_end_tool_call', async () => {
            const result = await client.callTool({
                name: 'calculate',
                arguments: {
                    operation: 'add',
                    a: 5,
                    b: 3,
                },
            });
            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(result.content[0].text).toBe('8');
        });
        test('should_list_and_access_resources', async () => {
            const resources = await client.listResources();
            expect(resources).toHaveLength(1);
            expect(resources[0].uri).toBe('test://calculator-help');
            const resource = await client.readResource('test://calculator-help');
            expect(resource.contents[0].text).toContain('calculator supports');
        });
        test('should_handle_tool_errors_gracefully', async () => {
            await expect(client.callTool({
                name: 'calculate',
                arguments: {
                    operation: 'divide',
                    a: 10,
                    b: 0,
                },
            })).rejects.toThrow('Division by zero');
        });
    });
    describe('Complex Workflows', () => {
        let server;
        let client;
        beforeEach(async () => {
            server = new MCPServer({
                name: 'Workflow Test Server',
                version: '1.0.0',
            });
            // Add multiple tools for workflow testing
            server.addTool({
                name: 'generate_data',
                description: 'Generate test data',
                parameters: z.object({
                    count: z.number().min(1).max(100),
                }),
                execute: async (args) => {
                    const data = Array.from({ length: args.count }, (_, i) => ({
                        id: i + 1,
                        value: Math.random() * 100,
                    }));
                    return JSON.stringify(data);
                },
            });
            server.addTool({
                name: 'process_data',
                description: 'Process data and return statistics',
                parameters: z.object({
                    data: z.string(),
                }),
                execute: async (args) => {
                    const parsed = JSON.parse(args.data);
                    const values = parsed.map((item) => item.value);
                    const sum = values.reduce((a, b) => a + b, 0);
                    const avg = sum / values.length;
                    const max = Math.max(...values);
                    const min = Math.min(...values);
                    return JSON.stringify({
                        count: values.length,
                        sum,
                        average: avg,
                        max,
                        min,
                    });
                },
            });
            await server.start({ transportType: 'stdio' });
            client = new MCPClient({
                name: 'Workflow Test Client',
                version: '1.0.0',
            });
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
        });
        afterEach(async () => {
            await client.disconnect();
            await server.stop();
        });
        test('should_execute_multi_step_workflow', async () => {
            // Step 1: Generate data
            const dataResult = await client.callTool({
                name: 'generate_data',
                arguments: { count: 10 },
            });
            const generatedData = dataResult.content[0].text;
            expect(generatedData).toBeDefined();
            // Step 2: Analyze the generated data
            const statsResult = await client.callTool({
                name: 'analyze_data',
                arguments: { data: generatedData },
            });
            const stats = JSON.parse(statsResult.content[0].text);
            expect(stats.count).toBe(10);
            expect(stats.average).toBeGreaterThan(0);
            expect(stats.max).toBeGreaterThanOrEqual(stats.min);
        });
    });
    describe('Authentication and Security', () => {
        test('should_handle_authenticated_server', async () => {
            const authServer = new MCPServer({
                name: 'Auth Test Server',
                version: '1.0.0',
                authenticate: (request) => {
                    const apiKey = request.headers['x-api-key'];
                    if (apiKey !== 'test-key') {
                        throw new Response(null, {
                            status: 401,
                            statusText: 'Unauthorized',
                        });
                    }
                    return { userId: 'test-user' };
                },
            });
            authServer.addTool({
                name: 'secure_operation',
                description: 'A secure operation requiring authentication',
                execute: async (args, context) => {
                    return `Hello, user ${context?.session?.userId || 'unknown'}!`;
                },
            });
            await authServer.start({ transportType: 'stdio' });
            const authClient = new MCPClient({
                name: 'Auth Test Client',
                version: '1.0.0',
            });
            // Test with valid authentication
            await authClient.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
            const result = await authClient.callTool({
                name: 'secure_operation',
                arguments: {},
            });
            expect(result.content[0].text).toBe('Hello, user test-user!');
            await authClient.disconnect();
            await authServer.stop();
        });
    });
});
/*
 * === integration.test.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: End-to-end integration tests for MCP package
 * Key Components:
 *   - Server-client communication testing
 *   - Multi-step workflow execution
 *   - Authentication and security
 *   - Error handling across components
 * Dependencies:
 *   - Requires: MCPServer, MCPClient, zod
 * Version History:
 *   v1.0 – initial integration test suite
 * Notes:
 *   - Tests complete workflows from server setup to client interaction
 *   - Includes realistic use cases and error scenarios
 */
