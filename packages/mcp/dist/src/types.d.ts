import { z } from 'zod';
/**
 * OVERVIEW
 *
 * This module defines comprehensive TypeScript interfaces for the FastMCP wrapper.
 * It provides type safety for server configuration, client setup, tools, resources,
 * prompts, and transport options. The types are designed to match FastMCP's API
 * while providing better developer experience through strict typing.
 *
 * Key type categories:
 * - Server and client configuration
 * - Tool, resource, and prompt definitions
 * - Transport and connection options
 * - Content and media types
 * - Authentication and session management
 */
export interface MCPServerConfig {
    name: string;
    version: string;
    description?: string;
    instructions?: string;
    authenticate?: (request: any) => any;
    ping?: {
        enabled?: boolean;
        intervalMs?: number;
        logLevel?: 'debug' | 'info' | 'warn' | 'error';
    };
    roots?: {
        enabled?: boolean;
    };
    health?: {
        enabled?: boolean;
        message?: string;
        path?: string;
        status?: number;
    };
    oauth?: {
        enabled?: boolean;
        authorizationServer?: {
            issuer: string;
            authorizationEndpoint: string;
            tokenEndpoint: string;
            jwksUri: string;
            responseTypesSupported: string[];
        };
        protectedResource?: {
            resource: string;
            authorizationServers: string[];
        };
    };
}
export interface MCPClientConfig {
    name: string;
    version: string;
    capabilities?: {
        sampling?: boolean;
        roots?: boolean;
        [key: string]: any;
    };
}
export interface MCPTool<T = any> {
    name: string;
    description: string;
    parameters?: z.ZodSchema<T>;
    annotations?: {
        title?: string;
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
        streamingHint?: boolean;
    };
    execute: (args: T, context?: MCPToolContext) => Promise<string | MCPToolResponse>;
}
export interface MCPToolContext {
    session?: any;
    log?: {
        debug: (message: string, data?: any) => void;
        info: (message: string, data?: any) => void;
        warn: (message: string, data?: any) => void;
        error: (message: string, data?: any) => void;
    };
    reportProgress?: (progress: {
        progress: number;
        total: number;
    }) => Promise<void>;
    streamContent?: (content: MCPContent) => Promise<void>;
}
export interface MCPToolResponse {
    content: MCPContent[];
    isError?: boolean;
}
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    load: () => Promise<MCPResourceContent | MCPResourceContent[]>;
}
export interface MCPResourceTemplate {
    uriTemplate: string;
    name: string;
    description?: string;
    mimeType?: string;
    arguments: MCPResourceArgument[];
    load: (args: Record<string, any>) => Promise<MCPResourceContent | MCPResourceContent[]>;
}
export interface MCPResourceArgument {
    name: string;
    description?: string;
    required?: boolean;
    enum?: string[];
    complete?: (value: string) => Promise<{
        values: string[];
    }>;
}
export interface MCPResourceContent {
    text?: string;
    blob?: string;
}
export interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: MCPPromptArgument[];
    load: (args: Record<string, any>) => Promise<string>;
}
export interface MCPPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
    enum?: string[];
    complete?: (value: string) => Promise<{
        values: string[];
    }>;
}
export interface MCPContent {
    type: 'text' | 'image' | 'audio' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: any;
}
export interface ImageContentOptions {
    url?: string;
    path?: string;
    buffer?: Buffer;
    mimeType?: string;
}
export interface AudioContentOptions {
    url?: string;
    path?: string;
    buffer?: Buffer;
    mimeType?: string;
}
export type TransportType = 'stdio' | 'sse' | 'httpStream';
export interface StdioTransportConfig {
    type: 'stdio';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface SSETransportConfig {
    type: 'sse';
    url: string;
    headers?: Record<string, string>;
}
export interface HttpStreamTransportConfig {
    type: 'httpStream';
    url: string;
    headers?: Record<string, string>;
}
export type TransportConfig = StdioTransportConfig | SSETransportConfig | HttpStreamTransportConfig;
export interface ServerStartOptions {
    transportType: TransportType;
    httpStream?: {
        port: number;
        endpoint?: string;
    };
    sse?: {
        port: number;
        endpoint?: string;
    };
}
export interface ToolCallRequest {
    name: string;
    arguments: Record<string, any>;
}
export interface ToolCallResponse {
    content: MCPContent[];
    isError?: boolean;
}
export interface ResourceReadRequest {
    uri: string;
}
export interface ResourceReadResponse {
    contents: MCPContent[];
}
export interface PromptGetRequest {
    name: string;
    arguments?: Record<string, any>;
}
export interface PromptGetResponse {
    messages: Array<{
        role: string;
        content: MCPContent;
    }>;
}
export interface MCPServerEvent {
    type: 'connect' | 'disconnect';
    session: any;
}
export interface MCPSessionEvent {
    type: 'rootsChanged' | 'error';
    session?: any;
    roots?: any[];
    error?: Error;
}
export declare class MCPError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined, options?: ErrorOptions);
}
export declare class UserError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
export interface MimeTypeMap {
    [extension: string]: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}
