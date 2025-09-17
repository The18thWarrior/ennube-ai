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
    options?: Array<{
        label: string;
        value: any;
    }>;
    /** Validation rules */
    validation?: ValidationConfig;
    /** Field dependencies */
    dependsOn?: string[];
}
/**
 * Main component configuration union type
 */
export type ComponentConfig = BaseComponentConfig | LayoutComponentConfig | ChartComponentConfig | FormComponentConfig;
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
export declare const COMPONENT_CATEGORIES: {
    readonly LAYOUT: "layout";
    readonly DATA: "data";
    readonly FORM: "form";
    readonly FEEDBACK: "feedback";
    readonly NAVIGATION: "navigation";
    readonly MEDIA: "media";
    readonly UTILITY: "utility";
};
export type ComponentCategory = typeof COMPONENT_CATEGORIES[keyof typeof COMPONENT_CATEGORIES];
/**
 * Available component types organized by category
 */
export declare const COMPONENT_TYPES: {
    readonly layout: readonly ["GridLayout", "FlexLayout", "TabLayout", "CardLayout", "SectionLayout"];
    readonly data: readonly ["DataTable", "Chart", "MetricCard", "Timeline", "KanbanBoard", "Calendar"];
    readonly form: readonly ["FormBuilder", "DynamicInput", "FormField", "FormGroup", "FormSection"];
    readonly feedback: readonly ["StatusIndicator", "AlertBanner", "ProgressTracker", "NotificationCenter", "ToastContainer"];
    readonly navigation: readonly ["Breadcrumb", "Pagination", "StepIndicator", "TabNavigation", "SideNavigation"];
    readonly media: readonly ["ImageGallery", "VideoPlayer", "AudioPlayer", "FileUpload", "DocumentViewer"];
    readonly utility: readonly ["SearchBox", "FilterPanel", "SortControls", "ExportButton", "ShareButton"];
};
export declare const AnimationConfigSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["fade", "slide", "bounce", "pulse", "spin", "none"]>>;
    duration: z.ZodOptional<z.ZodNumber>;
    delay: z.ZodOptional<z.ZodNumber>;
    repeat: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
    repeat?: boolean | undefined;
    duration?: number | undefined;
    delay?: number | undefined;
}, {
    type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
    repeat?: boolean | undefined;
    duration?: number | undefined;
    delay?: number | undefined;
}>;
export declare const LoadingConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    text: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["spinner", "skeleton", "dots", "pulse"]>>;
    size: z.ZodOptional<z.ZodEnum<["sm", "md", "lg"]>>;
}, "strip", z.ZodTypeAny, {
    size?: "sm" | "md" | "lg" | undefined;
    enabled?: boolean | undefined;
    type?: "spinner" | "skeleton" | "dots" | "pulse" | undefined;
    text?: string | undefined;
}, {
    size?: "sm" | "md" | "lg" | undefined;
    enabled?: boolean | undefined;
    type?: "spinner" | "skeleton" | "dots" | "pulse" | undefined;
    text?: string | undefined;
}>;
export declare const ThemeConfigSchema: z.ZodObject<{
    primary: z.ZodOptional<z.ZodString>;
    secondary: z.ZodOptional<z.ZodString>;
    background: z.ZodOptional<z.ZodEnum<["default", "muted", "card"]>>;
    radius: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
    shadow: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "xl"]>>;
}, "strip", z.ZodTypeAny, {
    background?: "default" | "muted" | "card" | undefined;
    radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
    shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
    primary?: string | undefined;
    secondary?: string | undefined;
}, {
    background?: "default" | "muted" | "card" | undefined;
    radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
    shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
    primary?: string | undefined;
    secondary?: string | undefined;
}>;
export declare const ComponentConfigSchema: z.ZodType<ComponentConfig>;
export declare const VisualizationConfigSchema: z.ZodObject<{
    version: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        created: z.ZodOptional<z.ZodString>;
        updated: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        author?: string | undefined;
        created?: string | undefined;
        updated?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        author?: string | undefined;
        created?: string | undefined;
        updated?: string | undefined;
    }>>;
    theme: z.ZodOptional<z.ZodObject<{
        primary: z.ZodOptional<z.ZodString>;
        secondary: z.ZodOptional<z.ZodString>;
        background: z.ZodOptional<z.ZodEnum<["default", "muted", "card"]>>;
        radius: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
        shadow: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "xl"]>>;
    }, "strip", z.ZodTypeAny, {
        background?: "default" | "muted" | "card" | undefined;
        radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
        shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
        primary?: string | undefined;
        secondary?: string | undefined;
    }, {
        background?: "default" | "muted" | "card" | undefined;
        radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
        shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
        primary?: string | undefined;
        secondary?: string | undefined;
    }>>;
    animation: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["fade", "slide", "bounce", "pulse", "spin", "none"]>>;
        duration: z.ZodOptional<z.ZodNumber>;
        delay: z.ZodOptional<z.ZodNumber>;
        repeat: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
        repeat?: boolean | undefined;
        duration?: number | undefined;
        delay?: number | undefined;
    }, {
        type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
        repeat?: boolean | undefined;
        duration?: number | undefined;
        delay?: number | undefined;
    }>>;
    components: z.ZodArray<z.ZodType<ComponentConfig, z.ZodTypeDef, ComponentConfig>, "many">;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    events: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    styles: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    components: ComponentConfig[];
    data?: Record<string, any> | undefined;
    metadata?: {
        title?: string | undefined;
        description?: string | undefined;
        author?: string | undefined;
        created?: string | undefined;
        updated?: string | undefined;
    } | undefined;
    styles?: string | undefined;
    theme?: {
        background?: "default" | "muted" | "card" | undefined;
        radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
        shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
        primary?: string | undefined;
        secondary?: string | undefined;
    } | undefined;
    version?: string | undefined;
    animation?: {
        type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
        repeat?: boolean | undefined;
        duration?: number | undefined;
        delay?: number | undefined;
    } | undefined;
    events?: Record<string, string> | undefined;
}, {
    components: ComponentConfig[];
    data?: Record<string, any> | undefined;
    metadata?: {
        title?: string | undefined;
        description?: string | undefined;
        author?: string | undefined;
        created?: string | undefined;
        updated?: string | undefined;
    } | undefined;
    styles?: string | undefined;
    theme?: {
        background?: "default" | "muted" | "card" | undefined;
        radius?: "sm" | "md" | "lg" | "none" | "full" | undefined;
        shadow?: "sm" | "md" | "lg" | "none" | "xl" | undefined;
        primary?: string | undefined;
        secondary?: string | undefined;
    } | undefined;
    version?: string | undefined;
    animation?: {
        type?: "pulse" | "none" | "fade" | "slide" | "bounce" | "spin" | undefined;
        repeat?: boolean | undefined;
        duration?: number | undefined;
        delay?: number | undefined;
    } | undefined;
    events?: Record<string, string> | undefined;
}>;
//# sourceMappingURL=index.d.ts.map