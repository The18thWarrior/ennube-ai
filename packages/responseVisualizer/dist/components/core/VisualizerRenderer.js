// === components/core/VisualizerRenderer.tsx ===
// Created: 2025-07-19 15:00
// Purpose: Main renderer component for visualization configurations
// Exports:
//   - VisualizerRenderer: Primary component for rendering LLM-generated UIs
//   - ComponentRenderer: Individual component renderer
// Interactions:
//   - Used by: Main package consumers
// Notes:
//   - Handles component registration and event management
'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { clsx } from 'clsx';
import { validateVisualizationConfig } from '../../utils/validation-utils';
import { getAnimationClasses } from '../../utils/animation-utils';
import { LoadingIndicator, LoadingOverlay } from './LoadingIndicator';
// Import all available components
import { GridLayout } from '../layouts/GridLayout';
import { FlexLayout } from '../layouts/FlexLayout';
import { TabLayout } from '../layouts/TabLayout';
import { DataTable } from '../data/DataTable';
import { Chart } from '../data/Chart';
import { MetricCard } from '../data/MetricCard';
import { Timeline } from '../data/Timeline';
import { FormBuilder } from '../forms/FormBuilder';
import { DynamicInput } from '../forms/DynamicInput';
import { StatusIndicator } from '../feedback/StatusIndicator';
import { AlertBanner } from '../feedback/AlertBanner';
import { ProgressTracker } from '../feedback/ProgressTracker';
/**
 * Default component registry
 */
const DEFAULT_COMPONENTS = {
    // Layout components
    GridLayout,
    FlexLayout,
    TabLayout,
    // Data components
    DataTable,
    Chart,
    MetricCard,
    Timeline,
    // Form components
    FormBuilder,
    DynamicInput,
    // Feedback components
    StatusIndicator,
    AlertBanner,
    ProgressTracker,
    // Basic HTML elements
    div: 'div',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    section: 'section',
    article: 'article',
    header: 'header',
    footer: 'footer',
    nav: 'nav',
    main: 'main'
};
/**
 * Individual component renderer
 */
export const ComponentRenderer = ({ config, components, handlers, dataProviders, onError }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Memoize component resolution
    const Component = useMemo(() => {
        const component = components[config.type];
        if (!component) {
            onError(new Error(`Unknown component type: ${config.type}`));
            return null;
        }
        return component;
    }, [config.type, components, onError]);
    // Handle conditional rendering
    const shouldRender = useMemo(() => {
        if (!config.condition)
            return true;
        try {
            // Simple condition evaluation (could be extended)
            return Boolean(config.condition);
        }
        catch (err) {
            console.warn('Error evaluating condition:', err);
            return true;
        }
    }, [config.condition]);
    // Process props with event handlers
    const processedProps = useMemo(() => {
        const props = { ...config.props };
        // Process event handlers
        if (config.events) {
            for (const [event, handlerName] of Object.entries(config.events)) {
                const handler = handlers[handlerName];
                if (handler && typeof handler === 'function') {
                    props[event] = handler;
                }
            }
        }
        // Process data binding
        if (config.data && config.data.type === 'static') {
            props.data = config.data.source;
        }
        else if (config.data && config.data.type === 'api') {
            // Handle API data loading
            const dataProvider = dataProviders[config.data.source];
            if (dataProvider) {
                // This would typically trigger loading state
                setLoading(true);
                dataProvider()
                    .then((data) => {
                    props.data = data;
                    setLoading(false);
                })
                    .catch((err) => {
                    setError(err.message);
                    setLoading(false);
                });
            }
        }
        return props;
    }, [config.props, config.events, config.data, handlers, dataProviders]);
    // Generate CSS classes
    const cssClasses = useMemo(() => {
        return clsx(config.className, getAnimationClasses(config.animation), config.theme?.background && `bg-${config.theme.background}`, config.theme?.radius && `rounded-${config.theme.radius}`, config.theme?.shadow && `shadow-${config.theme.shadow}`);
    }, [config.className, config.animation, config.theme]);
    // Render children
    const renderChildren = useCallback(() => {
        if (!config.children)
            return null;
        if (typeof config.children === 'string') {
            return config.children;
        }
        return config.children.map((child, index) => (_jsx(ComponentRenderer, { config: child, components: components, handlers: handlers, dataProviders: dataProviders, onError: onError }, child.id || index)));
    }, [config.children, components, handlers, dataProviders, onError]);
    if (!shouldRender)
        return null;
    if (error) {
        return (_jsx("div", { className: "p-4 border border-destructive bg-destructive/10 rounded-lg", children: _jsxs("p", { className: "text-destructive font-medium", children: ["Error: ", error] }) }));
    }
    if (!Component)
        return null;
    const content = (_jsx(_Fragment, { children: typeof Component === 'string' ? (React.createElement(Component, {
            ...processedProps,
            className: cssClasses,
            style: config.style
        }, renderChildren())) : (_jsx(Component, { ...processedProps, className: cssClasses, style: config.style, children: renderChildren() })) }));
    // Wrap with loading overlay if needed
    if (config.loading?.enabled) {
        return (_jsx(LoadingOverlay, { loading: loading, config: config.loading, children: content }));
    }
    return content;
};
/**
 * Main visualizer renderer component
 */
export const VisualizerRenderer = ({ config, components = {}, handlers = {}, dataProviders = {}, onError = console.error, onLoading }) => {
    const [validationError, setValidationError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Merge default components with custom components
    const mergedComponents = useMemo(() => ({
        ...DEFAULT_COMPONENTS,
        ...components
    }), [components]);
    // Validate configuration
    const validatedConfig = useMemo(() => {
        const validation = validateVisualizationConfig(config);
        if (!validation.isValid) {
            setValidationError(validation.errors.join(', '));
            return null;
        }
        setValidationError(null);
        return validation.sanitized;
    }, [config]);
    // Handle loading state changes
    const handleLoadingChange = useCallback((loading) => {
        setIsLoading(loading);
        onLoading?.(loading);
    }, [onLoading]);
    // Handle errors
    const handleError = useCallback((error) => {
        console.error('VisualizerRenderer error:', error);
        onError(error);
    }, [onError]);
    // Apply global styles
    const globalStyles = useMemo(() => {
        if (!validatedConfig?.styles)
            return null;
        return (_jsx("style", { dangerouslySetInnerHTML: { __html: validatedConfig.styles } }));
    }, [validatedConfig?.styles]);
    if (validationError) {
        return (_jsxs("div", { className: "p-6 border border-destructive bg-destructive/10 rounded-lg", children: [_jsx("h3", { className: "text-lg font-semibold text-destructive mb-2", children: "Configuration Error" }), _jsx("p", { className: "text-destructive", children: validationError })] }));
    }
    if (!validatedConfig) {
        return _jsx(LoadingIndicator, { config: { enabled: true, type: 'spinner' } });
    }
    return (_jsxs("div", { className: clsx('visualizer-root', validatedConfig.theme?.background && `bg-${validatedConfig.theme.background}`, getAnimationClasses(validatedConfig.animation)), children: [globalStyles, _jsx(Suspense, { fallback: _jsx(LoadingIndicator, { config: { enabled: true, type: 'skeleton', text: 'Loading components...' } }), children: validatedConfig.components.map((componentConfig, index) => (_jsx(ComponentRenderer, { config: componentConfig, components: mergedComponents, handlers: handlers, dataProviders: dataProviders, onError: handleError }, componentConfig.id || index))) }), isLoading && (_jsx("div", { className: "fixed bottom-4 right-4 z-50", children: _jsx(LoadingIndicator, { config: { enabled: true, type: 'spinner', size: 'sm' }, className: "bg-background border rounded-lg shadow-lg" }) }))] }));
};
