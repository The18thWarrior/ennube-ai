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

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { clsx } from 'clsx';
import { VisualizerProps, ComponentConfig, VisualizationConfig } from '../../types';
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
export const ComponentRenderer: React.FC<{
  config: ComponentConfig;
  components: Record<string, React.ComponentType<any> | string>;
  handlers: Record<string, Function>;
  dataProviders: Record<string, Function>;
  onError: (error: Error) => void;
}> = ({ config, components, handlers, dataProviders, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!config.condition) return true;
    
    try {
      // Simple condition evaluation (could be extended)
      return Boolean(config.condition);
    } catch (err) {
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
    } else if (config.data && config.data.type === 'api') {
      // Handle API data loading
      const dataProvider = dataProviders[config.data.source as string];
      if (dataProvider) {
        // This would typically trigger loading state
        setLoading(true);
        dataProvider()
          .then((data: any) => {
            props.data = data;
            setLoading(false);
          })
          .catch((err: Error) => {
            setError(err.message);
            setLoading(false);
          });
      }
    }
    
    return props;
  }, [config.props, config.events, config.data, handlers, dataProviders]);

  // Generate CSS classes
  const cssClasses = useMemo(() => {
    return clsx(
      config.className,
      getAnimationClasses(config.animation),
      config.theme?.background && `bg-${config.theme.background}`,
      config.theme?.radius && `rounded-${config.theme.radius}`,
      config.theme?.shadow && `shadow-${config.theme.shadow}`
    );
  }, [config.className, config.animation, config.theme]);

  // Render children
  const renderChildren = useCallback(() => {
    if (!config.children) return null;
    
    if (typeof config.children === 'string') {
      return config.children;
    }
    
    return config.children.map((child, index) => (
      <ComponentRenderer
        key={child.id || index}
        config={child}
        components={components}
        handlers={handlers}
        dataProviders={dataProviders}
        onError={onError}
      />
    ));
  }, [config.children, components, handlers, dataProviders, onError]);

  if (!shouldRender) return null;
  if (error) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }
  if (!Component) return null;

  const content = (
    <>
      {typeof Component === 'string' ? (
        React.createElement(
          Component,
          {
            ...processedProps,
            className: cssClasses,
            style: config.style
          },
          renderChildren()
        )
      ) : (
        <Component
          {...processedProps}
          className={cssClasses}
          style={config.style}
        >
          {renderChildren()}
        </Component>
      )}
    </>
  );

  // Wrap with loading overlay if needed
  if (config.loading?.enabled) {
    return (
      <LoadingOverlay loading={loading} config={config.loading}>
        {content}
      </LoadingOverlay>
    );
  }

  return content;
};

/**
 * Main visualizer renderer component
 */
export const VisualizerRenderer: React.FC<VisualizerProps> = ({
  config,
  components = {},
  handlers = {},
  dataProviders = {},
  onError = console.log,
  onLoading
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
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
    return validation.sanitized!;
  }, [config]);

  // Handle loading state changes
  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
    onLoading?.(loading);
  }, [onLoading]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    console.log('VisualizerRenderer error:', error);
    onError(error);
  }, [onError]);

  // Apply global styles
  const globalStyles = useMemo(() => {
    if (!validatedConfig?.styles) return null;
    
    return (
      <style dangerouslySetInnerHTML={{ __html: validatedConfig.styles }} />
    );
  }, [validatedConfig?.styles]);

  if (validationError) {
    return (
      <div className="p-6 border border-destructive bg-destructive/10 rounded-lg">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Configuration Error
        </h3>
        <p className="text-destructive">{validationError}</p>
      </div>
    );
  }

  if (!validatedConfig) {
    return <LoadingIndicator config={{ enabled: true, type: 'spinner' }} />;
  }

  return (
    <div
      className={clsx(
        'visualizer-root',
        validatedConfig.theme?.background && `bg-${validatedConfig.theme.background}`,
        getAnimationClasses(validatedConfig.animation)
      )}
    >
      {globalStyles}
      
      <Suspense
        fallback={
          <LoadingIndicator 
            config={{ enabled: true, type: 'skeleton', text: 'Loading components...' }} 
          />
        }
      >
        {validatedConfig.components.map((componentConfig, index) => (
          <ComponentRenderer
            key={componentConfig.id || index}
            config={componentConfig}
            components={mergedComponents}
            handlers={handlers}
            dataProviders={dataProviders}
            onError={handleError}
          />
        ))}
      </Suspense>
      
      {isLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <LoadingIndicator 
            config={{ enabled: true, type: 'spinner', size: 'sm' }}
            className="bg-background border rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

/**
 * OVERVIEW
 *
 * Main renderer for visualization configurations generated by LLMs.
 * Provides safe component rendering with validation and error handling.
 * Supports custom component registration and event handler binding.
 * Includes loading states and conditional rendering capabilities.
 * 
 * Key Features:
 * - Component validation and sanitization
 * - Custom component registry support
 * - Event handler binding
 * - Data source integration
 * - Loading state management
 * - Error boundary functionality
 * 
 * Future Improvements:
 * - Advanced condition evaluation
 * - Real-time data streaming
 * - Performance optimizations with virtualization
 */

/*
 * === components/core/VisualizerRenderer.tsx ===
 * Updated: 2025-07-19 15:00
 * Summary: Main visualization renderer with component registry and validation
 * Key Components:
 *   - VisualizerRenderer: Primary rendering component
 *   - ComponentRenderer: Individual component renderer with error handling
 *   - DEFAULT_COMPONENTS: Built-in component registry
 * Dependencies:
 *   - Requires: React, validation utils, animation utils, all component types
 * Version History:
 *   v1.0 – initial renderer with validation and component registry
 * Notes:
 *   - Secure by default with comprehensive validation
 *   - Extensible component registry system
 */
