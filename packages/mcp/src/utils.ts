// === utils.ts ===
// Created: 2025-07-24 12:00
// Purpose: Utility functions for FastMCP integration
// Exports: Content helpers, error handling, type guards, transport utilities

import { promises as fs } from 'fs';
import { extname } from 'path';
import {
  MCPContent,
  ImageContentOptions,
  AudioContentOptions,
  TransportConfig,
  MCPServerConfig,
  MimeTypeMap,
  ValidationResult,
  UserError,
} from './types';

/**
 * OVERVIEW
 *
 * This module provides essential utility functions for the MCP package:
 * - Content creation helpers for images and audio
 * - MIME type detection and validation
 * - Error handling utilities
 * - Type guards for configuration validation
 * - Transport factory functions
 * 
 * All functions are designed to be pure and testable, with comprehensive
 * error handling and type safety. The utilities support both URL-based
 * and file-based content loading with automatic MIME type detection.
 */

// ===== MIME Type Mappings =====

const IMAGE_MIME_TYPES: MimeTypeMap = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

const AUDIO_MIME_TYPES: MimeTypeMap = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.wma': 'audio/x-ms-wma',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
};

const ALL_MIME_TYPES: MimeTypeMap = {
  ...IMAGE_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
};

// ===== Content Helper Functions =====

/**
 * Creates image content from URL, file path, or buffer
 * @param options - Image source options
 * @returns Promise resolving to image content
 */
export async function imageContent(options: ImageContentOptions): Promise<MCPContent> {
  const sourceCount = [options.url, options.path, options.buffer].filter(Boolean).length;
  
  if (sourceCount === 0) {
    throw new Error('Must provide one of: url, path, or buffer');
  }
  
  if (sourceCount > 1) {
    throw new Error('Must provide only one of: url, path, or buffer');
  }

  let data: string;
  let mimeType: string;

  if (options.url) {
    const response = await fetch(options.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    data = Buffer.from(buffer).toString('base64');
    mimeType = response.headers.get('content-type') || getMimeTypeFromPath(options.url);
  } else if (options.path) {
    try {
      const buffer = await fs.readFile(options.path);
      data = buffer.toString('base64');
      mimeType = getMimeTypeFromPath(options.path);
    } catch (error) {
      throw new Error(`Failed to read image file: ${(error as Error).message}`);
    }
  } else if (options.buffer) {
    data = options.buffer.toString('base64');
    mimeType = options.mimeType || 'application/octet-stream';
  } else {
    throw new Error('Invalid image content options');
  }

  return {
    type: 'image',
    data,
    mimeType,
  };
}

/**
 * Creates audio content from URL, file path, or buffer
 * @param options - Audio source options
 * @returns Promise resolving to audio content
 */
export async function audioContent(options: AudioContentOptions): Promise<MCPContent> {
  const sourceCount = [options.url, options.path, options.buffer].filter(Boolean).length;
  
  if (sourceCount === 0) {
    throw new Error('Must provide one of: url, path, or buffer');
  }
  
  if (sourceCount > 1) {
    throw new Error('Must provide only one of: url, path, or buffer');
  }

  let data: string;
  let mimeType: string;

  if (options.url) {
    const response = await fetch(options.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    data = Buffer.from(buffer).toString('base64');
    mimeType = response.headers.get('content-type') || getMimeTypeFromPath(options.url);
  } else if (options.path) {
    try {
      const buffer = await fs.readFile(options.path);
      data = buffer.toString('base64');
      mimeType = getMimeTypeFromPath(options.path);
    } catch (error) {
      throw new Error(`Failed to read audio file: ${(error as Error).message}`);
    }
  } else if (options.buffer) {
    data = options.buffer.toString('base64');
    mimeType = options.mimeType || 'application/octet-stream';
  } else {
    throw new Error('Invalid audio content options');
  }

  return {
    type: 'audio',
    data,
    mimeType,
  };
}

// ===== MIME Type Detection =====

/**
 * Determines MIME type from file path extension
 * @param filePath - File path or URL
 * @returns MIME type string
 */
export function getMimeTypeFromPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return ALL_MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Checks if a file extension represents an image
 * @param filePath - File path or URL
 * @returns True if image extension
 */
export function isImageFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext in IMAGE_MIME_TYPES;
}

/**
 * Checks if a file extension represents audio
 * @param filePath - File path or URL
 * @returns True if audio extension
 */
export function isAudioFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ext in AUDIO_MIME_TYPES;
}

// ===== Error Handling =====

/**
 * User-facing error class for MCP operations
 */
export { UserError };

/**
 * Creates a user error with optional cause
 * @param message - User-friendly error message
 * @param cause - Optional underlying error
 * @returns UserError instance
 */
export function createUserError(message: string, cause?: Error): UserError {
  return new UserError(message, { cause });
}

// ===== Type Guards and Validation =====

/**
 * Validates MCP server configuration
 * @param config - Configuration object to validate
 * @returns True if valid configuration
 */
export function isValidMCPConfig(config: any): config is MCPServerConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  if (typeof config.name !== 'string' || config.name.trim() === '') {
    return false;
  }

  if (typeof config.version !== 'string' || config.version.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Validates transport configuration
 * @param config - Transport configuration to validate
 * @returns Validation result with errors
 */
export function validateTransportConfig(config: TransportConfig): ValidationResult {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Transport config must be an object'] };
  }

  if (!config.type || !['stdio', 'sse', 'httpStream'].includes(config.type)) {
    errors.push('Transport type must be one of: stdio, sse, httpStream');
  }

  switch (config.type) {
    case 'sse':
    case 'httpStream':
      if (!config.url || typeof config.url !== 'string') {
        errors.push(`${config.type} transport requires a valid URL`);
      }
      break;
    case 'stdio':
      // stdio doesn't require additional validation
      break;
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ===== Transport Factory Functions =====

/**
 * Creates transport configuration with validation
 * @param config - Transport configuration
 * @returns Validated transport configuration
 */
export function createTransport(config: TransportConfig): TransportConfig {
  const validation = validateTransportConfig(config);
  
  if (!validation.isValid) {
    throw new Error(`Invalid transport configuration: ${validation.errors?.join(', ')}`);
  }

  switch (config.type) {
    case 'stdio':
      return {
        type: 'stdio',
        command: config.command || 'node',
        args: config.args || [],
        env: config.env || {},
      };
    case 'sse':
      return {
        type: 'sse',
        url: config.url,
        headers: config.headers || {},
      };
    case 'httpStream':
      return {
        type: 'httpStream',
        url: config.url,
        headers: config.headers || {},
      };
    default:
      throw new Error(`Unsupported transport type: ${(config as any).type}`);
  }
}

// ===== Content Validation =====

/**
 * Validates content object structure
 * @param content - Content to validate
 * @returns True if valid content
 */
export function isValidContent(content: any): content is MCPContent {
  if (!content || typeof content !== 'object') {
    return false;
  }

  const validTypes = ['text', 'image', 'audio', 'resource'];
  if (!validTypes.includes(content.type)) {
    return false;
  }

  switch (content.type) {
    case 'text':
      return typeof content.text === 'string';
    case 'image':
    case 'audio':
      return typeof content.data === 'string' && typeof content.mimeType === 'string';
    case 'resource':
      return content.resource !== undefined;
    default:
      return false;
  }
}

// ===== Utility Functions =====

/**
 * Safely converts any value to string
 * @param value - Value to convert
 * @returns String representation
 */
export function safeStringify(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Creates a deep clone of an object
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/*
 * === utils.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Comprehensive utility functions for MCP package
 * Key Components:
 *   - imageContent(): Creates image content from URL/path/buffer
 *   - audioContent(): Creates audio content from URL/path/buffer
 *   - getMimeTypeFromPath(): MIME type detection from file extensions
 *   - isValidMCPConfig(): Server configuration validation
 *   - createTransport(): Transport factory with validation
 *   - UserError: User-facing error class
 *   - Type guards and validation helpers
 * Dependencies:
 *   - Requires: fs/promises, path, types module
 * Version History:
 *   v1.0 – initial implementation
 * Notes:
 *   - All functions include comprehensive error handling
 *   - Supports both synchronous and asynchronous operations
 *   - MIME type detection covers common image and audio formats
 */
