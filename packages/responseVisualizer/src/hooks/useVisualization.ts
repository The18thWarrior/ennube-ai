// === hooks/useVisualization.ts ===
// Created: 2025-07-19 15:55
// Purpose: React hook for managing visualization state
// Exports:
//   - useVisualization: Main hook for visualization management
// Interactions:
//   - Used by: React components consuming the package
// Notes:
//   - Manages loading, error states, and data fetching

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VisualizationConfig, ComponentConfig } from '../types';
import { validateVisualizationConfig } from '../utils/validation-utils';

export interface UseVisualizationOptions {
  /** Initial configuration */
  initialConfig?: VisualizationConfig;
  /** Auto-validate configuration changes */
  autoValidate?: boolean;
  /** Debounce delay for validation (ms) */
  validationDelay?: number;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Loading state callback */
  onLoadingChange?: (loading: boolean) => void;
}

export interface UseVisualizationReturn {
  /** Current configuration */
  config: VisualizationConfig | null;
  /** Validation errors */
  errors: string[];
  /** Loading state */
  loading: boolean;
  /** Is configuration valid */
  isValid: boolean;
  /** Set new configuration */
  setConfig: (config: VisualizationConfig) => void;
  /** Update configuration */
  updateConfig: (updater: (config: VisualizationConfig) => VisualizationConfig) => void;
  /** Add component */
  addComponent: (component: ComponentConfig, index?: number) => void;
  /** Remove component */
  removeComponent: (index: number) => void;
  /** Update component */
  updateComponent: (index: number, component: ComponentConfig) => void;
  /** Clear configuration */
  clear: () => void;
  /** Reload configuration */
  reload: () => void;
  /** Export configuration */
  exportConfig: () => string;
  /** Import configuration */
  importConfig: (configString: string) => boolean;
}

/**
 * Hook for managing visualization configuration
 */
export function useVisualization(options: UseVisualizationOptions = {}): UseVisualizationReturn {
  const {
    initialConfig,
    autoValidate = true,
    validationDelay = 300,
    onError,
    onLoadingChange
  } = options;

  const [config, setConfigState] = useState<VisualizationConfig | null>(
    initialConfig || null
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Memoized validation result
  const validationResult = useMemo(() => {
    if (!config) return { isValid: false, errors: ['No configuration provided'] };
    return validateVisualizationConfig(config);
  }, [config]);

  const isValid = validationResult.isValid;

  // Update errors when validation changes
  useEffect(() => {
    setErrors(validationResult.errors);
  }, [validationResult.errors]);

  // Handle loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Debounced validation
  useEffect(() => {
    if (!autoValidate || !config) return;

    const timer = setTimeout(() => {
      try {
        const validation = validateVisualizationConfig(config);
        if (!validation.isValid) {
          setErrors(validation.errors);
          onError?.(new Error(`Validation failed: ${validation.errors.join(', ')}`));
        } else {
          setErrors([]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation error';
        setErrors([errorMessage]);
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    }, validationDelay);

    return () => clearTimeout(timer);
  }, [config, autoValidate, validationDelay, onError]);

  // Set configuration with validation
  const setConfig = useCallback((newConfig: VisualizationConfig) => {
    setLoading(true);
    
    try {
      const validation = validateVisualizationConfig(newConfig);
      
      if (validation.isValid && validation.sanitized) {
        setConfigState(validation.sanitized);
        setErrors([]);
      } else {
        setErrors(validation.errors);
        onError?.(new Error(`Invalid configuration: ${validation.errors.join(', ')}`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Configuration error';
      setErrors([errorMessage]);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Update configuration with function
  const updateConfig = useCallback((updater: (config: VisualizationConfig) => VisualizationConfig) => {
    if (!config) return;
    
    try {
      const updatedConfig = updater(config);
      setConfig(updatedConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update error';
      setErrors([errorMessage]);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [config, setConfig, onError]);

  // Add component
  const addComponent = useCallback((component: ComponentConfig, index?: number) => {
    if (!config) return;
    
    updateConfig((prevConfig) => {
      const newComponents = [...prevConfig.components];
      
      if (typeof index === 'number' && index >= 0 && index <= newComponents.length) {
        newComponents.splice(index, 0, component);
      } else {
        newComponents.push(component);
      }
      
      return {
        ...prevConfig,
        components: newComponents
      };
    });
  }, [config, updateConfig]);

  // Remove component
  const removeComponent = useCallback((index: number) => {
    if (!config) return;
    
    updateConfig((prevConfig) => {
      const newComponents = [...prevConfig.components];
      newComponents.splice(index, 1);
      
      return {
        ...prevConfig,
        components: newComponents
      };
    });
  }, [config, updateConfig]);

  // Update component
  const updateComponent = useCallback((index: number, component: ComponentConfig) => {
    if (!config) return;
    
    updateConfig((prevConfig) => {
      const newComponents = [...prevConfig.components];
      newComponents[index] = component;
      
      return {
        ...prevConfig,
        components: newComponents
      };
    });
  }, [config, updateConfig]);

  // Clear configuration
  const clear = useCallback(() => {
    setConfigState(null);
    setErrors([]);
  }, []);

  // Reload configuration
  const reload = useCallback(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig, setConfig]);

  // Export configuration as JSON string
  const exportConfig = useCallback(() => {
    if (!config) return '';
    
    try {
      return JSON.stringify(config, null, 2);
    } catch (error) {
      onError?.(new Error('Failed to export configuration'));
      return '';
    }
  }, [config, onError]);

  // Import configuration from JSON string
  const importConfig = useCallback((configString: string): boolean => {
    try {
      const parsed = JSON.parse(configString);
      setConfig(parsed);
      return true;
    } catch (error) {
      onError?.(new Error('Failed to import configuration: Invalid JSON'));
      return false;
    }
  }, [setConfig, onError]);

  return {
    config,
    errors,
    loading,
    isValid,
    setConfig,
    updateConfig,
    addComponent,
    removeComponent,
    updateComponent,
    clear,
    reload,
    exportConfig,
    importConfig
  };
}

/*
 * === hooks/useVisualization.ts ===
 * Updated: 2025-07-19 15:55
 * Summary: React hook for visualization state management
 * Key Components:
 *   - useVisualization(): Main hook with CRUD operations
 *   - Validation integration with debouncing
 *   - Import/export functionality
 * Dependencies:
 *   - Requires: React hooks, validation utilities, types
 * Version History:
 *   v1.0 – initial visualization hook with comprehensive state management
 * Notes:
 *   - Provides complete CRUD operations for configurations
 *   - Includes debounced validation and error handling
 */
