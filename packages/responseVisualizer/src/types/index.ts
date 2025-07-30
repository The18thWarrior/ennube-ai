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
 * Base animation configuration for components
 */
export interface AnimationConfig {
  /** Animation type */
  type?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'spin' | 'none';
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation delay in milliseconds */
  delay?: number;
  /** Whether to repeat animation */
  repeat?: boolean;
}

/**
 * Loading state configuration
 */
export interface LoadingConfig {
  /** Show loading indicator */
  enabled?: boolean;
  /** Loading text */
  text?: string;
  /** Loading indicator type */
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  /** Size of loading indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Theme configuration for components
 */
export interface ThemeConfig {
  /** Primary color scheme */
  primary?: string;
  /** Secondary color scheme */
  secondary?: string;
  /** Background variant */
  background?: 'default' | 'muted' | 'card';
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Shadow level */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Data source configuration for dynamic components
 */
export interface DataSourceConfig {
  /** Data source type */
  type: 'static' | 'api' | 'stream';
  /** Static data or API endpoint */
  source: any[] | string;
  /** Refresh interval for API data (ms) */
  refreshInterval?: number;
  /** Data transformation function name */
  transform?: string;
}

/**
 * Validation configuration for form components
 */
export interface ValidationConfig {
  /** Required field */
  required?: boolean;
  /** Minimum length/value */
  min?: number;
  /** Maximum length/value */
  max?: number;
  /** Regex pattern */
  pattern?: string;
  /** Custom validation function name */
  validator?: string;
  /** Error message */
  message?: string;
}

/**
 * Layout configuration for container components
 */
export interface LayoutConfig {
  /** Container type */
  container?: 'div' | 'section' | 'article' | 'main';
  /** Grid columns */
  columns?: number | 'auto' | 'fit';
  /** Gap between items */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Padding */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Margin */
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Responsive breakpoints */
  responsive?: {
    sm?: Partial<LayoutConfig>;
    md?: Partial<LayoutConfig>;
    lg?: Partial<LayoutConfig>;
    xl?: Partial<LayoutConfig>;
  };
}

/**
 * Base component configuration
 */
export interface BaseComponentConfig {
  /** Component identifier */
  id?: string;
  /** Component type */
  type: string;
  /** Component props */
  props?: Record<string, any>;
  /** Child components or content */
  children?: ComponentConfig[] | string;
  /** CSS classes */
  className?: string;
  /** Inline styles */
  style?: Record<string, any>;
  /** Animation configuration */
  animation?: AnimationConfig;
  /** Loading configuration */
  loading?: LoadingConfig;
  /** Theme configuration */
  theme?: ThemeConfig;
  /** Event handlers */
  events?: Record<string, string>;
  /** Conditional rendering */
  condition?: string;
  /** Data binding */
  data?: DataSourceConfig;
  /** Validation rules (for form components) */
  validation?: ValidationConfig;
}

/**
 * Layout-specific component configuration
 */
export interface LayoutComponentConfig extends BaseComponentConfig {
  /** Layout-specific configuration */
  layout?: LayoutConfig;
}

/**
 * Chart-specific component configuration
 */
export interface ChartComponentConfig extends BaseComponentConfig {
  /** Chart type */
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
  /** Chart data */
  chartData?: any[];
  /** Chart options */
  chartOptions?: Record<string, any>;
}

/**
 * Form-specific component configuration
 */
export interface FormComponentConfig extends BaseComponentConfig {
  /** Form fields */
  fields?: FormFieldConfig[];
  /** Form submission handler */
  onSubmit?: string;
  /** Form validation mode */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  /** Field name */
  name: string;
  /** Field type */
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea';
  /** Field label */
  label?: string;
  /** Field placeholder */
  placeholder?: string;
  /** Default value */
  defaultValue?: any;
  /** Field options (for select, radio) */
  options?: Array<{ label: string; value: any }>;
  /** Validation rules */
  validation?: ValidationConfig;
  /** Field dependencies */
  dependsOn?: string[];
}

/**
 * Main component configuration union type
 */
export type ComponentConfig = 
  | BaseComponentConfig
  | LayoutComponentConfig
  | ChartComponentConfig
  | FormComponentConfig;

/**
 * Main visualization configuration
 */
export interface VisualizationConfig {
  /** Configuration version */
  version?: string;
  /** Visualization metadata */
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    created?: string;
    updated?: string;
  };
  /** Global theme */
  theme?: ThemeConfig;
  /** Global animation settings */
  animation?: AnimationConfig;
  /** Component tree */
  components: ComponentConfig[];
  /** Global data sources */
  data?: Record<string, DataSourceConfig>;
  /** Global event handlers */
  events?: Record<string, string>;
  /** Custom CSS */
  styles?: string;
}

/**
 * Props for the main VisualizerRenderer component
 */
export interface VisualizerProps {
  /** Visualization configuration */
  config: VisualizationConfig;
  /** Custom component registry */
  components?: Record<string, React.ComponentType<any>>;
  /** Event handler registry */
  handlers?: Record<string, Function>;
  /** Data provider functions */
  dataProviders?: Record<string, Function>;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Loading callback */
  onLoading?: (loading: boolean) => void;
}

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
} as const;

export type ComponentCategory = typeof COMPONENT_CATEGORIES[keyof typeof COMPONENT_CATEGORIES];

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
} as const;

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

export const ComponentConfigSchema: z.ZodType<ComponentConfig> = z.lazy(() =>
  z.object({
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
  }).describe('Component configuration')
);

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
