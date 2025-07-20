// === tools/llm-tools.ts ===
// Created: 2025-07-19 15:40
// Purpose: LLM tools for generating UI configurations
// Exports:
//   - createVisualizationTool: Tool for LLMs to create visualizations
//   - getComponentRegistry: Get available components
//   - generateConfigSchema: Generate configuration schemas
// Interactions:
//   - Used by: LLM servers, AI SDK integrations
// Notes:
//   - Designed for integration with AI SDK and Model Context Protocol
import { z } from 'zod';
import { ComponentConfigSchema, COMPONENT_TYPES, COMPONENT_CATEGORIES } from '../types';
import { validateVisualizationConfig, createComponentBuilder } from '../utils/validation-utils';
/**
 * Tool definition for creating visualizations
 */
export const createVisualizationTool = {
    name: 'create_visualization',
    description: 'Create a UI visualization configuration for rendering custom interfaces',
    parameters: z.object({
        title: z.string().describe('Title of the visualization'),
        description: z.string().optional().describe('Description of what the visualization shows'),
        components: z.array(ComponentConfigSchema).describe('Array of component configurations to render'),
        theme: z.object({
            primary: z.string().optional().describe('Primary color theme'),
            background: z.enum(['default', 'muted', 'card']).optional().describe('Background variant'),
            radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional().describe('Border radius'),
            shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional().describe('Shadow level')
        }).optional().describe('Theme configuration'),
        animation: z.object({
            type: z.enum(['fade', 'slide', 'bounce', 'pulse', 'spin', 'none']).optional(),
            duration: z.number().optional().describe('Animation duration in milliseconds'),
            delay: z.number().optional().describe('Animation delay in milliseconds')
        }).optional().describe('Global animation settings')
    }).describe('Configuration for creating a UI visualization'),
    execute: async (params) => {
        // Validate the configuration
        const config = {
            version: '1.0.0',
            metadata: {
                title: params.title,
                description: params.description,
                created: new Date().toISOString()
            },
            theme: params.theme,
            animation: params.animation,
            components: params.components
        };
        const validation = validateVisualizationConfig(config);
        if (!validation.isValid) {
            throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }
        return validation.sanitized;
    }
};
/**
 * Tool for creating layout components
 */
export const createLayoutTool = {
    name: 'create_layout',
    description: 'Create layout components for organizing content',
    parameters: z.object({
        type: z.enum(['GridLayout', 'FlexLayout', 'TabLayout']).describe('Layout component type'),
        config: z.object({
            columns: z.union([z.number(), z.enum(['auto', 'fit'])]).optional().describe('Number of columns for grid'),
            direction: z.enum(['row', 'col', 'row-reverse', 'col-reverse']).optional().describe('Flex direction'),
            justify: z.enum(['start', 'end', 'center', 'between', 'around', 'evenly']).optional().describe('Justify content'),
            align: z.enum(['start', 'end', 'center', 'baseline', 'stretch']).optional().describe('Align items'),
            gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional().describe('Gap between items'),
            tabs: z.array(z.object({
                id: z.string(),
                label: z.string(),
                content: z.any()
            })).optional().describe('Tab items for TabLayout')
        }).describe('Layout-specific configuration'),
        children: z.array(ComponentConfigSchema).optional().describe('Child components')
    }),
    execute: async (params) => {
        const builder = createComponentBuilder(params.type);
        return builder
            .withProps(params.config)
            .withChildren(params.children || [])
            .build();
    }
};
/**
 * Tool for creating data visualization components
 */
export const createDataVisualizationTool = {
    name: 'create_data_visualization',
    description: 'Create data visualization components like tables, charts, and metrics',
    parameters: z.object({
        type: z.enum(['DataTable', 'Chart', 'MetricCard', 'Timeline']).describe('Data visualization type'),
        data: z.array(z.any()).describe('Data to visualize'),
        config: z.object({
            columns: z.array(z.object({
                key: z.string(),
                header: z.string(),
                sortable: z.boolean().optional(),
                type: z.enum(['string', 'number', 'date', 'boolean']).optional()
            })).optional().describe('Table columns'),
            chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']).optional().describe('Chart type'),
            searchable: z.boolean().optional().describe('Enable search'),
            pagination: z.boolean().optional().describe('Enable pagination')
        }).optional().describe('Component-specific configuration')
    }),
    execute: async (params) => {
        const builder = createComponentBuilder(params.type);
        const props = {
            data: params.data,
            ...params.config
        };
        return builder.withProps(props).build();
    }
};
/**
 * Tool for creating form components
 */
export const createFormTool = {
    name: 'create_form',
    description: 'Create form components with fields and validation',
    parameters: z.object({
        fields: z.array(z.object({
            name: z.string().describe('Field name'),
            type: z.enum(['text', 'email', 'password', 'number', 'select', 'checkbox', 'radio', 'textarea']).describe('Field type'),
            label: z.string().optional().describe('Field label'),
            placeholder: z.string().optional().describe('Field placeholder'),
            required: z.boolean().optional().describe('Required field'),
            options: z.array(z.object({
                label: z.string(),
                value: z.any()
            })).optional().describe('Options for select/radio fields')
        })).describe('Form fields'),
        submitText: z.string().optional().describe('Submit button text'),
        onSubmit: z.string().optional().describe('Submit handler function name')
    }),
    execute: async (params) => {
        const builder = createComponentBuilder('FormBuilder');
        return builder.withProps({
            fields: params.fields,
            submitText: params.submitText,
            onSubmit: params.onSubmit
        }).build();
    }
};
/**
 * Tool for creating feedback components
 */
export const createFeedbackTool = {
    name: 'create_feedback',
    description: 'Create feedback components like alerts, status indicators, and progress trackers',
    parameters: z.object({
        type: z.enum(['StatusIndicator', 'AlertBanner', 'ProgressTracker']).describe('Feedback component type'),
        config: z.object({
            status: z.enum(['success', 'error', 'warning', 'info']).optional().describe('Status type'),
            message: z.string().optional().describe('Message text'),
            steps: z.array(z.object({
                id: z.string(),
                label: z.string(),
                completed: z.boolean()
            })).optional().describe('Progress steps')
        }).describe('Component configuration')
    }),
    execute: async (params) => {
        const builder = createComponentBuilder(params.type);
        return builder.withProps(params.config).build();
    }
};
/**
 * Get available component registry for LLMs
 */
export function getComponentRegistry() {
    return {
        categories: COMPONENT_CATEGORIES,
        types: COMPONENT_TYPES,
        descriptions: {
            [COMPONENT_CATEGORIES.LAYOUT]: 'Components for organizing and structuring content',
            [COMPONENT_CATEGORIES.DATA]: 'Components for displaying and visualizing data',
            [COMPONENT_CATEGORIES.FORM]: 'Components for user input and forms',
            [COMPONENT_CATEGORIES.FEEDBACK]: 'Components for user feedback and status',
            [COMPONENT_CATEGORIES.NAVIGATION]: 'Components for navigation and wayfinding',
            [COMPONENT_CATEGORIES.MEDIA]: 'Components for media display and interaction',
            [COMPONENT_CATEGORIES.UTILITY]: 'Utility components for common tasks'
        }
    };
}
/**
 * Generate component examples for LLM training
 */
export function generateComponentExamples() {
    return {
        layouts: {
            grid: {
                type: 'GridLayout',
                props: { columns: 3, gap: 'md' },
                children: [
                    { type: 'MetricCard', props: { value: '1,234', label: 'Total Users' } },
                    { type: 'MetricCard', props: { value: '56.7%', label: 'Conversion Rate' } },
                    { type: 'MetricCard', props: { value: '$12,345', label: 'Revenue' } }
                ]
            },
            flex: {
                type: 'FlexLayout',
                props: { direction: 'row', justify: 'between', align: 'center' },
                children: [
                    { type: 'div', children: 'Left Content' },
                    { type: 'div', children: 'Right Content' }
                ]
            },
            tabs: {
                type: 'TabLayout',
                props: {
                    tabs: [
                        { id: 'overview', label: 'Overview', content: 'Overview content' },
                        { id: 'details', label: 'Details', content: 'Details content' }
                    ]
                }
            }
        },
        data: {
            table: {
                type: 'DataTable',
                props: {
                    data: [
                        { id: 1, name: 'John Doe', email: 'john@example.com' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
                    ],
                    columns: [
                        { key: 'name', header: 'Name', sortable: true },
                        { key: 'email', header: 'Email', sortable: true }
                    ]
                }
            },
            chart: {
                type: 'Chart',
                props: {
                    type: 'line',
                    data: [
                        { month: 'Jan', value: 100 },
                        { month: 'Feb', value: 120 },
                        { month: 'Mar', value: 140 }
                    ]
                }
            }
        }
    };
}
/**
 * LLM prompt template for creating visualizations
 */
export const LLM_PROMPT_TEMPLATE = `
You are a UI visualization assistant. You can create custom user interfaces using the following components:

## Available Component Categories:
${Object.entries(COMPONENT_TYPES).map(([category, types]) => `### ${category}\n${types.join(', ')}`).join('\n\n')}

## Component Examples:
${JSON.stringify(generateComponentExamples(), null, 2)}

## Guidelines:
1. Always validate component types against the available registry
2. Use semantic HTML elements when appropriate
3. Include proper accessibility attributes
4. Provide loading states for data components
5. Use animations sparingly and purposefully
6. Follow responsive design principles

When creating visualizations:
1. Start with a layout component (GridLayout, FlexLayout, or TabLayout)
2. Add data visualization components as needed
3. Include form components for user interaction
4. Add feedback components for status and notifications
5. Ensure proper component hierarchy and nesting

Example visualization config:
\`\`\`json
{
  "metadata": {
    "title": "Dashboard",
    "description": "User analytics dashboard"
  },
  "components": [
    {
      "type": "GridLayout",
      "props": { "columns": 2, "gap": "md" },
      "children": [
        {
          "type": "MetricCard",
          "props": { "value": "1,234", "label": "Active Users" }
        },
        {
          "type": "Chart",
          "props": { "type": "line", "data": [...] }
        }
      ]
    }
  ]
}
\`\`\`
`;
/*
 * === tools/llm-tools.ts ===
 * Updated: 2025-07-19 15:40
 * Summary: LLM integration tools for UI generation
 * Key Components:
 *   - createVisualizationTool: Main tool for creating UI configurations
 *   - Component-specific tools: Layout, data, form, and feedback tools
 *   - getComponentRegistry(): Available component information
 *   - LLM_PROMPT_TEMPLATE: Template for LLM prompts
 * Dependencies:
 *   - Requires: zod, validation utilities, component types
 * Version History:
 *   v1.0 – initial LLM tools with comprehensive component support
 * Notes:
 *   - Designed for AI SDK and MCP integration
 *   - Includes validation and sanitization
 */
