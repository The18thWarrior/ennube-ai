import { ReactNode } from 'react';
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
/**
 * Context provider for global loading state
 */
export declare function LoadingStateProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access loading state context
 */
export declare function useLoadingStateContext(): LoadingStateContextValue;
/**
 * Hook for managing individual loading states
 */
export declare function useLoadingState(defaultId?: string): {
    isLoading: boolean;
    message: string | undefined;
    progress: number | undefined;
    loadingId: string;
    isContextAvailable: boolean;
    startLoading: (loadingMessage?: string) => void;
    updateLoading: (loadingProgress?: number, loadingMessage?: string) => void;
    stopLoading: () => void;
    withLoading: (operation: () => Promise<any>, loadingMessage?: string) => Promise<any>;
    withProgress: (operation: (updateProgress: (progress: number, message?: string) => void) => Promise<any>, initialMessage?: string) => Promise<any>;
};
/**
 * Hook for creating loading states for async operations
 */
export declare function useAsyncOperation(): {
    data: any;
    error: Error | null;
    execute: (operation: () => Promise<any>, options?: {
        loadingMessage?: string;
        onSuccess?: (data: any) => void;
        onError?: (error: Error) => void;
    }) => Promise<any>;
    executeWithProgress: (operation: (updateProgress: (progress: number, message?: string) => void) => Promise<any>, options?: {
        initialMessage?: string;
        onSuccess?: (data: any) => void;
        onError?: (error: Error) => void;
    }) => Promise<any>;
    reset: () => void;
};
//# sourceMappingURL=useLoadingState.d.ts.map