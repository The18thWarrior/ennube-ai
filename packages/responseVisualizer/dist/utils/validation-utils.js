// === utils/validation-utils.ts ===
// Created: 2025-07-19 14:40
// Purpose: Validation utilities for component configurations and data
// Exports:
//   - validateConfig: Validate visualization configuration
//   - sanitizeProps: Sanitize component props for security
//   - validateComponentType: Check if component type is supported
// Interactions:
//   - Used by: VisualizerRenderer, LLM tools
// Notes:
//   - Ensures safe execution of LLM-generated configurations
import { COMPONENT_TYPES } from '../types';
/**
 * Get all supported component types
 */
export function getSupportedComponentTypes() {
    return Object.values(COMPONENT_TYPES).flat();
}
/**
 * Validate if a component type is supported
 */
export function validateComponentType(type) {
    return getSupportedComponentTypes().includes(type);
}
/**
 * Get component category by type
 */
export function getComponentCategory(type) {
    for (const [category, types] of Object.entries(COMPONENT_TYPES)) {
        if (types.includes(type)) {
            return category;
        }
    }
    return null;
}
/**
 * Sanitize component props to prevent XSS and other security issues
 */
export function sanitizeProps(props) {
    const sanitized = {};
    for (const [key, value] of Object.entries(props)) {
        // Skip dangerous properties
        if (isDangerousProperty(key)) {
            console.warn(`Dangerous property "${key}" removed from props`);
            continue;
        }
        // Sanitize string values
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        }
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) : item);
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeProps(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
/**
 * Check if a property name is potentially dangerous
 */
function isDangerousProperty(key) {
    const dangerousProps = [
        'dangerouslySetInnerHTML',
        '__html',
        'onError',
        'onLoad',
        'srcDoc'
    ];
    return dangerousProps.includes(key) || key.startsWith('on') && key !== 'onClick' && key !== 'onChange' && key !== 'onSubmit';
}
/**
 * Sanitize string values to prevent XSS
 */
function sanitizeString(str) {
    // Remove script tags and javascript: protocols
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}
/**
 * Validate visualization configuration
 */
export function validateVisualizationConfig(config) {
    const errors = [];
    try {
        // Basic structure validation
        if (!config || typeof config !== 'object') {
            return { isValid: false, errors: ['Configuration must be an object'] };
        }
        if (!config.components || !Array.isArray(config.components)) {
            return { isValid: false, errors: ['Configuration must have a components array'] };
        }
        // Validate each component
        const validatedComponents = [];
        for (let i = 0; i < config.components.length; i++) {
            const component = config.components[i];
            const componentErrors = validateComponent(component, `components[${i}]`);
            if (componentErrors.length > 0) {
                errors.push(...componentErrors);
                continue;
            }
            // Sanitize component
            const sanitizedComponent = sanitizeComponent(component);
            validatedComponents.push(sanitizedComponent);
        }
        if (errors.length > 0) {
            return { isValid: false, errors };
        }
        // Create sanitized configuration
        const sanitized = {
            version: config.version || '1.0.0',
            metadata: config.metadata ? sanitizeProps(config.metadata) : undefined,
            theme: config.theme ? sanitizeProps(config.theme) : undefined,
            animation: config.animation ? sanitizeProps(config.animation) : undefined,
            components: validatedComponents,
            data: config.data ? sanitizeProps(config.data) : undefined,
            events: config.events ? sanitizeEventHandlers(config.events) : undefined,
            styles: typeof config.styles === 'string' ? sanitizeCSS(config.styles) : undefined
        };
        return { isValid: true, errors: [], sanitized };
    }
    catch (error) {
        return { isValid: false, errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`] };
    }
}
/**
 * Validate individual component configuration
 */
function validateComponent(component, path) {
    const errors = [];
    if (!component || typeof component !== 'object') {
        errors.push(`${path}: Component must be an object`);
        return errors;
    }
    if (!component.type || typeof component.type !== 'string') {
        errors.push(`${path}: Component must have a string type`);
        return errors;
    }
    if (!validateComponentType(component.type)) {
        errors.push(`${path}: Unsupported component type "${component.type}"`);
    }
    // Validate children if present
    if (component.children) {
        if (Array.isArray(component.children)) {
            for (let i = 0; i < component.children.length; i++) {
                const child = component.children[i];
                if (typeof child === 'object') {
                    const childErrors = validateComponent(child, `${path}.children[${i}]`);
                    errors.push(...childErrors);
                }
            }
        }
        else if (typeof component.children !== 'string') {
            errors.push(`${path}: Children must be an array of components or a string`);
        }
    }
    return errors;
}
/**
 * Sanitize component configuration
 */
function sanitizeComponent(component) {
    const sanitized = {
        ...component,
        props: component.props ? sanitizeProps(component.props) : undefined,
        style: component.style ? sanitizeProps(component.style) : undefined,
        events: component.events ? sanitizeEventHandlers(component.events) : undefined
    };
    // Sanitize children
    if (Array.isArray(component.children)) {
        sanitized.children = component.children.map(child => typeof child === 'string' ? sanitizeString(child) : sanitizeComponent(child));
    }
    else if (typeof component.children === 'string') {
        sanitized.children = sanitizeString(component.children);
    }
    return sanitized;
}
/**
 * Sanitize event handlers to only allow safe function names
 */
function sanitizeEventHandlers(events) {
    const sanitized = {};
    const allowedPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    for (const [event, handler] of Object.entries(events)) {
        if (typeof handler === 'string' && allowedPattern.test(handler)) {
            sanitized[event] = handler;
        }
        else {
            console.warn(`Invalid event handler "${handler}" for event "${event}"`);
        }
    }
    return sanitized;
}
/**
 * Sanitize CSS to remove potentially harmful styles
 */
function sanitizeCSS(css) {
    // Remove expressions, imports, and other potentially harmful CSS
    return css
        .replace(/expression\s*\([^)]*\)/gi, '')
        .replace(/@import\s+[^;]+;/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/behavior\s*:/gi, '')
        .replace(/-moz-binding\s*:/gi, '');
}
/**
 * Validate data source configuration
 */
export function validateDataSource(source) {
    const errors = [];
    if (!source || typeof source !== 'object') {
        return { isValid: false, errors: ['Data source must be an object'] };
    }
    if (!source.type || !['static', 'api', 'stream'].includes(source.type)) {
        errors.push('Data source type must be "static", "api", or "stream"');
    }
    if (!source.source) {
        errors.push('Data source must specify a source');
    }
    if (source.type === 'api' && typeof source.source !== 'string') {
        errors.push('API data source must specify a URL string');
    }
    if (source.type === 'static' && !Array.isArray(source.source)) {
        errors.push('Static data source must specify an array');
    }
    return { isValid: errors.length === 0, errors };
}
/**
 * Create a component configuration builder for safe LLM usage
 */
export function createComponentBuilder(type) {
    if (!validateComponentType(type)) {
        throw new Error(`Unsupported component type: ${type}`);
    }
    return {
        type,
        withProps(props) {
            return { ...this, props: sanitizeProps(props) };
        },
        withChildren(children) {
            const sanitizedChildren = Array.isArray(children)
                ? children.map(child => typeof child === 'string' ? sanitizeString(child) : sanitizeComponent(child))
                : sanitizeString(children);
            return { ...this, children: sanitizedChildren };
        },
        withAnimation(animation) {
            return { ...this, animation: sanitizeProps(animation) };
        },
        withTheme(theme) {
            return { ...this, theme: sanitizeProps(theme) };
        },
        build() {
            return sanitizeComponent(this);
        }
    };
}
/*
 * === utils/validation-utils.ts ===
 * Updated: 2025-07-19 14:40
 * Summary: Security-focused validation utilities for LLM-generated configurations
 * Key Components:
 *   - validateVisualizationConfig(): Comprehensive config validation with sanitization
 *   - sanitizeProps(): XSS prevention for component props
 *   - createComponentBuilder(): Safe component configuration builder
 * Dependencies:
 *   - Requires: zod for schema validation, component type registry
 * Version History:
 *   v1.0 – initial validation with security focus
 * Notes:
 *   - Prioritizes security by sanitizing all user-provided content
 *   - Provides clear error messages for debugging
 */
