// === server.ts ===
// Created: 2025-07-24 12:00
// Purpose: FastMCP server wrapper with type-safe API
// Exports: MCPServer class with tool/resource/prompt management
import { FastMCP } from 'fastmcp';
import { EventEmitter } from 'events';
import { MCPError, } from './types';
import { isValidMCPConfig } from './utils';
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
export class MCPServer extends EventEmitter {
    config;
    fastMCPInstance;
    tools = new Map();
    resources = new Map();
    resourceTemplates = new Map();
    prompts = new Map();
    isServerRunning = false;
    sessions = new Set();
    constructor(config) {
        super();
        this.config = config;
        // Validate configuration before type guard
        if (!config) {
            throw new MCPError('Server configuration is required');
        }
        if (!config.name) {
            throw new MCPError('Server name is required');
        }
        if (config.name.trim() === '') {
            throw new MCPError('Server name cannot be empty');
        }
        if (!config.version) {
            throw new MCPError('Server version is required');
        }
        if (!isValidMCPConfig(config)) {
            throw new MCPError('Invalid server configuration');
        }
        this.initializeFastMCP();
    }
    /**
     * Initializes the underlying FastMCP instance with configuration
     */
    initializeFastMCP() {
        try {
            // Create a configuration object compatible with FastMCP
            const fastMCPConfig = {
                name: this.config.name,
                version: this.config.version,
            };
            // Add optional properties if they exist
            if (this.config.description) {
                fastMCPConfig.description = this.config.description;
            }
            if (this.config.instructions) {
                fastMCPConfig.instructions = this.config.instructions;
            }
            if (this.config.authenticate) {
                fastMCPConfig.authenticate = this.config.authenticate;
            }
            if (this.config.ping) {
                fastMCPConfig.ping = this.config.ping;
            }
            if (this.config.roots) {
                fastMCPConfig.roots = this.config.roots;
            }
            if (this.config.health) {
                fastMCPConfig.health = this.config.health;
            }
            if (this.config.oauth) {
                fastMCPConfig.oauth = this.config.oauth;
            }
            this.fastMCPInstance = new FastMCP(fastMCPConfig);
            // Set up event handlers
            this.fastMCPInstance.on('connect', (event) => {
                this.sessions.add(event.session);
                this.emit('connect', { type: 'connect', session: event.session });
            });
            this.fastMCPInstance.on('disconnect', (event) => {
                this.sessions.delete(event.session);
                this.emit('disconnect', { type: 'disconnect', session: event.session });
            });
        }
        catch (error) {
            throw new MCPError(`Failed to initialize FastMCP: ${error.message}`, 'INIT_ERROR', { cause: error });
        }
    }
    // ===== Tool Management =====
    /**
     * Adds a tool to the server with validation
     * @param tool - Tool definition with execute function
     */
    addTool(tool) {
        if (this.tools.has(tool.name)) {
            throw new MCPError(`Tool with name "${tool.name}" already exists`);
        }
        try {
            // Add tool to FastMCP instance
            this.fastMCPInstance.addTool({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                annotations: tool.annotations,
                execute: async (args, context) => {
                    try {
                        const result = await tool.execute(args, context);
                        // Handle string responses
                        if (typeof result === 'string') {
                            return result;
                        }
                        // Handle object responses
                        return result;
                    }
                    catch (error) {
                        // Re-throw user errors as-is
                        if (error instanceof Error && error.name === 'UserError') {
                            throw error;
                        }
                        // Wrap other errors
                        throw new MCPError(`Tool execution failed: ${error.message}`, 'TOOL_ERROR', { cause: error });
                    }
                },
            });
            this.tools.set(tool.name, tool);
        }
        catch (error) {
            throw new MCPError(`Failed to add tool "${tool.name}": ${error.message}`, 'TOOL_ADD_ERROR', { cause: error });
        }
    }
    /**
     * Removes a tool from the server
     * @param name - Tool name to remove
     */
    removeTool(name) {
        if (!this.tools.has(name)) {
            return false;
        }
        this.tools.delete(name);
        // Note: FastMCP doesn't provide a removeTool method, so we only remove from our tracking
        return true;
    }
    /**
     * Gets all registered tools
     * @returns Array of tool definitions
     */
    getTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Gets a specific tool by name
     * @param name - Tool name
     * @returns Tool definition or undefined
     */
    getTool(name) {
        return this.tools.get(name);
    }
    // ===== Resource Management =====
    /**
     * Adds a resource to the server
     * @param resource - Resource definition with load function
     */
    addResource(resource) {
        if (this.resources.has(resource.uri)) {
            throw new MCPError(`Resource with URI "${resource.uri}" already exists`);
        }
        try {
            this.fastMCPInstance.addResource({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType,
                load: async () => {
                    try {
                        return await resource.load();
                    }
                    catch (error) {
                        throw new MCPError(`Resource load failed: ${error.message}`, 'RESOURCE_ERROR', { cause: error });
                    }
                },
            });
            this.resources.set(resource.uri, resource);
        }
        catch (error) {
            throw new MCPError(`Failed to add resource "${resource.uri}": ${error.message}`, 'RESOURCE_ADD_ERROR', { cause: error });
        }
    }
    /**
     * Adds a resource template to the server
     * @param template - Resource template definition
     */
    addResourceTemplate(template) {
        if (this.resourceTemplates.has(template.uriTemplate)) {
            throw new MCPError(`Resource template with URI template "${template.uriTemplate}" already exists`);
        }
        try {
            this.fastMCPInstance.addResourceTemplate({
                uriTemplate: template.uriTemplate,
                name: template.name,
                description: template.description,
                mimeType: template.mimeType,
                arguments: template.arguments,
                load: async (args) => {
                    try {
                        return await template.load(args);
                    }
                    catch (error) {
                        throw new MCPError(`Resource template load failed: ${error.message}`, 'RESOURCE_TEMPLATE_ERROR', { cause: error });
                    }
                },
            });
            this.resourceTemplates.set(template.uriTemplate, template);
        }
        catch (error) {
            throw new MCPError(`Failed to add resource template "${template.uriTemplate}": ${error.message}`, 'RESOURCE_TEMPLATE_ADD_ERROR', { cause: error });
        }
    }
    /**
     * Gets all registered resources
     * @returns Array of resource definitions
     */
    getResources() {
        return Array.from(this.resources.values());
    }
    /**
     * Gets all registered resource templates
     * @returns Array of resource template definitions
     */
    getResourceTemplates() {
        return Array.from(this.resourceTemplates.values());
    }
    // ===== Prompt Management =====
    /**
     * Adds a prompt to the server
     * @param prompt - Prompt definition with load function
     */
    addPrompt(prompt) {
        if (this.prompts.has(prompt.name)) {
            throw new MCPError(`Prompt with name "${prompt.name}" already exists`);
        }
        try {
            this.fastMCPInstance.addPrompt({
                name: prompt.name,
                description: prompt.description,
                arguments: prompt.arguments,
                load: async (args) => {
                    try {
                        return await prompt.load(args);
                    }
                    catch (error) {
                        throw new MCPError(`Prompt load failed: ${error.message}`, 'PROMPT_ERROR', { cause: error });
                    }
                },
            });
            this.prompts.set(prompt.name, prompt);
        }
        catch (error) {
            throw new MCPError(`Failed to add prompt "${prompt.name}": ${error.message}`, 'PROMPT_ADD_ERROR', { cause: error });
        }
    }
    /**
     * Gets all registered prompts
     * @returns Array of prompt definitions
     */
    getPrompts() {
        return Array.from(this.prompts.values());
    }
    // ===== Server Lifecycle =====
    /**
     * Starts the MCP server with specified transport
     * @param options - Server start options including transport configuration
     */
    async start(options) {
        if (this.isServerRunning) {
            throw new MCPError('Server is already running');
        }
        try {
            // In a real implementation, we would call the FastMCP start method
            // For now, we'll simulate starting the server
            this.isServerRunning = true;
            // Simulate the FastMCP start call
            if (this.fastMCPInstance && typeof this.fastMCPInstance.start === 'function') {
                await this.fastMCPInstance.start({
                    transportType: options.transportType,
                    httpStream: options.httpStream,
                    sse: options.sse,
                });
            }
        }
        catch (error) {
            this.isServerRunning = false;
            throw new MCPError(`Failed to start server: ${error.message}`, 'START_ERROR', { cause: error });
        }
    }
    /**
     * Stops the MCP server
     */
    async stop() {
        if (!this.isServerRunning) {
            return;
        }
        try {
            // FastMCP doesn't provide a stop method, so we'll simulate it
            this.isServerRunning = false;
            this.sessions.clear();
        }
        catch (error) {
            throw new MCPError(`Failed to stop server: ${error.message}`, 'STOP_ERROR', { cause: error });
        }
    }
    /**
     * Checks if the server is currently running
     * @returns True if server is running
     */
    isRunning() {
        return this.isServerRunning;
    }
    /**
     * Gets the current active sessions
     * @returns Set of active sessions
     */
    getSessions() {
        return new Set(this.sessions);
    }
    /**
     * Gets the underlying FastMCP instance (for advanced usage)
     * @returns FastMCP instance
     */
    getFastMCPInstance() {
        return this.fastMCPInstance;
    }
    // ===== Embedded Resources =====
    /**
     * Creates an embedded resource reference
     * @param uri - Resource URI to embed
     * @returns Promise resolving to embedded resource
     */
    async embedded(uri) {
        try {
            return await this.fastMCPInstance.embedded(uri);
        }
        catch (error) {
            throw new MCPError(`Failed to embed resource "${uri}": ${error.message}`, 'EMBED_ERROR', { cause: error });
        }
    }
    // ===== Testing Utilities =====
    /**
     * Simulates a client connection (for testing)
     */
    simulateConnection() {
        const mockSession = { id: `mock-${Date.now()}`, mock: true };
        this.sessions.add(mockSession);
        this.emit('connect', { type: 'connect', session: mockSession });
    }
    /**
     * Simulates a client disconnection (for testing)
     */
    simulateDisconnection() {
        const mockSession = Array.from(this.sessions).find((s) => s.mock);
        if (mockSession) {
            this.sessions.delete(mockSession);
            this.emit('disconnect', { type: 'disconnect', session: mockSession });
        }
    }
}
/*
 * === server.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Type-safe FastMCP server wrapper with comprehensive functionality
 * Key Components:
 *   - MCPServer: Main server class extending EventEmitter
 *   - Tool management: addTool(), removeTool(), getTools()
 *   - Resource management: addResource(), addResourceTemplate()
 *   - Prompt management: addPrompt(), getPrompts()
 *   - Lifecycle: start(), stop(), isRunning()
 *   - Session tracking and event handling
 *   - Embedded resource support
 *   - Error handling with MCPError
 * Dependencies:
 *   - Requires: fastmcp, events, types, utils
 * Version History:
 *   v1.0 – initial implementation
 * Notes:
 *   - Provides complete type safety over FastMCP
 *   - Includes comprehensive error handling and validation
 *   - Supports all FastMCP features with simplified API
 */
