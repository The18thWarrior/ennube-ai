// === client.ts ===
// Created: 2025-07-24 12:00
// Purpose: FastMCP client wrapper with type-safe API
// Exports: MCPClient class for connecting to MCP servers
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { MCPError, } from './types';
import { validateTransportConfig } from './utils';
/**
 * OVERVIEW
 *
 * MCPClient is a type-safe wrapper around the MCP SDK client that provides:
 * - Simplified client configuration and connection management
 * - Multiple transport support (stdio, SSE, HTTP streaming)
 * - Type-safe tool calling with automatic error handling
 * - Resource listing and reading capabilities
 * - Prompt management and retrieval
 * - Connection lifecycle management with reconnection support
 *
 * The client automatically handles transport creation, connection establishment,
 * and provides a clean API for interacting with MCP servers. All operations
 * are fully typed and include comprehensive error handling.
 */
export class MCPClient {
    client;
    transport;
    isConnectedFlag = false;
    currentTransportConfig = null;
    config;
    constructor(config) {
        // Validate client configuration
        if (!config.name || config.name.trim() === '') {
            throw new MCPError('Client name is required');
        }
        if (!config.version || config.version.trim() === '') {
            throw new MCPError('Client version is required');
        }
        // Set default capabilities if not provided
        const capabilities = config.capabilities || {
            roots: true,
            sampling: true
        };
        // Store config with capabilities
        this.config = { ...config, capabilities };
        // Initialize MCP client
        this.client = new Client({
            name: config.name,
            version: config.version,
        }, {
            capabilities: {
                roots: capabilities.roots ? { listChanged: true } : undefined,
                sampling: capabilities.sampling ? {} : undefined,
            },
        });
    }
    // ===== Connection Management =====
    /**
     * Connects to an MCP server using the specified transport
     * @param transportConfig - Transport configuration
     */
    async connect(transportConfig) {
        if (this.isConnectedFlag) {
            throw new MCPError('Client is already connected');
        }
        // Validate transport configuration
        const validation = validateTransportConfig(transportConfig);
        if (!validation.isValid) {
            throw new MCPError(`Invalid transport configuration: ${validation.errors?.join(', ')}`);
        }
        try {
            // Create transport based on type
            this.transport = this.createTransport(transportConfig);
            // Connect to server
            await this.client.connect(this.transport);
            this.isConnectedFlag = true;
            this.currentTransportConfig = transportConfig;
        }
        catch (error) {
            this.isConnectedFlag = false;
            this.transport = null;
            this.currentTransportConfig = null;
            throw new MCPError(`Failed to connect to MCP server: ${error.message}`, 'CONNECTION_ERROR', { cause: error });
        }
    }
    /**
     * Disconnects from the MCP server
     */
    async disconnect() {
        if (!this.isConnectedFlag) {
            return;
        }
        try {
            // Note: MCP SDK client doesn't have a disconnect method
            // We'll close the transport directly if available
            if (this.transport && typeof this.transport.close === 'function') {
                await this.transport.close();
            }
        }
        catch (error) {
            // Log the error but don't throw as we're cleaning up
            console.warn('Error during disconnect:', error);
        }
        finally {
            this.isConnectedFlag = false;
            this.transport = null;
            this.currentTransportConfig = null;
        }
    }
    /**
     * Checks if the client is currently connected
     * @returns True if connected
     */
    isConnected() {
        return this.isConnectedFlag;
    }
    /**
     * Reconnects using the last successful transport configuration
     */
    async reconnect() {
        if (!this.currentTransportConfig) {
            throw new MCPError('No previous connection configuration available');
        }
        await this.disconnect();
        await this.connect(this.currentTransportConfig);
    }
    // ===== Transport Creation =====
    /**
     * Creates a transport instance based on configuration
     * @param config - Transport configuration
     * @returns Transport instance
     */
    createTransport(config) {
        switch (config.type) {
            case 'stdio':
                return new StdioClientTransport({
                    command: config.command || 'node',
                    args: config.args || [],
                    env: config.env || {},
                });
            case 'sse':
                return new SSEClientTransport(new URL(config.url));
            case 'httpStream':
                return new StreamableHTTPClientTransport(new URL(config.url), {
                    requestInit: {
                        headers: config.headers || {},
                    },
                });
            default:
                throw new MCPError(`Unsupported transport type: ${config.type}`);
        }
    }
    // ===== Tool Operations =====
    /**
     * Calls a tool on the connected MCP server
     * @param request - Tool call request
     * @returns Tool call response
     */
    async callTool(request) {
        this.ensureConnected();
        try {
            const result = await this.client.callTool({
                name: request.name,
                arguments: request.arguments || {},
            });
            return {
                content: result.content || [],
                isError: result.isError,
            };
        }
        catch (error) {
            throw new MCPError(`Tool call failed for "${request.name}": ${error.message}`, 'TOOL_CALL_ERROR', { cause: error });
        }
    }
    /**
     * Lists all available tools on the connected server
     * @returns Array of available tools
     */
    async listTools() {
        this.ensureConnected();
        try {
            const result = await this.client.listTools();
            return result.tools || [];
        }
        catch (error) {
            throw new MCPError(`Failed to list tools: ${error.message}`, 'TOOL_LIST_ERROR', { cause: error });
        }
    }
    // ===== Resource Operations =====
    /**
     * Lists all available resources on the connected server
     * @returns Array of available resources
     */
    async listResources() {
        this.ensureConnected();
        try {
            const result = await this.client.listResources();
            return result.resources || [];
        }
        catch (error) {
            throw new MCPError(`Failed to list resources: ${error.message}`, 'RESOURCE_LIST_ERROR', { cause: error });
        }
    }
    /**
     * Reads a specific resource from the connected server
     * @param uri - Resource URI to read
     * @returns Resource content
     */
    async readResource(uri) {
        this.ensureConnected();
        try {
            const result = await this.client.readResource({ uri });
            return {
                contents: result.contents || [],
            };
        }
        catch (error) {
            throw new MCPError(`Failed to read resource "${uri}": ${error.message}`, 'RESOURCE_READ_ERROR', { cause: error });
        }
    }
    // ===== Prompt Operations =====
    /**
     * Lists all available prompts on the connected server
     * @returns Array of available prompts
     */
    async listPrompts() {
        this.ensureConnected();
        try {
            const result = await this.client.listPrompts();
            return result.prompts || [];
        }
        catch (error) {
            throw new MCPError(`Failed to list prompts: ${error.message}`, 'PROMPT_LIST_ERROR', { cause: error });
        }
    }
    /**
     * Gets a specific prompt from the connected server
     * @param request - Prompt get request
     * @returns Prompt response
     */
    async getPrompt(request) {
        this.ensureConnected();
        try {
            const result = await this.client.getPrompt({
                name: request.name,
                arguments: request.arguments || {},
            });
            return {
                messages: result.messages || [],
            };
        }
        catch (error) {
            throw new MCPError(`Failed to get prompt "${request.name}": ${error.message}`, 'PROMPT_GET_ERROR', { cause: error });
        }
    }
    // ===== Advanced Operations =====
    /**
     * Sets roots for the client (if supported by server)
     * @param roots - Array of root URIs
     */
    async setRoots(roots) {
        this.ensureConnected();
        try {
            // Use the request method to send roots notification
            await this.client.request({
                method: 'notifications/roots/list_changed',
                params: {
                    roots: roots.map(uri => ({ uri })),
                },
            }, null);
        }
        catch (error) {
            throw new MCPError(`Failed to set roots: ${error.message}`, 'ROOTS_ERROR', { cause: error });
        }
    }
    /**
     * Requests sampling from the server (if supported)
     * @param request - Sampling request
     * @returns Sampling response
     */
    async requestSampling(request) {
        this.ensureConnected();
        try {
            return await this.client.request({
                method: 'sampling/createMessage',
                params: request,
            }, null);
        }
        catch (error) {
            throw new MCPError(`Failed to request sampling: ${error.message}`, 'SAMPLING_ERROR', { cause: error });
        }
    }
    // ===== Utility Methods =====
    /**
     * Gets the underlying MCP client instance (for advanced usage)
     * @returns MCP client instance
     */
    getClient() {
        return this.client;
    }
    /**
     * Gets the current transport configuration
     * @returns Current transport config or null
     */
    getCurrentTransportConfig() {
        return this.currentTransportConfig;
    }
    /**
     * Ensures the client is connected, throws error if not
     */
    ensureConnected() {
        if (!this.isConnectedFlag) {
            throw new MCPError('Client is not connected to a server');
        }
    }
    // ===== Event Handling =====
    /**
     * Adds an event listener for client events
     * @param event - Event name
     * @param listener - Event listener function
     */
    on(event, listener) {
        // Note: The MCP client doesn't expose an event emitter interface
        // This is a placeholder for future implementation
        console.warn('Event handling not yet implemented for MCP client');
    }
    /**
     * Removes an event listener
     * @param event - Event name
     * @param listener - Event listener function
     */
    off(event, listener) {
        // Note: The MCP client doesn't expose an event emitter interface
        // This is a placeholder for future implementation
        console.warn('Event handling not yet implemented for MCP client');
    }
}
/*
 * === client.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Type-safe MCP client wrapper with comprehensive functionality
 * Key Components:
 *   - MCPClient: Main client class with connection management
 *   - Transport creation: stdio, SSE, HTTP streaming support
 *   - Tool operations: callTool(), listTools()
 *   - Resource operations: listResources(), readResource()
 *   - Prompt operations: listPrompts(), getPrompt()
 *   - Connection lifecycle: connect(), disconnect(), reconnect()
 *   - Advanced features: setRoots(), requestSampling()
 *   - Error handling with MCPError
 * Dependencies:
 *   - Requires: @modelcontextprotocol/sdk, types, utils
 * Version History:
 *   v1.0 – initial implementation
 * Notes:
 *   - Provides complete type safety over MCP SDK
 *   - Includes comprehensive error handling and validation
 *   - Supports all major MCP client operations
 */
