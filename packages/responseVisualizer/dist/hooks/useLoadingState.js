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
import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback, useContext, createContext, useEffect } from 'react';
const LoadingStateContext = createContext(null);
/**
 * Context provider for global loading state
 */
export function LoadingStateProvider({ children }) {
    const [loadingStates, setLoadingStates] = useState([]);
    const isLoading = loadingStates.length > 0;
    const startLoading = useCallback((id, message) => {
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
    const updateLoading = useCallback((id, progress, message) => {
        setLoadingStates(prev => prev.map(state => state.id === id
            ? { ...state, progress, message: message ?? state.message }
            : state));
    }, []);
    const stopLoading = useCallback((id) => {
        setLoadingStates(prev => prev.filter(state => state.id !== id));
    }, []);
    const clearAllLoading = useCallback(() => {
        setLoadingStates([]);
    }, []);
    const contextValue = {
        loadingStates,
        isLoading,
        startLoading,
        updateLoading,
        stopLoading,
        clearAllLoading
    };
    return (_jsx(LoadingStateContext.Provider, { value: contextValue, children: children }));
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
export function useLoadingState(defaultId) {
    const context = useContext(LoadingStateContext);
    // Local state if no context provider
    const [localLoading, setLocalLoading] = useState(false);
    const [localMessage, setLocalMessage] = useState();
    const [localProgress, setLocalProgress] = useState();
    const isContextAvailable = context !== null;
    // Generate unique ID if not provided
    const [loadingId] = useState(() => defaultId || `loading-${Math.random().toString(36).substr(2, 9)}`);
    // Get current loading state
    const currentState = context?.loadingStates.find(state => state.id === loadingId);
    const isLoading = context ? !!currentState : localLoading;
    const message = context ? currentState?.message : localMessage;
    const progress = context ? currentState?.progress : localProgress;
    // Start loading
    const startLoading = useCallback((loadingMessage) => {
        if (context) {
            context.startLoading(loadingId, loadingMessage);
        }
        else {
            setLocalLoading(true);
            setLocalMessage(loadingMessage);
            setLocalProgress(undefined);
        }
    }, [context, loadingId]);
    // Update loading
    const updateLoading = useCallback((loadingProgress, loadingMessage) => {
        if (context) {
            context.updateLoading(loadingId, loadingProgress, loadingMessage);
        }
        else {
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
        }
        else {
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
    const withLoading = useCallback(async (operation, loadingMessage) => {
        try {
            startLoading(loadingMessage);
            const result = await operation();
            return result;
        }
        finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);
    // Progress tracking wrapper
    const withProgress = useCallback(async (operation, initialMessage) => {
        try {
            startLoading(initialMessage);
            const updateProgressHandler = (progress, progressMessage) => {
                updateLoading(progress, progressMessage);
            };
            const result = await operation(updateProgressHandler);
            return result;
        }
        finally {
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
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const execute = useCallback(async (operation, options) => {
        try {
            setError(null);
            const result = await withLoading(operation, options?.loadingMessage);
            setData(result);
            options?.onSuccess?.(result);
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Operation failed');
            setError(error);
            options?.onError?.(error);
            throw error;
        }
    }, [withLoading]);
    const executeWithProgress = useCallback(async (operation, options) => {
        try {
            setError(null);
            const result = await withProgress(operation, options?.initialMessage);
            setData(result);
            options?.onSuccess?.(result);
            return result;
        }
        catch (err) {
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
