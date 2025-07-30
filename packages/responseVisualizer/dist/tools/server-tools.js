// === tools/server-tools.ts ===
// Created: 2025-07-19 15:45
// Purpose: Server-side tools for visualization processing
// Exports:
//   - processVisualizationRequest: Process LLM requests server-side
//   - validateAndSanitize: Server-side validation
//   - generateMCPTools: Generate MCP server tools
// Interactions:
//   - Used by: Server applications, MCP servers
// Notes:
//   - Server-side processing with enhanced security
import { validateVisualizationConfig } from '../utils/validation-utils';
import { createVisualizationTool, createLayoutTool, createDataVisualizationTool, createFormTool, createFeedbackTool, getComponentRegistry, LLM_PROMPT_TEMPLATE } from './llm-tools';
/**
 * Process visualization request on server
 */
export async function processVisualizationRequest(request, llmProcessor) {
    try {
        // Validate request
        if (!request.prompt || typeof request.prompt !== 'string') {
            return {
                success: false,
                error: 'Invalid prompt provided'
            };
        }
        // Prepare tools for LLM
        const tools = [
            createVisualizationTool,
            createLayoutTool,
            createDataVisualizationTool,
            createFormTool,
            createFeedbackTool
        ];
        // Enhanced prompt with context
        const enhancedPrompt = `
${LLM_PROMPT_TEMPLATE}

## User Request:
${request.prompt}

## Available Data:
${request.data ? JSON.stringify(request.data, null, 2) : 'No data provided'}

## User Preferences:
${request.preferences ? JSON.stringify(request.preferences, null, 2) : 'No preferences specified'}

## Context:
${request.context ? JSON.stringify(request.context, null, 2) : 'No additional context'}

Please create a visualization configuration that addresses the user's request.
`;
        // Process with LLM if processor provided
        let config;
        if (llmProcessor) {
            const result = await llmProcessor(enhancedPrompt, tools);
            config = result;
        }
        else {
            // Fallback: create a basic configuration
            config = createFallbackConfig(request);
        }
        // Validate and sanitize
        const validation = validateVisualizationConfig(config);
        if (!validation.isValid) {
            return {
                success: false,
                error: `Configuration validation failed: ${validation.errors.join(', ')}`,
                suggestions: [
                    'Check component types are valid',
                    'Ensure all required properties are provided',
                    'Verify data structure matches component requirements'
                ]
            };
        }
        return {
            success: true,
            config: validation.sanitized
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            suggestions: [
                'Try simplifying your request',
                'Check that data is properly formatted',
                'Ensure component types are supported'
            ]
        };
    }
}
/**
 * Create fallback configuration when LLM is not available
 */
function createFallbackConfig(request) {
    const components = [];
    // Add a simple layout based on request
    if (request.data && Array.isArray(Object.values(request.data)[0])) {
        // Data looks like table data
        components.push({
            type: 'DataTable',
            props: {
                data: Object.values(request.data)[0],
                columns: Object.keys(Object.values(request.data)[0][0] || {}).map(key => ({
                    key,
                    header: key.charAt(0).toUpperCase() + key.slice(1),
                    sortable: true
                }))
            }
        });
    }
    else {
        // Add basic content
        components.push({
            type: 'FlexLayout',
            props: { direction: 'col', align: 'center', justify: 'center' },
            children: [
                {
                    type: 'div',
                    children: `Visualization for: ${request.prompt}`,
                    className: 'text-lg font-semibold mb-4'
                },
                {
                    type: 'AlertBanner',
                    props: {
                        type: 'info',
                        message: 'This is a basic fallback visualization. For better results, integrate with an LLM processor.'
                    }
                }
            ]
        });
    }
    return {
        version: '1.0.0',
        metadata: {
            title: 'Generated Visualization',
            description: `Visualization for: ${request.prompt}`,
            created: new Date().toISOString(),
            author: 'Response Visualizer'
        },
        components
    };
}
/**
 * Generate MCP (Model Context Protocol) tools
 */
export function generateMCPTools() {
    return {
        tools: [
            {
                name: 'create_ui_visualization',
                description: 'Create a custom UI visualization from a description',
                inputSchema: {
                    type: 'object',
                    properties: {
                        description: {
                            type: 'string',
                            description: 'Description of the UI to create'
                        },
                        data: {
                            type: 'object',
                            description: 'Optional data to visualize'
                        },
                        theme: {
                            type: 'object',
                            properties: {
                                primary: { type: 'string' },
                                background: { type: 'string', enum: ['default', 'muted', 'card'] }
                            },
                            description: 'Theme configuration'
                        }
                    },
                    required: ['description']
                }
            },
            {
                name: 'get_available_components',
                description: 'Get list of available UI components',
                inputSchema: {
                    type: 'object',
                    properties: {
                        category: {
                            type: 'string',
                            enum: ['layout', 'data', 'form', 'feedback', 'navigation', 'media', 'utility'],
                            description: 'Filter by component category'
                        }
                    }
                }
            },
            {
                name: 'validate_ui_config',
                description: 'Validate a UI configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        config: {
                            type: 'object',
                            description: 'UI configuration to validate'
                        }
                    },
                    required: ['config']
                }
            }
        ]
    };
}
/**
 * MCP tool handlers
 */
export const mcpToolHandlers = {
    create_ui_visualization: async (args) => {
        const request = {
            prompt: args.description,
            data: args.data,
            preferences: { theme: args.theme?.primary }
        };
        return await processVisualizationRequest(request);
    },
    get_available_components: async (args) => {
        const registry = getComponentRegistry();
        if (args.category) {
            return {
                category: args.category,
                components: registry.types[args.category] || [],
                description: registry.descriptions[args.category]
            };
        }
        return registry;
    },
    validate_ui_config: async (args) => {
        const validation = validateVisualizationConfig(args.config);
        return {
            valid: validation.isValid,
            errors: validation.errors,
            sanitized: validation.sanitized
        };
    }
};
/**
 * Express.js middleware for handling visualization requests
 */
export function createVisualizationMiddleware(options = {}) {
    return async (req, res, next) => {
        // Rate limiting
        if (options.rateLimiter && !options.rateLimiter(req)) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }
        // Authentication
        if (options.auth && !options.auth(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Process request
        if (req.method === 'POST' && req.path === '/api/visualization') {
            try {
                const request = req.body;
                const response = await processVisualizationRequest(request, options.llmProcessor);
                res.json(response);
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Internal server error'
                });
            }
        }
        else {
            next();
        }
    };
}
/**
 * OVERVIEW
 *
 * Server-side tools for processing visualization requests and integrating with LLMs.
 * Provides MCP (Model Context Protocol) integration and Express.js middleware.
 * Includes fallback configurations and comprehensive error handling.
 *
 * Features:
 * - Server-side request processing
 * - MCP tool generation and handlers
 * - Express.js middleware
 * - Fallback configurations
 * - Rate limiting and authentication hooks
 *
 * Future Improvements:
 * - Redis caching for configurations
 * - Webhook support for real-time updates
 * - Advanced analytics and logging
 */
/*
 * === tools/server-tools.ts ===
 * Updated: 2025-07-19 15:45
 * Summary: Server-side visualization processing and MCP integration
 * Key Components:
 *   - processVisualizationRequest(): Main server-side processor
 *   - generateMCPTools(): MCP tool definitions
 *   - createVisualizationMiddleware(): Express.js middleware
 * Dependencies:
 *   - Requires: zod, validation utilities, LLM tools
 * Version History:
 *   v1.0 – initial server tools with MCP and middleware support
 * Notes:
 *   - Designed for production server environments
 *   - Includes security and rate limiting considerations
 */
