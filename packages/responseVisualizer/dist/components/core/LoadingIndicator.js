// === components/core/LoadingIndicator.tsx ===
// Created: 2025-07-19 14:50
// Purpose: Reusable loading indicator component with multiple variants
// Exports:
//   - LoadingIndicator: Main loading component
//   - LoadingSpinner: Spinner variant
//   - LoadingSkeleton: Skeleton variant
// Interactions:
//   - Used by: All components with loading states
// Notes:
//   - Supports different loading types and sizes
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
/**
 * Spinner loading indicator
 */
export const LoadingSpinner = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    return (_jsx("div", { className: clsx('border-2 border-current border-t-transparent rounded-full', sizeClasses[size], 'animate-spin', className), role: "status", "aria-label": "Loading" }));
};
/**
 * Skeleton loading indicator
 */
export const LoadingSkeleton = ({ width = '100%', height = '1rem', className, lines = 1 }) => {
    const skeletonLines = Array.from({ length: lines }, (_, i) => (_jsx("div", { className: clsx('bg-muted rounded animate-pulse', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full', className), style: {
            width: lines === 1 ? width : undefined,
            height,
            marginBottom: lines > 1 && i < lines - 1 ? '0.5rem' : undefined
        } }, i)));
    return lines === 1 ? skeletonLines[0] : _jsx("div", { className: "space-y-2", children: skeletonLines });
};
/**
 * Dots loading indicator
 */
export const LoadingDots = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-1 h-1',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };
    const dotClass = clsx('bg-current rounded-full', sizeClasses[size]);
    return (_jsxs("div", { className: clsx('flex space-x-1', className), role: "status", "aria-label": "Loading", children: [_jsx("div", { className: clsx(dotClass, 'animate-bounce'), style: { animationDelay: '0ms' } }), _jsx("div", { className: clsx(dotClass, 'animate-bounce'), style: { animationDelay: '150ms' } }), _jsx("div", { className: clsx(dotClass, 'animate-bounce'), style: { animationDelay: '300ms' } })] }));
};
/**
 * Pulse loading indicator
 */
export const LoadingPulse = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };
    return (_jsx("div", { className: clsx('bg-current rounded-full opacity-75 animate-pulse', sizeClasses[size], className), role: "status", "aria-label": "Loading" }));
};
/**
 * Main loading indicator component
 */
export const LoadingIndicator = ({ config = { enabled: true, type: 'spinner', size: 'md' }, text, className }) => {
    if (!config.enabled) {
        return null;
    }
    const loadingText = text || config.text || 'Loading...';
    const loadingType = config.type || 'spinner';
    const size = config.size || 'md';
    const renderIndicator = () => {
        switch (loadingType) {
            case 'spinner':
                return _jsx(LoadingSpinner, { size: size });
            case 'skeleton':
                return _jsx(LoadingSkeleton, {});
            case 'dots':
                return _jsx(LoadingDots, { size: size });
            case 'pulse':
                return _jsx(LoadingPulse, { size: size });
            default:
                return _jsx(LoadingSpinner, { size: size });
        }
    };
    return (_jsxs("div", { className: clsx('flex flex-col items-center justify-center space-y-2 p-4', 'text-muted-foreground', className), role: "status", "aria-live": "polite", children: [renderIndicator(), loadingText && (_jsx("span", { className: "text-sm font-medium", children: loadingText }))] }));
};
/**
 * Loading overlay component for wrapping content
 */
export const LoadingOverlay = ({ loading, config, children, className }) => {
    return (_jsxs("div", { className: clsx('relative', className), children: [children, loading && (_jsx("div", { className: "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10", children: _jsx(LoadingIndicator, { config: config }) }))] }));
};
