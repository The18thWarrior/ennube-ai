// === server.test.ts ===
// Created: 2025-07-24 12:00
// Purpose: Test FastMCP server wrapper functionality
// Covers: Server creation, tool/resource/prompt management, transport options
import { MCPServer } from '../src/server';
import { z } from 'zod';
describe('MCPServer', () => {
    describe('Server Creation', () => {
        test('should_create_fastmcp_server_with_default_options', () => {
            const config = {
                name: 'Test Server',
                version: '1.0.0',
            };
            const server = new MCPServer(config);
            expect(server).toBeDefined();
            expect(server.config.name).toBe('Test Server');
            expect(server.config.version).toBe('1.0.0');
        });
        test('should_throw_error_on_invalid_server_config', () => {
            expect(() => {
                new MCPServer({});
            }).toThrow('Server name is required');
            expect(() => {
                new MCPServer({ name: '', version: '1.0.0' });
            }).toThrow('Server name is required');
        });
    });
    describe('Tool Management', () => {
        let server;
        beforeEach(() => {
            server = new MCPServer({
                name: 'Test Server',
                version: '1.0.0',
            });
        });
        test('should_add_tool_with_parameters_validation', () => {
            const tool = {
                name: 'add_numbers',
                description: 'Add two numbers together',
                parameters: z.object({
                    a: z.number(),
                    b: z.number(),
                }),
                execute: async (args) => {
                    return String(args.a + args.b);
                },
            };
            server.addTool(tool);
            expect(server.getTools()).toHaveLength(1);
            expect(server.getTools()[0].name).toBe('add_numbers');
        });
        test('should_add_tool_without_parameters', () => {
            const tool = {
                name: 'say_hello',
                description: 'Say hello',
                execute: async () => {
                    return 'Hello, world!';
                },
            };
            server.addTool(tool);
            expect(server.getTools()).toHaveLength(1);
            expect(server.getTools()[0].name).toBe('say_hello');
        });
        test('should_prevent_duplicate_tool_names', () => {
            const tool1 = {
                name: 'duplicate',
                description: 'First tool',
                execute: async () => 'first',
            };
            const tool2 = {
                name: 'duplicate',
                description: 'Second tool',
                execute: async () => 'second',
            };
            server.addTool(tool1);
            expect(() => {
                server.addTool(tool2);
            }).toThrow('Tool with name "duplicate" already exists');
        });
    });
    describe('Resource Management', () => {
        let server;
        beforeEach(() => {
            server = new MCPServer({
                name: 'Test Server',
                version: '1.0.0',
            });
        });
        test('should_add_resource_with_load_function', () => {
            const resource = {
                uri: 'file:///test.txt',
                name: 'Test File',
                mimeType: 'text/plain',
                load: async () => ({
                    text: 'Test content',
                }),
            };
            server.addResource(resource);
            expect(server.getResources()).toHaveLength(1);
            expect(server.getResources()[0].uri).toBe('file:///test.txt');
        });
        test('should_add_resource_template_with_arguments', () => {
            const resourceTemplate = {
                uriTemplate: 'file:///logs/{name}.log',
                name: 'Log Files',
                mimeType: 'text/plain',
                arguments: [
                    {
                        name: 'name',
                        description: 'Log file name',
                        required: true,
                    },
                ],
                load: async (args) => ({
                    text: `Log content for ${args.name}`,
                }),
            };
            server.addResourceTemplate(resourceTemplate);
            expect(server.getResourceTemplates()).toHaveLength(1);
            expect(server.getResourceTemplates()[0].uriTemplate).toBe('file:///logs/{name}.log');
        });
    });
    describe('Prompt Management', () => {
        let server;
        beforeEach(() => {
            server = new MCPServer({
                name: 'Test Server',
                version: '1.0.0',
            });
        });
        test('should_add_prompt_with_arguments', () => {
            const prompt = {
                name: 'git_commit',
                description: 'Generate a Git commit message',
                arguments: [
                    {
                        name: 'changes',
                        description: 'Git diff or description of changes',
                        required: true,
                    },
                ],
                load: async (args) => {
                    return `Generate a commit message for: ${args.changes}`;
                },
            };
            server.addPrompt(prompt);
            expect(server.getPrompts()).toHaveLength(1);
            expect(server.getPrompts()[0].name).toBe('git_commit');
        });
    });
    describe('Server Lifecycle', () => {
        let server;
        beforeEach(() => {
            server = new MCPServer({
                name: 'Test Server',
                version: '1.0.0',
            });
        });
        test('should_start_server_with_stdio_transport', async () => {
            const startPromise = server.start({
                transportType: 'stdio',
            });
            expect(server.isRunning()).toBe(true);
            // Clean up
            await server.stop();
        });
        test('should_start_server_with_http_stream_transport', async () => {
            const startPromise = server.start({
                transportType: 'httpStream',
                httpStream: {
                    port: 8080,
                },
            });
            expect(server.isRunning()).toBe(true);
            // Clean up
            await server.stop();
        });
        test('should_handle_authentication_function', () => {
            const authServer = new MCPServer({
                name: 'Auth Server',
                version: '1.0.0',
                authenticate: (request) => {
                    const apiKey = request.headers['x-api-key'];
                    if (apiKey !== 'valid-key') {
                        throw new Response(null, {
                            status: 401,
                            statusText: 'Unauthorized',
                        });
                    }
                    return { userId: 'test-user' };
                },
            });
            expect(authServer.config.authenticate).toBeDefined();
        });
    });
    describe('Event Handling', () => {
        let server;
        beforeEach(() => {
            server = new MCPServer({
                name: 'Test Server',
                version: '1.0.0',
            });
        });
        test('should_emit_connect_event_on_client_connection', (done) => {
            server.on('connect', (event) => {
                expect(event.session).toBeDefined();
                done();
            });
            // Simulate client connection
            server.simulateConnection();
        });
        test('should_emit_disconnect_event_on_client_disconnection', (done) => {
            server.on('disconnect', (event) => {
                expect(event.session).toBeDefined();
                done();
            });
            // First simulate connection, then disconnection
            server.simulateConnection();
            setTimeout(() => {
                server.simulateDisconnection();
            }, 10);
        });
    });
});
/*
 * === server.test.ts ===
 * Updated: 2025-07-24 12:00
 * Summary: Comprehensive test suite for MCPServer wrapper
 * Key Components:
 *   - Server configuration validation
 *   - Tool management with schema validation
 *   - Resource and resource template handling
 *   - Prompt management
 *   - Transport lifecycle management
 *   - Authentication handling
 *   - Event system testing
 * Dependencies:
 *   - Requires: MCPServer, types, zod
 * Version History:
 *   v1.0 – initial test suite
 * Notes:
 *   - Tests are designed to fail until implementation is complete
 */
