import { VisualizationConfig } from '../types';
/**
 * Server-side request processing
 */
export interface VisualizationRequest {
    prompt: string;
    context?: Record<string, any>;
    preferences?: {
        theme?: string;
        layout?: string;
        components?: string[];
    };
    data?: Record<string, any>;
}
export interface VisualizationResponse {
    success: boolean;
    config?: VisualizationConfig;
    error?: string;
    suggestions?: string[];
}
/**
 * Process visualization request on server
 */
export declare function processVisualizationRequest(request: VisualizationRequest, llmProcessor?: (prompt: string, tools: any[]) => Promise<any>): Promise<VisualizationResponse>;
/**
 * Generate MCP (Model Context Protocol) tools
 */
export declare function generateMCPTools(): {
    tools: ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                description: {
                    type: string;
                    description: string;
                };
                data: {
                    type: string;
                    description: string;
                };
                theme: {
                    type: string;
                    properties: {
                        primary: {
                            type: string;
                        };
                        background: {
                            type: string;
                            enum: string[];
                        };
                    };
                    description: string;
                };
                category?: undefined;
                config?: undefined;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                category: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                description?: undefined;
                data?: undefined;
                theme?: undefined;
                config?: undefined;
            };
            required?: undefined;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                config: {
                    type: string;
                    description: string;
                };
                description?: undefined;
                data?: undefined;
                theme?: undefined;
                category?: undefined;
            };
            required: string[];
        };
    })[];
};
/**
 * MCP tool handlers
 */
export declare const mcpToolHandlers: {
    create_ui_visualization: (args: {
        description: string;
        data?: any;
        theme?: any;
    }) => Promise<VisualizationResponse>;
    get_available_components: (args: {
        category?: string;
    }) => Promise<{
        categories: {
            readonly LAYOUT: "layout";
            readonly DATA: "data";
            readonly FORM: "form";
            readonly FEEDBACK: "feedback";
            readonly NAVIGATION: "navigation";
            readonly MEDIA: "media";
            readonly UTILITY: "utility";
        };
        types: {
            readonly layout: readonly ["GridLayout", "FlexLayout", "TabLayout", "CardLayout", "SectionLayout"];
            readonly data: readonly ["DataTable", "Chart", "MetricCard", "Timeline", "KanbanBoard", "Calendar"];
            readonly form: readonly ["FormBuilder", "DynamicInput", "FormField", "FormGroup", "FormSection"];
            readonly feedback: readonly ["StatusIndicator", "AlertBanner", "ProgressTracker", "NotificationCenter", "ToastContainer"];
            readonly navigation: readonly ["Breadcrumb", "Pagination", "StepIndicator", "TabNavigation", "SideNavigation"];
            readonly media: readonly ["ImageGallery", "VideoPlayer", "AudioPlayer", "FileUpload", "DocumentViewer"];
            readonly utility: readonly ["SearchBox", "FilterPanel", "SortControls", "ExportButton", "ShareButton"];
        };
        descriptions: {
            layout: string;
            data: string;
            form: string;
            feedback: string;
            navigation: string;
            media: string;
            utility: string;
        };
    } | {
        category: string;
        components: readonly ["GridLayout", "FlexLayout", "TabLayout", "CardLayout", "SectionLayout"] | readonly ["DataTable", "Chart", "MetricCard", "Timeline", "KanbanBoard", "Calendar"] | readonly ["FormBuilder", "DynamicInput", "FormField", "FormGroup", "FormSection"] | readonly ["StatusIndicator", "AlertBanner", "ProgressTracker", "NotificationCenter", "ToastContainer"] | readonly ["Breadcrumb", "Pagination", "StepIndicator", "TabNavigation", "SideNavigation"] | readonly ["ImageGallery", "VideoPlayer", "AudioPlayer", "FileUpload", "DocumentViewer"] | readonly ["SearchBox", "FilterPanel", "SortControls", "ExportButton", "ShareButton"];
        description: string;
    }>;
    validate_ui_config: (args: {
        config: any;
    }) => Promise<{
        valid: boolean;
        errors: string[];
        sanitized: VisualizationConfig | undefined;
    }>;
};
/**
 * Express.js middleware for handling visualization requests
 */
export declare function createVisualizationMiddleware(options?: {
    llmProcessor?: (prompt: string, tools: any[]) => Promise<any>;
    rateLimiter?: (req: any) => boolean;
    auth?: (req: any) => boolean;
}): (req: any, res: any, next: any) => Promise<any>;
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
//# sourceMappingURL=server-tools.d.ts.map