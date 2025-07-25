/**
 * OVERVIEW
 *
 * This is the main entry point for the @ennube-ai/mcp package.
 * It provides a clean, organized export structure for all MCP functionality:
 * - Server and client classes for MCP communication
 * - Type definitions for configuration and data structures
 * - Utility functions for content creation and validation
 * - Error classes for proper error handling
 *
 * The package is designed to be a comprehensive, type-safe wrapper
 * around FastMCP that simplifies MCP server and client development
 * within the ennube-ai ecosystem.
 */
export { MCPServer } from './server';
export { MCPClient } from './client';
export type { MCPServerConfig, MCPClientConfig, MCPTool, MCPToolContext, MCPToolResponse, MCPResource, MCPResourceTemplate, MCPResourceArgument, MCPResourceContent, MCPPrompt, MCPPromptArgument, MCPContent, ImageContentOptions, AudioContentOptions, TransportType, TransportConfig, StdioTransportConfig, SSETransportConfig, HttpStreamTransportConfig, ServerStartOptions, ToolCallRequest, ToolCallResponse, ResourceReadRequest, ResourceReadResponse, PromptGetRequest, PromptGetResponse, MCPServerEvent, MCPSessionEvent, MimeTypeMap, ValidationResult, } from './types';
export { imageContent, audioContent, getMimeTypeFromPath, isImageFile, isAudioFile, isValidMCPConfig, validateTransportConfig, isValidContent, createTransport, createUserError, safeStringify, deepClone, } from './utils';
export { MCPError, UserError } from './types';
export { imageContent as fastmcpImageContent, audioContent as fastmcpAudioContent } from 'fastmcp';
export declare const PACKAGE_VERSION = "1.0.0";
export declare const PACKAGE_NAME = "@ennube-ai/mcp";
/**
 * Package information and feature summary
 */
export declare const PACKAGE_INFO: {
    readonly name: "@ennube-ai/mcp";
    readonly version: "1.0.0";
    readonly description: "Type-safe FastMCP wrapper for ennube-ai";
    readonly features: readonly ["Type-safe MCP server and client implementations", "Multiple transport support (stdio, SSE, HTTP streaming)", "Tool, resource, and prompt management", "Content helpers for images and audio", "Comprehensive error handling", "Event-driven architecture", "Authentication support", "Zod schema validation"];
    readonly dependencies: {
        readonly fastmcp: "^0.1.0";
        readonly '@modelcontextprotocol/sdk': "^1.15.1";
        readonly zod: "^3.25.67";
    };
};
