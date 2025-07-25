// === client.test.ts ===
// Created: 2025-07-24 12:00
// Purpose: Test FastMCP client wrapper functionality
// Covers: Client creation, transport connections, tool calling, resource access
import { MCPClient } from '../src/client';
// Mock the MCP SDK client
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        callTool: jest.fn().mockImplementation((request) => {
            if (request.name === 'non_existent_tool') {
                return Promise.reject(new Error('Tool not found'));
            }
            return Promise.resolve({
                content: [{ type: 'text', text: 'Mock result' }],
            });
        }),
        listTools: jest.fn().mockResolvedValue({
            tools: [
                { name: 'test_tool', description: 'Test tool description' },
                { name: 'another_tool', description: 'Another tool' },
            ],
        }),
        listResources: jest.fn().mockResolvedValue({
            resources: [
                { uri: 'file:///test.txt', name: 'test.txt', mimeType: 'text/plain' },
            ],
        }),
        readResource: jest.fn().mockImplementation((request) => {
            if (request.uri === 'file:///non-existent.txt') {
                return Promise.reject(new Error('Resource not found'));
            }
            return Promise.resolve({
                contents: [{ type: 'text', text: 'Mock content' }],
            });
        }),
        listPrompts: jest.fn().mockResolvedValue({
            prompts: [
                { name: 'test_prompt', description: 'Test prompt description' },
            ],
        }),
        getPrompt: jest.fn().mockResolvedValue({
            description: 'Mock prompt',
            messages: [{ role: 'user', content: { type: 'text', text: 'Mock prompt content' } }],
        }),
    })),
}));
describe('MCPClient', () => {
    let client;
    describe('Client Creation', () => {
        test('should_create_client_with_capabilities', () => {
            const config = {
                name: 'Test Client',
                version: '1.0.0',
                capabilities: {
                    sampling: true,
                    roots: true,
                },
            };
            const client = new MCPClient(config);
            expect(client).toBeDefined();
            expect(client.config.name).toBe('Test Client');
            expect(client.config.version).toBe('1.0.0');
            expect(client.config.capabilities?.sampling).toBe(true);
        });
        test('should_create_client_with_default_capabilities', () => {
            const config = {
                name: 'Default Client',
                version: '1.0.0',
            };
            const client = new MCPClient(config);
            expect(client.config.capabilities).toBeDefined();
        });
    });
    describe('Transport Connections', () => {
        let client;
        beforeEach(() => {
            client = new MCPClient({
                name: 'Test Client',
                version: '1.0.0',
            });
        });
        test('should_connect_to_stdio_transport', async () => {
            const mockTransport = {
                type: 'stdio',
                command: 'node',
                args: ['server.js'],
            };
            await expect(client.connect(mockTransport)).resolves.not.toThrow();
            expect(client.isConnected()).toBe(true);
        });
        test('should_connect_to_sse_transport', async () => {
            const mockTransport = {
                type: 'sse',
                url: 'http://localhost:8080/sse',
            };
            await expect(client.connect(mockTransport)).resolves.not.toThrow();
            expect(client.isConnected()).toBe(true);
        });
        test('should_connect_to_http_stream_transport', async () => {
            const mockTransport = {
                type: 'httpStream',
                url: 'http://localhost:8080/mcp',
            };
            await expect(client.connect(mockTransport)).resolves.not.toThrow();
            expect(client.isConnected()).toBe(true);
        });
        test('should_handle_connection_errors', async () => {
            const invalidTransport = {
                type: 'invalid',
                url: 'invalid://url',
            };
            await expect(client.connect(invalidTransport)).rejects.toThrow();
            expect(client.isConnected()).toBe(false);
        });
    });
    describe('Tool Operations', () => {
        let client;
        beforeEach(async () => {
            client = new MCPClient({
                name: 'Test Client',
                version: '1.0.0',
            });
            // Mock successful connection
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
        });
        test('should_call_tool_successfully', async () => {
            const result = await client.callTool({
                name: 'add_numbers',
                arguments: {
                    a: 5,
                    b: 3,
                },
            });
            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(Array.isArray(result.content)).toBe(true);
        });
        test('should_list_available_tools', async () => {
            const tools = await client.listTools();
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
            expect(tools[0]).toHaveProperty('name');
            expect(tools[0]).toHaveProperty('description');
        });
        test('should_handle_tool_call_errors', async () => {
            await expect(client.callTool({
                name: 'non_existent_tool',
                arguments: {},
            })).rejects.toThrow();
        });
    });
    describe('Resource Operations', () => {
        let client;
        beforeEach(async () => {
            client = new MCPClient({
                name: 'Test Client',
                version: '1.0.0',
            });
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
        });
        test('should_list_resources', async () => {
            const resources = await client.listResources();
            expect(Array.isArray(resources)).toBe(true);
            expect(resources[0]).toHaveProperty('uri');
            expect(resources[0]).toHaveProperty('name');
        });
        test('should_read_resource', async () => {
            const resource = await client.readResource('file:///test.txt');
            expect(resource).toBeDefined();
            expect(resource.contents).toBeDefined();
            expect(Array.isArray(resource.contents)).toBe(true);
        });
        test('should_handle_resource_read_errors', async () => {
            await expect(client.readResource('file:///non-existent.txt')).rejects.toThrow();
        });
    });
    describe('Prompt Operations', () => {
        let client;
        beforeEach(async () => {
            client = new MCPClient({
                name: 'Test Client',
                version: '1.0.0',
            });
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
        });
        test('should_list_prompts', async () => {
            const prompts = await client.listPrompts();
            expect(Array.isArray(prompts)).toBe(true);
            expect(prompts[0]).toHaveProperty('name');
            expect(prompts[0]).toHaveProperty('description');
        });
        test('should_get_prompt', async () => {
            const prompt = await client.getPrompt({
                name: 'git_commit',
                arguments: {
                    changes: 'Added new feature',
                },
            });
            expect(prompt).toBeDefined();
            expect(prompt.messages).toBeDefined();
            expect(Array.isArray(prompt.messages)).toBe(true);
        });
    });
    describe('Connection Lifecycle', () => {
        let client;
        beforeEach(() => {
            client = new MCPClient({
                name: 'Test Client',
                version: '1.0.0',
            });
        });
        test('should_disconnect_cleanly', async () => {
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
        });
        test('should_handle_reconnection', async () => {
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
            await client.disconnect();
            await client.connect({
                type: 'stdio',
                command: 'node',
                args: ['mock-server.js'],
            });
            expect(client.isConnected()).toBe(true);
        });
    });
});
/*
 * === client.test.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Comprehensive test suite for MCPClient wrapper
 * Key Components:
 *   - Client configuration and capabilities
 *   - Multiple transport type connections
 *   - Tool calling and listing
 *   - Resource operations
 *   - Prompt operations
 *   - Connection lifecycle management
 * Dependencies:
 *   - Requires: MCPClient, types
 * Version History:
 *   v1.0 – initial test suite
 * Notes:
 *   - Tests are designed to fail until implementation is complete
 *   - Uses mocked connections for testing
 */
