// === hooks/useLoadingState.ts ===
// Created: 2025-07-19 16:00
// Purpose: React hook for managing loading states across components
// Exports:
//   - useLoadingState: Hook for loading state management
//   - LoadingStateProvider: Context provider for global loading state
// Interactions:
//   - Used by: Components with async operations
// Notes:
//   - Provides centralized loading state management

'use client';

import React, { useState, useCallback, useContext, createContext, useEffect, ReactNode } from 'react';

export interface LoadingState {
  /** Loading identifier */
  id: string;
  /** Loading message */
  message?: string;
  /** Loading progress (0-100) */
  progress?: number;
  /** Started timestamp */
  startedAt: number;
}

export interface LoadingStateContextValue {
  /** Active loading states */
  loadingStates: LoadingState[];
  /** Is any loading active */
  isLoading: boolean;
  /** Start loading */
  startLoading: (id: string, message?: string) => void;
  /** Update loading progress */
  updateLoading: (id: string, progress?: number, message?: string) => void;
  /** Stop loading */
  stopLoading: (id: string) => void;
  /** Clear all loading states */
  clearAllLoading: () => void;
}

const LoadingStateContext = createContext<LoadingStateContextValue | null>(null);

/**
 * Context provider for global loading state
 */
export function LoadingStateProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);

  const isLoading = loadingStates.length > 0;

  const startLoading = useCallback((id: string, message?: string) => {
    setLoadingStates(prev => {
      // Remove existing state with same id if it exists
      const filtered = prev.filter(state => state.id !== id);
      return [
        ...filtered,
        {
          id,
          message,
          startedAt: Date.now()
        }
      ];
    });
  }, []);

  const updateLoading = useCallback((id: string, progress?: number, message?: string) => {
    setLoadingStates(prev =>
      prev.map(state =>
        state.id === id
          ? { ...state, progress, message: message ?? state.message }
          : state
      )
    );
  }, []);

  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates([]);
  }, []);

  const contextValue: LoadingStateContextValue = {
    loadingStates,
    isLoading,
    startLoading,
    updateLoading,
    stopLoading,
    clearAllLoading
  };

  return (
    <LoadingStateContext.Provider value={contextValue}>
      {children}
    </LoadingStateContext.Provider>
  );
}

/**
 * Hook to access loading state context
 */
export function useLoadingStateContext() {
  const context = useContext(LoadingStateContext);
  if (!context) {
    throw new Error('useLoadingStateContext must be used within LoadingStateProvider');
  }
  return context;
}

/**
 * Hook for managing individual loading states
 */
export function useLoadingState(defaultId?: string) {
  const context = useContext(LoadingStateContext);
  
  // Local state if no context provider
  const [localLoading, setLocalLoading] = useState(false);
  const [localMessage, setLocalMessage] = useState<string>();
  const [localProgress, setLocalProgress] = useState<number>();

  const isContextAvailable = context !== null;

  // Generate unique ID if not provided
  const [loadingId] = useState(() => defaultId || `loading-${Math.random().toString(36).substr(2, 9)}`);

  // Get current loading state
  const currentState = context?.loadingStates.find(state => state.id === loadingId);
  const isLoading = context ? !!currentState : localLoading;
  const message = context ? currentState?.message : localMessage;
  const progress = context ? currentState?.progress : localProgress;

  // Start loading
  const startLoading = useCallback((loadingMessage?: string) => {
    if (context) {
      context.startLoading(loadingId, loadingMessage);
    } else {
      setLocalLoading(true);
      setLocalMessage(loadingMessage);
      setLocalProgress(undefined);
    }
  }, [context, loadingId]);

  // Update loading
  const updateLoading = useCallback((loadingProgress?: number, loadingMessage?: string) => {
    if (context) {
      context.updateLoading(loadingId, loadingProgress, loadingMessage);
    } else {
      setLocalProgress(loadingProgress);
      if (loadingMessage !== undefined) {
        setLocalMessage(loadingMessage);
      }
    }
  }, [context, loadingId]);

  // Stop loading
  const stopLoading = useCallback(() => {
    if (context) {
      context.stopLoading(loadingId);
    } else {
      setLocalLoading(false);
      setLocalMessage(undefined);
      setLocalProgress(undefined);
    }
  }, [context, loadingId]);

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      if (context) {
        context.stopLoading(loadingId);
      }
    };
  }, [context, loadingId]);

  // Async operation wrapper
  const withLoading = useCallback(async (
    operation: () => Promise<any>,
    loadingMessage?: string
  ): Promise<any> => {
    try {
      startLoading(loadingMessage);
      const result = await operation();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Progress tracking wrapper
  const withProgress = useCallback(async (
    operation: (updateProgress: (progress: number, message?: string) => void) => Promise<any>,
    initialMessage?: string
  ): Promise<any> => {
    try {
      startLoading(initialMessage);
      
      const updateProgressHandler = (progress: number, progressMessage?: string) => {
        updateLoading(progress, progressMessage);
      };
      
      const result = await operation(updateProgressHandler);
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, updateLoading, stopLoading]);

  return {
    isLoading,
    message,
    progress,
    loadingId,
    isContextAvailable,
    startLoading,
    updateLoading,
    stopLoading,
    withLoading,
    withProgress
  };
}

/**
 * Hook for creating loading states for async operations
 */
export function useAsyncOperation() {
  const { withLoading, withProgress } = useLoadingState();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<any>,
    options?: {
      loadingMessage?: string;
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      setError(null);
      const result = await withLoading(operation, options?.loadingMessage);
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      options?.onError?.(error);
      throw error;
    }
  }, [withLoading]);

  const executeWithProgress = useCallback(async (
    operation: (updateProgress: (progress: number, message?: string) => void) => Promise<any>,
    options?: {
      initialMessage?: string;
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
    }
  ) => {
    try {
      setError(null);
      const result = await withProgress(operation, options?.initialMessage);
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      options?.onError?.(error);
      throw error;
    }
  }, [withProgress]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    error,
    execute,
    executeWithProgress,
    reset
  };
}

/*
 * === hooks/useLoadingState.ts ===
 * Updated: 2025-07-19 16:00
 * Summary: Comprehensive loading state management with context
 * Key Components:
 *   - useLoadingState(): Individual loading state management
 *   - LoadingStateProvider: Global loading state context
 *   - useAsyncOperation(): Wrapper for async operations with loading
 * Dependencies:
 *   - Requires: React hooks and context
 * Version History:
 *   v1.0 – initial loading state management with context and progress tracking
 * Notes:
 *   - Supports both local and global loading states
 *   - Includes progress tracking and async operation wrappers
 */
