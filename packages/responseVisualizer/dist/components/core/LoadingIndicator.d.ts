import React from 'react';
import { LoadingConfig } from '../../types';
export interface LoadingIndicatorProps {
    /** Loading configuration */
    config?: LoadingConfig;
    /** Override loading text */
    text?: string;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Spinner loading indicator
 */
export declare const LoadingSpinner: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}>;
/**
 * Skeleton loading indicator
 */
export declare const LoadingSkeleton: React.FC<{
    width?: string | number;
    height?: string | number;
    className?: string;
    lines?: number;
}>;
/**
 * Dots loading indicator
 */
export declare const LoadingDots: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}>;
/**
 * Pulse loading indicator
 */
export declare const LoadingPulse: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}>;
/**
 * Main loading indicator component
 */
export declare const LoadingIndicator: React.FC<LoadingIndicatorProps>;
/**
 * Loading overlay component for wrapping content
 */
export declare const LoadingOverlay: React.FC<{
    loading: boolean;
    config?: LoadingConfig;
    children: React.ReactNode;
    className?: string;
}>;
/**
 * OVERVIEW
 *
 * Loading indicator components with multiple variants and sizes.
 * Supports spinner, skeleton, dots, and pulse loading animations.
 * Provides overlay functionality for loading states over content.
 * All components are accessible with proper ARIA labels.
 *
 * Future Improvements:
 * - Add custom loading animations
 * - Support for loading progress indicators
 * - Integration with Suspense boundaries
 */
//# sourceMappingURL=LoadingIndicator.d.ts.map