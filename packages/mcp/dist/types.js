// === types.ts ===
// Created: 2025-07-24 12:00
// Purpose: Type definitions for MCP server and client functionality
// Exports: All interfaces and types for FastMCP wrapper
// ===== Error Types =====
export class MCPError extends Error {
    code;
    constructor(message, code, options) {
        super(message, options);
        this.code = code;
        this.name = 'MCPError';
    }
}
export class UserError extends Error {
    constructor(message, options) {
        super(message, options);
        this.name = 'UserError';
    }
}
/*
 * === types.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Comprehensive type definitions for MCP package
 * Key Components:
 *   - MCPServerConfig: Server configuration with authentication and health checks
 *   - MCPClientConfig: Client setup with capabilities
 *   - MCPTool: Tool definitions with Zod validation
 *   - MCPResource/MCPResourceTemplate: Resource management
 *   - MCPPrompt: Prompt templates with arguments
 *   - Transport types: stdio, SSE, HTTP streaming configurations
 *   - Content types: text, image, audio, resource content
 *   - Error classes: MCPError, UserError for proper error handling
 * Dependencies:
 *   - Requires: zod for schema validation
 * Version History:
 *   v1.0 – initial type definitions
 * Notes:
 *   - Provides complete type safety for FastMCP wrapper
 *   - Supports all FastMCP features with additional type constraints
 */
