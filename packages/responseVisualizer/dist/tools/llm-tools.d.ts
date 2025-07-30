import { z } from 'zod';
/**
 * Tool definition for creating visualizations
 */
export declare const createVisualizationTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        components: z.ZodArray<z.ZodType<import("..").ComponentConfig, z.ZodTypeDef, import("..").ComponentConfig>, "many">;
        theme: z.ZodOptional<z.ZodObject<{
            primary: z.ZodOptional<z.ZodString>;
            background: z.ZodOptional<z.ZodEnum<["default", "muted", "card"]>>;
            radius: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "full"]>>;
            shadow: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "xl"]>>;
        }, "strip", z.ZodTypeAny, {
            primary?: string | undefined;
            background?: "default" | "muted" | "card" | undefined;
            radius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
            shadow?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
        }, {
            primary?: string | undefined;
            background?: "default" | "muted" | "card" | undefined;
            radius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
            shadow?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
        }>>;
        animation: z.ZodOptional<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["fade", "slide", "bounce", "pulse", "spin", "none"]>>;
            duration: z.ZodOptional<z.ZodNumber>;
            delay: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type?: "fade" | "slide" | "bounce" | "pulse" | "spin" | "none" | undefined;
            duration?: number | undefined;
            delay?: number | undefined;
        }, {
            type?: "fade" | "slide" | "bounce" | "pulse" | "spin" | "none" | undefined;
            duration?: number | undefined;
            delay?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        components: import("..").ComponentConfig[];
        description?: string | undefined;
        theme?: {
            primary?: string | undefined;
            background?: "default" | "muted" | "card" | undefined;
            radius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
            shadow?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
        } | undefined;
        animation?: {
            type?: "fade" | "slide" | "bounce" | "pulse" | "spin" | "none" | undefined;
            duration?: number | undefined;
            delay?: number | undefined;
        } | undefined;
    }, {
        title: string;
        components: import("..").ComponentConfig[];
        description?: string | undefined;
        theme?: {
            primary?: string | undefined;
            background?: "default" | "muted" | "card" | undefined;
            radius?: "none" | "sm" | "md" | "lg" | "full" | undefined;
            shadow?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
        } | undefined;
        animation?: {
            type?: "fade" | "slide" | "bounce" | "pulse" | "spin" | "none" | undefined;
            duration?: number | undefined;
            delay?: number | undefined;
        } | undefined;
    }>;
    execute: (params: any) => Promise<import("..").VisualizationConfig | undefined>;
};
/**
 * Tool for creating layout components
 */
export declare const createLayoutTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        type: z.ZodEnum<["GridLayout", "FlexLayout", "TabLayout"]>;
        config: z.ZodObject<{
            columns: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodEnum<["auto", "fit"]>]>>;
            direction: z.ZodOptional<z.ZodEnum<["row", "col", "row-reverse", "col-reverse"]>>;
            justify: z.ZodOptional<z.ZodEnum<["start", "end", "center", "between", "around", "evenly"]>>;
            align: z.ZodOptional<z.ZodEnum<["start", "end", "center", "baseline", "stretch"]>>;
            gap: z.ZodOptional<z.ZodEnum<["none", "sm", "md", "lg", "xl"]>>;
            tabs: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                content: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                id: string;
                label: string;
                content?: any;
            }, {
                id: string;
                label: string;
                content?: any;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            columns?: number | "auto" | "fit" | undefined;
            gap?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
            direction?: "row" | "col" | "row-reverse" | "col-reverse" | undefined;
            justify?: "start" | "end" | "center" | "between" | "around" | "evenly" | undefined;
            align?: "start" | "end" | "center" | "baseline" | "stretch" | undefined;
            tabs?: {
                id: string;
                label: string;
                content?: any;
            }[] | undefined;
        }, {
            columns?: number | "auto" | "fit" | undefined;
            gap?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
            direction?: "row" | "col" | "row-reverse" | "col-reverse" | undefined;
            justify?: "start" | "end" | "center" | "between" | "around" | "evenly" | undefined;
            align?: "start" | "end" | "center" | "baseline" | "stretch" | undefined;
            tabs?: {
                id: string;
                label: string;
                content?: any;
            }[] | undefined;
        }>;
        children: z.ZodOptional<z.ZodArray<z.ZodType<import("..").ComponentConfig, z.ZodTypeDef, import("..").ComponentConfig>, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "GridLayout" | "FlexLayout" | "TabLayout";
        config: {
            columns?: number | "auto" | "fit" | undefined;
            gap?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
            direction?: "row" | "col" | "row-reverse" | "col-reverse" | undefined;
            justify?: "start" | "end" | "center" | "between" | "around" | "evenly" | undefined;
            align?: "start" | "end" | "center" | "baseline" | "stretch" | undefined;
            tabs?: {
                id: string;
                label: string;
                content?: any;
            }[] | undefined;
        };
        children?: import("..").ComponentConfig[] | undefined;
    }, {
        type: "GridLayout" | "FlexLayout" | "TabLayout";
        config: {
            columns?: number | "auto" | "fit" | undefined;
            gap?: "none" | "sm" | "md" | "lg" | "xl" | undefined;
            direction?: "row" | "col" | "row-reverse" | "col-reverse" | undefined;
            justify?: "start" | "end" | "center" | "between" | "around" | "evenly" | undefined;
            align?: "start" | "end" | "center" | "baseline" | "stretch" | undefined;
            tabs?: {
                id: string;
                label: string;
                content?: any;
            }[] | undefined;
        };
        children?: import("..").ComponentConfig[] | undefined;
    }>;
    execute: (params: any) => Promise<import("..").ComponentConfig>;
};
/**
 * Tool for creating data visualization components
 */
export declare const createDataVisualizationTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        type: z.ZodEnum<["DataTable", "Chart", "MetricCard", "Timeline"]>;
        data: z.ZodArray<z.ZodAny, "many">;
        config: z.ZodOptional<z.ZodObject<{
            columns: z.ZodOptional<z.ZodArray<z.ZodObject<{
                key: z.ZodString;
                header: z.ZodString;
                sortable: z.ZodOptional<z.ZodBoolean>;
                type: z.ZodOptional<z.ZodEnum<["string", "number", "date", "boolean"]>>;
            }, "strip", z.ZodTypeAny, {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }, {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }>, "many">>;
            chartType: z.ZodOptional<z.ZodEnum<["line", "bar", "pie", "area", "scatter"]>>;
            searchable: z.ZodOptional<z.ZodBoolean>;
            pagination: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            chartType?: "line" | "bar" | "pie" | "area" | "scatter" | undefined;
            columns?: {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }[] | undefined;
            pagination?: boolean | undefined;
            searchable?: boolean | undefined;
        }, {
            chartType?: "line" | "bar" | "pie" | "area" | "scatter" | undefined;
            columns?: {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }[] | undefined;
            pagination?: boolean | undefined;
            searchable?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        data: any[];
        type: "DataTable" | "Chart" | "MetricCard" | "Timeline";
        config?: {
            chartType?: "line" | "bar" | "pie" | "area" | "scatter" | undefined;
            columns?: {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }[] | undefined;
            pagination?: boolean | undefined;
            searchable?: boolean | undefined;
        } | undefined;
    }, {
        data: any[];
        type: "DataTable" | "Chart" | "MetricCard" | "Timeline";
        config?: {
            chartType?: "line" | "bar" | "pie" | "area" | "scatter" | undefined;
            columns?: {
                key: string;
                header: string;
                type?: "string" | "number" | "boolean" | "date" | undefined;
                sortable?: boolean | undefined;
            }[] | undefined;
            pagination?: boolean | undefined;
            searchable?: boolean | undefined;
        } | undefined;
    }>;
    execute: (params: any) => Promise<import("..").ComponentConfig>;
};
/**
 * Tool for creating form components
 */
export declare const createFormTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["text", "email", "password", "number", "select", "checkbox", "radio", "textarea"]>;
            label: z.ZodOptional<z.ZodString>;
            placeholder: z.ZodOptional<z.ZodString>;
            required: z.ZodOptional<z.ZodBoolean>;
            options: z.ZodOptional<z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodAny;
            }, "strip", z.ZodTypeAny, {
                label: string;
                value?: any;
            }, {
                label: string;
                value?: any;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "number" | "text" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea";
            name: string;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
        }, {
            type: "number" | "text" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea";
            name: string;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
        }>, "many">;
        submitText: z.ZodOptional<z.ZodString>;
        onSubmit: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fields: {
            type: "number" | "text" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea";
            name: string;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
        }[];
        onSubmit?: string | undefined;
        submitText?: string | undefined;
    }, {
        fields: {
            type: "number" | "text" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea";
            name: string;
            options?: {
                label: string;
                value?: any;
            }[] | undefined;
            placeholder?: string | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
        }[];
        onSubmit?: string | undefined;
        submitText?: string | undefined;
    }>;
    execute: (params: any) => Promise<import("..").ComponentConfig>;
};
/**
 * Tool for creating feedback components
 */
export declare const createFeedbackTool: {
    name: string;
    description: string;
    parameters: z.ZodObject<{
        type: z.ZodEnum<["StatusIndicator", "AlertBanner", "ProgressTracker"]>;
        config: z.ZodObject<{
            status: z.ZodOptional<z.ZodEnum<["success", "error", "warning", "info"]>>;
            message: z.ZodOptional<z.ZodString>;
            steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                completed: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                id: string;
                label: string;
                completed: boolean;
            }, {
                id: string;
                label: string;
                completed: boolean;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            message?: string | undefined;
            status?: "success" | "error" | "warning" | "info" | undefined;
            steps?: {
                id: string;
                label: string;
                completed: boolean;
            }[] | undefined;
        }, {
            message?: string | undefined;
            status?: "success" | "error" | "warning" | "info" | undefined;
            steps?: {
                id: string;
                label: string;
                completed: boolean;
            }[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "StatusIndicator" | "AlertBanner" | "ProgressTracker";
        config: {
            message?: string | undefined;
            status?: "success" | "error" | "warning" | "info" | undefined;
            steps?: {
                id: string;
                label: string;
                completed: boolean;
            }[] | undefined;
        };
    }, {
        type: "StatusIndicator" | "AlertBanner" | "ProgressTracker";
        config: {
            message?: string | undefined;
            status?: "success" | "error" | "warning" | "info" | undefined;
            steps?: {
                id: string;
                label: string;
                completed: boolean;
            }[] | undefined;
        };
    }>;
    execute: (params: any) => Promise<import("..").ComponentConfig>;
};
/**
 * Get available component registry for LLMs
 */
export declare function getComponentRegistry(): {
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
};
/**
 * Generate component examples for LLM training
 */
export declare function generateComponentExamples(): {
    layouts: {
        grid: {
            type: string;
            props: {
                columns: number;
                gap: string;
            };
            children: {
                type: string;
                props: {
                    value: string;
                    label: string;
                };
            }[];
        };
        flex: {
            type: string;
            props: {
                direction: string;
                justify: string;
                align: string;
            };
            children: {
                type: string;
                children: string;
            }[];
        };
        tabs: {
            type: string;
            props: {
                tabs: {
                    id: string;
                    label: string;
                    content: string;
                }[];
            };
        };
    };
    data: {
        table: {
            type: string;
            props: {
                data: {
                    id: number;
                    name: string;
                    email: string;
                }[];
                columns: {
                    key: string;
                    header: string;
                    sortable: boolean;
                }[];
            };
        };
        chart: {
            type: string;
            props: {
                type: string;
                data: {
                    month: string;
                    value: number;
                }[];
            };
        };
    };
};
/**
 * LLM prompt template for creating visualizations
 */
export declare const LLM_PROMPT_TEMPLATE: string;
//# sourceMappingURL=llm-tools.d.ts.map