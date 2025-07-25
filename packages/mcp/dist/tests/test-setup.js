// === test-setup.ts ===
// Created: 2025-07-24 12:00
// Purpose: Jest test setup and global configuration
// Ensures proper test environment for MCP package tests
import 'jest';
// Global test configuration
beforeAll(() => {
    // Mock console methods to reduce noise during tests
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => {
    // Restore console methods
    jest.restoreAllMocks();
});
// Mock FastMCP imports since they won't exist during RED phase
jest.mock('fastmcp', () => ({
    FastMCP: jest.fn().mockImplementation(() => ({
        addTool: jest.fn(),
        addResource: jest.fn(),
        addResourceTemplate: jest.fn(),
        addPrompt: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        embedded: jest.fn().mockResolvedValue({}),
    })),
    imageContent: jest.fn().mockResolvedValue({
        type: 'image',
        data: 'mock-image-data',
        mimeType: 'image/png',
    }),
    audioContent: jest.fn().mockResolvedValue({
        type: 'audio',
        data: 'mock-audio-data',
        mimeType: 'audio/mpeg',
    }),
    UserError: class MockUserError extends Error {
        constructor(message, options) {
            super(message);
            this.name = 'UserError';
            if (options?.cause) {
                this.cause = options.cause;
            }
        }
    },
}));
// Mock @modelcontextprotocol/sdk
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        callTool: jest.fn().mockResolvedValue({
            content: [{ type: 'text', text: 'Mock result' }],
        }),
        listTools: jest.fn().mockResolvedValue([
            { name: 'mock_tool', description: 'Mock tool' },
        ]),
        listResources: jest.fn().mockResolvedValue([
            { uri: 'file:///mock.txt', name: 'Mock file' },
        ]),
        readResource: jest.fn().mockResolvedValue({
            contents: [{ type: 'text', text: 'Mock content' }],
        }),
        listPrompts: jest.fn().mockResolvedValue([
            { name: 'mock_prompt', description: 'Mock prompt' },
        ]),
        getPrompt: jest.fn().mockResolvedValue({
            messages: [{ role: 'user', content: { type: 'text', text: 'Mock prompt' } }],
        }),
    })),
}));
jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
    SSEClientTransport: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
    StreamableHTTPClientTransport: jest.fn().mockImplementation(() => ({})),
}));
/*
 * === test-setup.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Jest test setup with mocks for RED phase testing
 * Key Components:
 *   - Console mocking for clean test output
 *   - FastMCP library mocks
 *   - MCP SDK mocks
 *   - Transport layer mocks
 * Dependencies:
 *   - Requires: jest
 * Version History:
 *   v1.0 – initial setup
 * Notes:
 *   - Provides mocks for libraries that don't exist during RED phase
 *   - Will be updated when moving to GREEN phase
 */
