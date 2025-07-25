import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MCPClientConfig, TransportConfig, ToolCallRequest, ToolCallResponse, ResourceReadResponse, PromptGetRequest, PromptGetResponse } from './types';
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
export declare class MCPClient {
    readonly config: MCPClientConfig;
    private client;
    private transport;
    private isConnectedFlag;
    private currentTransportConfig;
    constructor(config: MCPClientConfig);
    /**
     * Connects to an MCP server using the specified transport
     * @param transportConfig - Transport configuration
     */
    connect(transportConfig: TransportConfig): Promise<void>;
    /**
     * Disconnects from the MCP server
     */
    disconnect(): Promise<void>;
    /**
     * Checks if the client is currently connected
     * @returns True if connected
     */
    isConnected(): boolean;
    /**
     * Reconnects using the last successful transport configuration
     */
    reconnect(): Promise<void>;
    /**
     * Creates a transport instance based on configuration
     * @param config - Transport configuration
     * @returns Transport instance
     */
    private createTransport;
    /**
     * Calls a tool on the connected MCP server
     * @param request - Tool call request
     * @returns Tool call response
     */
    callTool(request: ToolCallRequest): Promise<ToolCallResponse>;
    /**
     * Lists all available tools on the connected server
     * @returns Array of available tools
     */
    listTools(): Promise<Array<{
        name: string;
        description?: string;
        inputSchema?: any;
    }>>;
    /**
     * Lists all available resources on the connected server
     * @returns Array of available resources
     */
    listResources(): Promise<Array<{
        uri: string;
        name?: string;
        description?: string;
        mimeType?: string;
    }>>;
    /**
     * Reads a specific resource from the connected server
     * @param uri - Resource URI to read
     * @returns Resource content
     */
    readResource(uri: string): Promise<ResourceReadResponse>;
    /**
     * Lists all available prompts on the connected server
     * @returns Array of available prompts
     */
    listPrompts(): Promise<Array<{
        name: string;
        description?: string;
        arguments?: any[];
    }>>;
    /**
     * Gets a specific prompt from the connected server
     * @param request - Prompt get request
     * @returns Prompt response
     */
    getPrompt(request: PromptGetRequest): Promise<PromptGetResponse>;
    /**
     * Sets roots for the client (if supported by server)
     * @param roots - Array of root URIs
     */
    setRoots(roots: string[]): Promise<void>;
    /**
     * Requests sampling from the server (if supported)
     * @param request - Sampling request
     * @returns Sampling response
     */
    requestSampling(request: any): Promise<any>;
    /**
     * Gets the underlying MCP client instance (for advanced usage)
     * @returns MCP client instance
     */
    getClient(): Client;
    /**
     * Gets the current transport configuration
     * @returns Current transport config or null
     */
    getCurrentTransportConfig(): TransportConfig | null;
    /**
     * Ensures the client is connected, throws error if not
     */
    private ensureConnected;
    /**
     * Adds an event listener for client events
     * @param event - Event name
     * @param listener - Event listener function
     */
    on(event: string, listener: (...args: any[]) => void): void;
    /**
     * Removes an event listener
     * @param event - Event name
     * @param listener - Event listener function
     */
    off(event: string, listener: (...args: any[]) => void): void;
}
