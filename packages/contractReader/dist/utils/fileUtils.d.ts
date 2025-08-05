/**
 * OVERVIEW
 *
 * File utilities for contract document processing. Provides helper functions
 * for file type detection, validation, and safe handling of uploaded documents.
 *
 * Assumptions:
 * - Primary document types are PDF, DOCX, and TXT
 * - File size limits help prevent processing very large documents
 * - Filename sanitization prevents security issues
 *
 * Edge Cases:
 * - Files without extensions
 * - Corrupted or invalid file formats
 * - Very large documents
 *
 * Future Improvements:
 * - Enhanced MIME type detection
 * - Support for additional document formats
 * - File content validation beyond size
 */
export interface FileInfo {
    mimeType: string;
    extension: string;
    isSupported: boolean;
    estimatedType: 'pdf' | 'docx' | 'txt' | 'unknown';
}
/**
 * Detect file type from buffer content and/or filename
 * @param buffer File content buffer
 * @param fileName Optional filename for extension detection
 * @returns File type information
 */
export declare function detectFileType(buffer: Buffer, fileName?: string): FileInfo;
/**
 * Validate file size against limits
 * @param buffer File content buffer
 * @param maxSizeMB Maximum file size in megabytes (default: 50MB)
 * @returns Validation result
 */
export declare function validateFileSize(buffer: Buffer, maxSizeMB?: number): {
    isValid: boolean;
    sizeMB: number;
    error?: string;
};
/**
 * Sanitize filename for safe processing
 * @param fileName Original filename
 * @returns Sanitized filename
 */
export declare function sanitizeFileName(fileName: string): string;
/**
 * Extract file extension from filename
 * @param fileName Filename with extension
 * @returns File extension (without dot)
 */
export declare function getFileExtension(fileName: string): string;
/**
 * Create a safe filename with timestamp
 * @param originalName Original filename
 * @param prefix Optional prefix
 * @returns Safe filename with timestamp
 */
export declare function createSafeFileName(originalName: string, prefix?: string): string;
/**
 * Convert buffer to base64 string for API transmission
 * @param buffer File content buffer
 * @returns Base64 encoded string
 */
export declare function bufferToBase64(buffer: Buffer): string;
/**
 * Convert base64 string back to buffer
 * @param base64String Base64 encoded string
 * @returns File content buffer
 */
export declare function base64ToBuffer(base64String: string): Buffer;
/**
 * Estimate processing time based on file size and type
 * @param fileInfo File information
 * @param sizeMB File size in megabytes
 * @returns Estimated processing time in seconds
 */
export declare function estimateProcessingTime(fileInfo: FileInfo, sizeMB: number): number;
//# sourceMappingURL=fileUtils.d.ts.map