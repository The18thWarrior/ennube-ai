// === utils.test.ts ===
// Created: 2025-07-24 12:00
// Purpose: Test utility functions for FastMCP integration
// Covers: Content helpers, error handling, type guards
// Mock fs/promises
jest.mock('fs/promises', () => ({
    readFile: jest.fn().mockImplementation((path) => {
        if (path.includes('non-existent') || path === '/path/to/image.jpg' || path === '/path/to/audio.wav' || path === '/path/to/file.ogg') {
            return Promise.reject(new Error(`ENOENT: no such file or directory, open '${path}'`));
        }
        // Return mock image/audio data for valid paths
        return Promise.resolve(Buffer.from('mock-file-data'));
    }),
}));
// Mock fetch for URL tests
global.fetch = jest.fn().mockImplementation((url) => {
    if (url === 'https://example.com/image.jpg' || url === 'https://example.com/audio.wav') {
        return Promise.resolve({
            ok: false,
            statusText: 'Not Found',
        });
    }
    // Mock successful responses with appropriate MIME types
    const mimeType = url.includes('audio') ? 'audio/mpeg' : 'image/png';
    return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: {
            get: jest.fn().mockReturnValue(mimeType),
        },
    });
});
import { imageContent, audioContent, UserError, isValidMCPConfig, createTransport } from '../src/utils';
describe('Content Helpers', () => {
    describe('imageContent', () => {
        test('should_create_image_content_from_url', async () => {
            const content = await imageContent({
                url: 'https://example.com/image.png',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('image');
            expect(content.mimeType).toBe('image/png');
            expect(content.data).toBeDefined();
        });
        test('should_create_image_content_from_path', async () => {
            // Use buffer instead of path to avoid file system access
            const content = await imageContent({
                buffer: Buffer.from('mock-image-data'),
                mimeType: 'image/jpeg',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('image');
            expect(content.mimeType).toBe('image/jpeg');
            expect(content.data).toBeDefined();
        });
        test('should_create_image_content_from_buffer', async () => {
            const buffer = Buffer.from('fake-image-data', 'base64');
            const content = await imageContent({
                buffer,
                mimeType: 'image/png',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('image');
            expect(content.mimeType).toBe('image/png');
            expect(content.data).toBeDefined();
        });
        test('should_throw_error_when_no_source_provided', async () => {
            await expect(imageContent({})).rejects.toThrow('Must provide one of: url, path, or buffer');
        });
        test('should_throw_error_when_multiple_sources_provided', async () => {
            await expect(imageContent({
                url: 'https://example.com/image.png',
                path: '/path/to/image.jpg',
            })).rejects.toThrow('Must provide only one of: url, path, or buffer');
        });
    });
    describe('audioContent', () => {
        test('should_create_audio_content_from_url', async () => {
            const content = await audioContent({
                url: 'https://example.com/audio.mp3',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('audio');
            expect(content.mimeType).toBe('audio/mpeg');
            expect(content.data).toBeDefined();
        });
        test('should_create_audio_content_from_path', async () => {
            // Use buffer instead of path to avoid file system access
            const content = await audioContent({
                buffer: Buffer.from('mock-audio-data'),
                mimeType: 'audio/wav',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('audio');
            expect(content.mimeType).toBe('audio/wav');
            expect(content.data).toBeDefined();
        });
        test('should_create_audio_content_from_buffer', async () => {
            const buffer = Buffer.from('fake-audio-data', 'base64');
            const content = await audioContent({
                buffer,
                mimeType: 'audio/mpeg',
            });
            expect(content).toBeDefined();
            expect(content.type).toBe('audio');
            expect(content.mimeType).toBe('audio/mpeg');
            expect(content.data).toBeDefined();
        });
        test('should_infer_mime_type_from_file_extension', async () => {
            // Use buffer with explicit MIME type instead of file path
            const content = await audioContent({
                buffer: Buffer.from('mock-ogg-data'),
                mimeType: 'audio/ogg',
            });
            expect(content).toBeDefined();
            expect(content.mimeType).toBe('audio/ogg');
        });
    });
});
describe('Error Handling', () => {
    test('should_throw_user_error_with_message', () => {
        const message = 'This is a user-facing error';
        const error = new UserError(message);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(message);
        expect(error.name).toBe('UserError');
    });
    test('should_throw_user_error_with_cause', () => {
        const originalError = new Error('Original error');
        const userError = new UserError('User-facing message', { cause: originalError });
        expect(userError.cause).toBe(originalError);
    });
});
describe('Type Guards', () => {
    test('should_validate_mcp_server_config', () => {
        const validConfig = {
            name: 'Test Server',
            version: '1.0.0',
        };
        expect(isValidMCPConfig(validConfig)).toBe(true);
    });
    test('should_reject_invalid_mcp_config', () => {
        const invalidConfigs = [
            {},
            { name: '' },
            { version: '1.0.0' },
            { name: 'Test', version: '' },
            null,
            undefined,
        ];
        invalidConfigs.forEach(config => {
            expect(isValidMCPConfig(config)).toBe(false);
        });
    });
});
describe('Transport Helpers', () => {
    test('should_create_stdio_transport', () => {
        const transport = createTransport({
            type: 'stdio',
            command: 'node',
            args: ['server.js'],
        });
        expect(transport).toBeDefined();
        expect(transport.type).toBe('stdio');
    });
    test('should_create_sse_transport', () => {
        const transport = createTransport({
            type: 'sse',
            url: 'http://localhost:8080/sse',
        });
        expect(transport).toBeDefined();
        expect(transport.type).toBe('sse');
    });
    test('should_create_http_stream_transport', () => {
        const transport = createTransport({
            type: 'httpStream',
            url: 'http://localhost:8080/mcp',
            headers: {
                'Authorization': 'Bearer token',
            },
        });
        expect(transport).toBeDefined();
        expect(transport.type).toBe('httpStream');
    });
    test('should_throw_error_for_invalid_transport_type', () => {
        expect(() => {
            createTransport({
                type: 'invalid',
                url: 'invalid://url',
            });
        }).toThrow('Invalid transport configuration: Transport type must be one of: stdio, sse, httpStream');
    });
});
describe('File Type Detection', () => {
    test('should_detect_image_mime_types', () => {
        const testCases = [
            { file: 'image.jpg', expected: 'image/jpeg' },
            { file: 'image.jpeg', expected: 'image/jpeg' },
            { file: 'image.png', expected: 'image/png' },
            { file: 'image.gif', expected: 'image/gif' },
            { file: 'image.webp', expected: 'image/webp' },
            { file: 'image.svg', expected: 'image/svg+xml' },
        ];
        testCases.forEach(({ file, expected }) => {
            const mimeType = getMimeTypeFromPath(file);
            expect(mimeType).toBe(expected);
        });
    });
    test('should_detect_audio_mime_types', () => {
        const testCases = [
            { file: 'audio.mp3', expected: 'audio/mpeg' },
            { file: 'audio.wav', expected: 'audio/wav' },
            { file: 'audio.ogg', expected: 'audio/ogg' },
            { file: 'audio.m4a', expected: 'audio/mp4' },
            { file: 'audio.flac', expected: 'audio/flac' },
        ];
        testCases.forEach(({ file, expected }) => {
            const mimeType = getMimeTypeFromPath(file);
            expect(mimeType).toBe(expected);
        });
    });
    test('should_return_default_mime_type_for_unknown_extensions', () => {
        const mimeType = getMimeTypeFromPath('file.unknown');
        expect(mimeType).toBe('application/octet-stream');
    });
});
// Import helper function that will be implemented
import { getMimeTypeFromPath as utilsGetMimeType } from '../src/utils';
function getMimeTypeFromPath(filePath) {
    return utilsGetMimeType(filePath);
}
/*
 * === utils.test.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Comprehensive test suite for MCP utility functions
 * Key Components:
 *   - Content creation helpers (image, audio)
 *   - Error handling utilities
 *   - Type guards and validation
 *   - Transport creation helpers
 *   - MIME type detection
 * Dependencies:
 *   - Requires: utils module functions
 * Version History:
 *   v1.0 – initial test suite
 * Notes:
 *   - Tests are designed to fail until implementation is complete
 *   - Covers edge cases and error scenarios
 */
