// === index.ts ===
// Created: 2025-07-24 12:00
// Purpose: Main export file for @ennube-ai/mcp package
// Exports: All public APIs for MCP server and client functionality

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

// ===== Core Classes =====
export { MCPServer } from './server';
export { MCPClient } from './client';

// ===== Type Definitions =====
export type {
  // Server Configuration
  MCPServerConfig,
  
  // Client Configuration
  MCPClientConfig,
  
  // Tool Types
  MCPTool,
  MCPToolContext,
  MCPToolResponse,
  
  // Resource Types
  MCPResource,
  MCPResourceTemplate,
  MCPResourceArgument,
  MCPResourceContent,
  
  // Prompt Types
  MCPPrompt,
  MCPPromptArgument,
  
  // Content Types
  MCPContent,
  ImageContentOptions,
  AudioContentOptions,
  
  // Transport Types
  TransportType,
  TransportConfig,
  StdioTransportConfig,
  SSETransportConfig,
  HttpStreamTransportConfig,
  ServerStartOptions,
  
  // Client Operation Types
  ToolCallRequest,
  ToolCallResponse,
  ResourceReadRequest,
  ResourceReadResponse,
  PromptGetRequest,
  PromptGetResponse,
  
  // Event Types
  MCPServerEvent,
  MCPSessionEvent,
  
  // Utility Types
  MimeTypeMap,
  ValidationResult,
} from './types';

// ===== Utility Functions =====
export {
  // Content Creation
  imageContent,
  audioContent,
  
  // MIME Type Detection
  getMimeTypeFromPath,
  isImageFile,
  isAudioFile,
  
  // Validation and Type Guards
  isValidMCPConfig,
  validateTransportConfig,
  isValidContent,
  
  // Transport Factory
  createTransport,
  
  // Error Utilities
  createUserError,
  
  // General Utilities
  safeStringify,
  deepClone,
} from './utils';

// ===== Error Classes =====
export { MCPError, UserError } from './types';

// ===== Re-exports from FastMCP =====
// Re-export commonly used FastMCP utilities for convenience
export { imageContent as fastmcpImageContent, audioContent as fastmcpAudioContent } from 'fastmcp';

// ===== Package Metadata =====
export const PACKAGE_VERSION = '1.0.0';
export const PACKAGE_NAME = '@ennube-ai/mcp';

/**
 * Package information and feature summary
 */
export const PACKAGE_INFO = {
  name: PACKAGE_NAME,
  version: PACKAGE_VERSION,
  description: 'Type-safe FastMCP wrapper for ennube-ai',
  features: [
    'Type-safe MCP server and client implementations',
    'Multiple transport support (stdio, SSE, HTTP streaming)',
    'Tool, resource, and prompt management',
    'Content helpers for images and audio',
    'Comprehensive error handling',
    'Event-driven architecture',
    'Authentication support',
    'Zod schema validation',
  ],
  dependencies: {
    fastmcp: '^0.1.0',
    '@modelcontextprotocol/sdk': '^1.15.1',
    zod: '^3.25.67',
  },
} as const;

/*
 * === index.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Main package entry point with comprehensive exports
 * Key Components:
 *   - MCPServer, MCPClient: Core classes
 *   - Complete type definitions export
 *   - Utility functions for content and validation
 *   - Error classes for proper error handling
 *   - Package metadata and information
 *   - FastMCP re-exports for convenience
 * Dependencies:
 *   - Requires: server, client, types, utils modules
 * Version History:
 *   v1.0 – initial package exports
 * Notes:
 *   - Provides clean, organized API surface
 *   - All exports are properly typed
 *   - Includes package metadata for introspection
 */
