// === types/index.ts ===
// Created: 2025-07-19 14:30
// Purpose: Core type definitions for Response Visualizer package
// Exports:
//   - VisualizationConfig: Main configuration interface
//   - ComponentType: Enum of available component types
//   - VisualizationProps: Props for main visualizer
// Interactions:
//   - Used by: All components and tools
// Notes:
//   - Extends AI SDK types for LLM integration
import { z } from 'zod';
/**
 * Component categories for LLM tools
 */
export const COMPONENT_CATEGORIES = {
    LAYOUT: 'layout',
    DATA: 'data',
    FORM: 'form',
    FEEDBACK: 'feedback',
    NAVIGATION: 'navigation',
    MEDIA: 'media',
    UTILITY: 'utility'
};
/**
 * Available component types organized by category
 */
export const COMPONENT_TYPES = {
    [COMPONENT_CATEGORIES.LAYOUT]: [
        'GridLayout', 'FlexLayout', 'TabLayout', 'CardLayout', 'SectionLayout'
    ],
    [COMPONENT_CATEGORIES.DATA]: [
        'DataTable', 'Chart', 'MetricCard', 'Timeline', 'KanbanBoard', 'Calendar'
    ],
    [COMPONENT_CATEGORIES.FORM]: [
        'FormBuilder', 'DynamicInput', 'FormField', 'FormGroup', 'FormSection'
    ],
    [COMPONENT_CATEGORIES.FEEDBACK]: [
        'StatusIndicator', 'AlertBanner', 'ProgressTracker', 'NotificationCenter', 'ToastContainer'
    ],
    [COMPONENT_CATEGORIES.NAVIGATION]: [
        'Breadcrumb', 'Pagination', 'StepIndicator', 'TabNavigation', 'SideNavigation'
    ],
    [COMPONENT_CATEGORIES.MEDIA]: [
        'ImageGallery', 'VideoPlayer', 'AudioPlayer', 'FileUpload', 'DocumentViewer'
    ],
    [COMPONENT_CATEGORIES.UTILITY]: [
        'SearchBox', 'FilterPanel', 'SortControls', 'ExportButton', 'ShareButton'
    ]
};
// Zod schemas for validation
export const AnimationConfigSchema = z.object({
    type: z.enum(['fade', 'slide', 'bounce', 'pulse', 'spin', 'none']).optional(),
    duration: z.number().optional(),
    delay: z.number().optional(),
    repeat: z.boolean().optional()
}).describe('Animation configuration for components');
export const LoadingConfigSchema = z.object({
    enabled: z.boolean().optional(),
    text: z.string().optional(),
    type: z.enum(['spinner', 'skeleton', 'dots', 'pulse']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional()
}).describe('Loading state configuration');
export const ThemeConfigSchema = z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    background: z.enum(['default', 'muted', 'card']).optional(),
    radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
    shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional()
}).describe('Theme configuration');
export const ComponentConfigSchema = z.lazy(() => z.object({
    id: z.string().optional(),
    type: z.string(),
    props: z.record(z.any()).optional(),
    children: z.union([z.array(ComponentConfigSchema), z.string()]).optional(),
    className: z.string().optional(),
    style: z.record(z.any()).optional(),
    animation: AnimationConfigSchema.optional(),
    loading: LoadingConfigSchema.optional(),
    theme: ThemeConfigSchema.optional(),
    events: z.record(z.string()).optional(),
    condition: z.string().optional()
}).describe('Component configuration'));
export const VisualizationConfigSchema = z.object({
    version: z.string().optional(),
    metadata: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        author: z.string().optional(),
        created: z.string().optional(),
        updated: z.string().optional()
    }).optional(),
    theme: ThemeConfigSchema.optional(),
    animation: AnimationConfigSchema.optional(),
    components: z.array(ComponentConfigSchema),
    data: z.record(z.any()).optional(),
    events: z.record(z.string()).optional(),
    styles: z.string().optional()
}).describe('Main visualization configuration');
/*
 * === types/index.ts ===
 * Updated: 2025-07-19 14:30
 * Summary: Core type definitions for Response Visualizer package
 * Key Components:
 *   - VisualizationConfig: Main configuration interface for LLM-generated UIs
 *   - ComponentConfig: Flexible component configuration with animations and loading
 *   - COMPONENT_TYPES: Organized registry of available components by category
 * Dependencies:
 *   - Requires: zod for validation, React types
 * Version History:
 *   v1.0 – initial type definitions with comprehensive component support
 * Notes:
 *   - Designed for easy LLM integration with clear categorization
 *   - Supports animations, loading states, and theme customization
 */
