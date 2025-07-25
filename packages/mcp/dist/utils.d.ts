import { MCPContent, ImageContentOptions, AudioContentOptions, TransportConfig, MCPServerConfig, ValidationResult, UserError } from './types';
/**
 * Creates image content from URL, file path, or buffer
 * @param options - Image source options
 * @returns Promise resolving to image content
 */
export declare function imageContent(options: ImageContentOptions): Promise<MCPContent>;
/**
 * Creates audio content from URL, file path, or buffer
 * @param options - Audio source options
 * @returns Promise resolving to audio content
 */
export declare function audioContent(options: AudioContentOptions): Promise<MCPContent>;
/**
 * Determines MIME type from file path extension
 * @param filePath - File path or URL
 * @returns MIME type string
 */
export declare function getMimeTypeFromPath(filePath: string): string;
/**
 * Checks if a file extension represents an image
 * @param filePath - File path or URL
 * @returns True if image extension
 */
export declare function isImageFile(filePath: string): boolean;
/**
 * Checks if a file extension represents audio
 * @param filePath - File path or URL
 * @returns True if audio extension
 */
export declare function isAudioFile(filePath: string): boolean;
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
export declare function createUserError(message: string, cause?: Error): UserError;
/**
 * Validates MCP server configuration
 * @param config - Configuration object to validate
 * @returns True if valid configuration
 */
export declare function isValidMCPConfig(config: any): config is MCPServerConfig;
/**
 * Validates transport configuration
 * @param config - Transport configuration to validate
 * @returns Validation result with errors
 */
export declare function validateTransportConfig(config: TransportConfig): ValidationResult;
/**
 * Creates transport configuration with validation
 * @param config - Transport configuration
 * @returns Validated transport configuration
 */
export declare function createTransport(config: TransportConfig): TransportConfig;
/**
 * Validates content object structure
 * @param content - Content to validate
 * @returns True if valid content
 */
export declare function isValidContent(content: any): content is MCPContent;
/**
 * Safely converts any value to string
 * @param value - Value to convert
 * @returns String representation
 */
export declare function safeStringify(value: any): string;
/**
 * Creates a deep clone of an object
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export declare function deepClone<T>(obj: T): T;
