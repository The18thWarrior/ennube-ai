"use strict";
// === utils/fileUtils.ts ===
// Created: 2025-08-02 15:30
// Purpose: File processing utilities for contract documents
// Exports:
//   - detectFileType(): Determine file type from buffer or filename
//   - validateFileSize(): Check file size limits
//   - sanitizeFileName(): Clean filename for safe processing
// Notes:
//   - Supports PDF, DOCX, TXT file types primarily
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFileType = detectFileType;
exports.validateFileSize = validateFileSize;
exports.sanitizeFileName = sanitizeFileName;
exports.getFileExtension = getFileExtension;
exports.createSafeFileName = createSafeFileName;
exports.bufferToBase64 = bufferToBase64;
exports.base64ToBuffer = base64ToBuffer;
exports.estimateProcessingTime = estimateProcessingTime;
const mimeTypes = __importStar(require("mime-types"));
/**
 * Detect file type from buffer content and/or filename
 * @param buffer File content buffer
 * @param fileName Optional filename for extension detection
 * @returns File type information
 */
function detectFileType(buffer, fileName) {
    let mimeType = '';
    let extension = '';
    let estimatedType = 'unknown';
    // Try to detect from file content (magic numbers)
    if (buffer.length >= 4) {
        const header = buffer.subarray(0, 4);
        // PDF magic number: %PDF
        if (header.toString() === '%PDF') {
            mimeType = 'application/pdf';
            extension = 'pdf';
            estimatedType = 'pdf';
        }
        // DOCX magic number: PK (ZIP archive)
        else if (header[0] === 0x50 && header[1] === 0x4B) {
            // Further check for DOCX content
            if (buffer.includes(Buffer.from('[Content_Types].xml'))) {
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                extension = 'docx';
                estimatedType = 'docx';
            }
        }
    }
    // If not detected from content, try filename extension
    if (!mimeType && fileName) {
        const detectedMime = mimeTypes.lookup(fileName);
        if (detectedMime) {
            mimeType = detectedMime;
            extension = mimeTypes.extension(detectedMime) || '';
            switch (extension) {
                case 'pdf':
                    estimatedType = 'pdf';
                    break;
                case 'docx':
                    estimatedType = 'docx';
                    break;
                case 'txt':
                    estimatedType = 'txt';
                    break;
            }
        }
    }
    // Default to text if looks like readable content
    if (!mimeType && isLikelyTextContent(buffer)) {
        mimeType = 'text/plain';
        extension = 'txt';
        estimatedType = 'txt';
    }
    const isSupported = ['pdf', 'docx', 'txt'].includes(estimatedType);
    return {
        mimeType,
        extension,
        isSupported,
        estimatedType,
    };
}
/**
 * Validate file size against limits
 * @param buffer File content buffer
 * @param maxSizeMB Maximum file size in megabytes (default: 50MB)
 * @returns Validation result
 */
function validateFileSize(buffer, maxSizeMB = 50) {
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
        return {
            isValid: false,
            sizeMB,
            error: `File size ${sizeMB.toFixed(2)}MB exceeds maximum limit of ${maxSizeMB}MB`,
        };
    }
    return {
        isValid: true,
        sizeMB,
    };
}
/**
 * Sanitize filename for safe processing
 * @param fileName Original filename
 * @returns Sanitized filename
 */
function sanitizeFileName(fileName) {
    // Remove path separators and dangerous characters
    return fileName
        .replace(/[/\\?%*:|"<>]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 255); // Limit length
}
/**
 * Extract file extension from filename
 * @param fileName Filename with extension
 * @returns File extension (without dot)
 */
function getFileExtension(fileName) {
    const match = fileName.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
}
/**
 * Check if buffer content looks like readable text
 * @param buffer File content buffer
 * @returns True if likely text content
 */
function isLikelyTextContent(buffer) {
    // Check first 1KB for text-like content
    const sample = buffer.subarray(0, Math.min(1024, buffer.length));
    // Count printable ASCII characters
    let printableCount = 0;
    for (let i = 0; i < sample.length; i++) {
        const byte = sample[i];
        if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
            printableCount++;
        }
    }
    // If more than 80% printable characters, likely text
    return (printableCount / sample.length) > 0.8;
}
/**
 * Create a safe filename with timestamp
 * @param originalName Original filename
 * @param prefix Optional prefix
 * @returns Safe filename with timestamp
 */
function createSafeFileName(originalName, prefix) {
    const sanitized = sanitizeFileName(originalName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = getFileExtension(sanitized);
    const baseName = sanitized.replace(`.${extension}`, '');
    const prefixPart = prefix ? `${prefix}_` : '';
    return `${prefixPart}${baseName}_${timestamp}.${extension}`;
}
/**
 * Convert buffer to base64 string for API transmission
 * @param buffer File content buffer
 * @returns Base64 encoded string
 */
function bufferToBase64(buffer) {
    return buffer.toString('base64');
}
/**
 * Convert base64 string back to buffer
 * @param base64String Base64 encoded string
 * @returns File content buffer
 */
function base64ToBuffer(base64String) {
    return Buffer.from(base64String, 'base64');
}
/**
 * Estimate processing time based on file size and type
 * @param fileInfo File information
 * @param sizeMB File size in megabytes
 * @returns Estimated processing time in seconds
 */
function estimateProcessingTime(fileInfo, sizeMB) {
    // Base time estimates per file type
    const baseTimeSeconds = {
        pdf: 10, // OCR processing required
        docx: 3, // Text extraction
        txt: 1, // Direct reading
        unknown: 5,
    };
    // Size multiplier (larger files take longer)
    const sizeMultiplier = Math.max(1, sizeMB / 5);
    return baseTimeSeconds[fileInfo.estimatedType] * sizeMultiplier;
}
/*
 * === utils/fileUtils.ts ===
 * Updated: 2025-08-02 15:30
 * Summary: File processing utilities for document handling
 * Key Components:
 *   - detectFileType(): Magic number and extension-based detection
 *   - validateFileSize(): Size limit enforcement
 *   - sanitizeFileName(): Security-focused filename cleaning
 *   - Base64 conversion utilities
 * Dependencies:
 *   - Requires: mime-types
 * Version History:
 *   v1.0 – initial file utilities
 * Notes:
 *   - Focused on PDF, DOCX, TXT support
 *   - Security considerations for filename handling
 */
//# sourceMappingURL=fileUtils.js.map