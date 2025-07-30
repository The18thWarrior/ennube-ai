import { VisualizationConfig, ComponentConfig } from '../types';
/**
 * Get all supported component types
 */
export declare function getSupportedComponentTypes(): string[];
/**
 * Validate if a component type is supported
 */
export declare function validateComponentType(type: string): boolean;
/**
 * Get component category by type
 */
export declare function getComponentCategory(type: string): string | null;
/**
 * Sanitize component props to prevent XSS and other security issues
 */
export declare function sanitizeProps(props: Record<string, any>): Record<string, any>;
/**
 * Validate visualization configuration
 */
export declare function validateVisualizationConfig(config: any): {
    isValid: boolean;
    errors: string[];
    sanitized?: VisualizationConfig;
};
/**
 * Validate data source configuration
 */
export declare function validateDataSource(source: any): {
    isValid: boolean;
    errors: string[];
};
/**
 * Create a component configuration builder for safe LLM usage
 */
export declare function createComponentBuilder(type: string): {
    type: string;
    withProps(props: Record<string, any>): {
        props: Record<string, any>;
        type: string;
        withProps(props: Record<string, any>): /*elided*/ any;
        withChildren(children: ComponentConfig[] | string): {
            children: string | (string | import("..").BaseComponentConfig)[];
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withAnimation(animation: any): {
            animation: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withTheme(theme: any): {
            theme: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        build(): ComponentConfig;
    };
    withChildren(children: ComponentConfig[] | string): {
        children: string | (string | import("..").BaseComponentConfig)[];
        type: string;
        withProps(props: Record<string, any>): {
            props: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withChildren(children: ComponentConfig[] | string): /*elided*/ any;
        withAnimation(animation: any): {
            animation: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withTheme(theme: any): {
            theme: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        build(): ComponentConfig;
    };
    withAnimation(animation: any): {
        animation: Record<string, any>;
        type: string;
        withProps(props: Record<string, any>): {
            props: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withChildren(children: ComponentConfig[] | string): {
            children: string | (string | import("..").BaseComponentConfig)[];
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): {
                    theme: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): {
                theme: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            build(): ComponentConfig;
        };
        withAnimation(animation: any): /*elided*/ any;
        withTheme(theme: any): {
            theme: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        build(): ComponentConfig;
    };
    withTheme(theme: any): {
        theme: Record<string, any>;
        type: string;
        withProps(props: Record<string, any>): {
            props: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): /*elided*/ any;
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        withChildren(children: ComponentConfig[] | string): {
            children: string | (string | import("..").BaseComponentConfig)[];
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): {
                    animation: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): /*elided*/ any;
            withAnimation(animation: any): {
                animation: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        withAnimation(animation: any): {
            animation: Record<string, any>;
            type: string;
            withProps(props: Record<string, any>): {
                props: Record<string, any>;
                type: string;
                withProps(props: Record<string, any>): /*elided*/ any;
                withChildren(children: ComponentConfig[] | string): {
                    children: string | (string | import("..").BaseComponentConfig)[];
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withChildren(children: ComponentConfig[] | string): {
                children: string | (string | import("..").BaseComponentConfig)[];
                type: string;
                withProps(props: Record<string, any>): {
                    props: Record<string, any>;
                    type: string;
                    withProps(props: Record<string, any>): /*elided*/ any;
                    withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                    withAnimation(animation: any): /*elided*/ any;
                    withTheme(theme: any): /*elided*/ any;
                    build(): ComponentConfig;
                };
                withChildren(children: ComponentConfig[] | string): /*elided*/ any;
                withAnimation(animation: any): /*elided*/ any;
                withTheme(theme: any): /*elided*/ any;
                build(): ComponentConfig;
            };
            withAnimation(animation: any): /*elided*/ any;
            withTheme(theme: any): /*elided*/ any;
            build(): ComponentConfig;
        };
        withTheme(theme: any): /*elided*/ any;
        build(): ComponentConfig;
    };
    build(): ComponentConfig;
};
//# sourceMappingURL=validation-utils.d.ts.map