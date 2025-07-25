import { EventEmitter } from 'events';
import { MCPServerConfig, MCPTool, MCPResource, MCPResourceTemplate, MCPPrompt, ServerStartOptions } from './types';
/**
 * OVERVIEW
 *
 * MCPServer is a type-safe wrapper around FastMCP that provides:
 * - Simplified server configuration and lifecycle management
 * - Type-safe tool registration with Zod schema validation
 * - Resource and resource template management
 * - Prompt template handling with auto-completion
 * - Multiple transport support (stdio, SSE, HTTP streaming)
 * - Event-driven architecture for client connections
 * - Built-in authentication and session management
 *
 * The server automatically handles FastMCP initialization, connection
 * management, and provides a clean API for adding tools, resources,
 * and prompts. All operations are fully typed and validated.
 */
export declare class MCPServer extends EventEmitter {
    readonly config: MCPServerConfig;
    private fastMCPInstance;
    private tools;
    private resources;
    private resourceTemplates;
    private prompts;
    private isServerRunning;
    private sessions;
    constructor(config: MCPServerConfig);
    /**
     * Initializes the underlying FastMCP instance with configuration
     */
    private initializeFastMCP;
    /**
     * Adds a tool to the server with validation
     * @param tool - Tool definition with execute function
     */
    addTool<T = any>(tool: MCPTool<T>): void;
    /**
     * Removes a tool from the server
     * @param name - Tool name to remove
     */
    removeTool(name: string): boolean;
    /**
     * Gets all registered tools
     * @returns Array of tool definitions
     */
    getTools(): MCPTool[];
    /**
     * Gets a specific tool by name
     * @param name - Tool name
     * @returns Tool definition or undefined
     */
    getTool(name: string): MCPTool | undefined;
    /**
     * Adds a resource to the server
     * @param resource - Resource definition with load function
     */
    addResource(resource: MCPResource): void;
    /**
     * Adds a resource template to the server
     * @param template - Resource template definition
     */
    addResourceTemplate(template: MCPResourceTemplate): void;
    /**
     * Gets all registered resources
     * @returns Array of resource definitions
     */
    getResources(): MCPResource[];
    /**
     * Gets all registered resource templates
     * @returns Array of resource template definitions
     */
    getResourceTemplates(): MCPResourceTemplate[];
    /**
     * Adds a prompt to the server
     * @param prompt - Prompt definition with load function
     */
    addPrompt(prompt: MCPPrompt): void;
    /**
     * Gets all registered prompts
     * @returns Array of prompt definitions
     */
    getPrompts(): MCPPrompt[];
    /**
     * Starts the MCP server with specified transport
     * @param options - Server start options including transport configuration
     */
    start(options: ServerStartOptions): Promise<void>;
    /**
     * Stops the MCP server
     */
    stop(): Promise<void>;
    /**
     * Checks if the server is currently running
     * @returns True if server is running
     */
    isRunning(): boolean;
    /**
     * Gets the current active sessions
     * @returns Set of active sessions
     */
    getSessions(): Set<any>;
    /**
     * Gets the underlying FastMCP instance (for advanced usage)
     * @returns FastMCP instance
     */
    getFastMCPInstance(): any;
    /**
     * Creates an embedded resource reference
     * @param uri - Resource URI to embed
     * @returns Promise resolving to embedded resource
     */
    embedded(uri: string): Promise<any>;
    /**
     * Simulates a client connection (for testing)
     */
    simulateConnection(): void;
    /**
     * Simulates a client disconnection (for testing)
     */
    simulateDisconnection(): void;
}
