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

import React from 'react';
import { clsx } from 'clsx';
import { LoadingConfig } from '../../types';
import { getLoadingAnimationClasses } from '../../utils/animation-utils';

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
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div
      className={clsx(
        'border-2 border-current border-t-transparent rounded-full',
        sizeClasses[size],
        'animate-spin',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Skeleton loading indicator
 */
export const LoadingSkeleton: React.FC<{ 
  width?: string | number; 
  height?: string | number; 
  className?: string;
  lines?: number;
}> = ({ 
  width = '100%', 
  height = '1rem', 
  className,
  lines = 1
}) => {
  const skeletonLines = Array.from({ length: lines }, (_, i) => (
    <div
      key={i}
      className={clsx(
        'bg-muted rounded animate-pulse',
        i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full',
        className
      )}
      style={{ 
        width: lines === 1 ? width : undefined, 
        height,
        marginBottom: lines > 1 && i < lines - 1 ? '0.5rem' : undefined
      }}
    />
  ));

  return lines === 1 ? skeletonLines[0] : <div className="space-y-2">{skeletonLines}</div>;
};

/**
 * Dots loading indicator
 */
export const LoadingDots: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const dotClass = clsx(
    'bg-current rounded-full',
    sizeClasses[size]
  );

  return (
    <div className={clsx('flex space-x-1', className)} role="status" aria-label="Loading">
      <div className={clsx(dotClass, 'animate-bounce')} style={{ animationDelay: '0ms' }} />
      <div className={clsx(dotClass, 'animate-bounce')} style={{ animationDelay: '150ms' }} />
      <div className={clsx(dotClass, 'animate-bounce')} style={{ animationDelay: '300ms' }} />
    </div>
  );
};

/**
 * Pulse loading indicator
 */
export const LoadingPulse: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div
      className={clsx(
        'bg-current rounded-full opacity-75 animate-pulse',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Main loading indicator component
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  config = { enabled: true, type: 'spinner', size: 'md' }, 
  text,
  className 
}) => {
  if (!config.enabled) {
    return null;
  }

  const loadingText = text || config.text || 'Loading...';
  const loadingType = config.type || 'spinner';
  const size = config.size || 'md';

  const renderIndicator = () => {
    switch (loadingType) {
      case 'spinner':
        return <LoadingSpinner size={size} />;
      case 'skeleton':
        return <LoadingSkeleton />;
      case 'dots':
        return <LoadingDots size={size} />;
      case 'pulse':
        return <LoadingPulse size={size} />;
      default:
        return <LoadingSpinner size={size} />;
    }
  };

  return (
    <div 
      className={clsx(
        'flex flex-col items-center justify-center space-y-2 p-4',
        'text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {renderIndicator()}
      {loadingText && (
        <span className="text-sm font-medium">{loadingText}</span>
      )}
    </div>
  );
};

/**
 * Loading overlay component for wrapping content
 */
export const LoadingOverlay: React.FC<{
  loading: boolean;
  config?: LoadingConfig;
  children: React.ReactNode;
  className?: string;
}> = ({ loading, config, children, className }) => {
  return (
    <div className={clsx('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingIndicator config={config} />
        </div>
      )}
    </div>
  );
};

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

/*
 * === components/core/LoadingIndicator.tsx ===
 * Updated: 2025-07-19 14:50
 * Summary: Comprehensive loading indicator components
 * Key Components:
 *   - LoadingIndicator: Main component with config-based rendering
 *   - LoadingSpinner/Skeleton/Dots/Pulse: Specific indicator variants
 *   - LoadingOverlay: Overlay wrapper for loading states
 * Dependencies:
 *   - Requires: clsx, React, animation utilities
 * Version History:
 *   v1.0 – initial loading indicators with multiple variants
 * Notes:
 *   - Fully accessible with ARIA labels
 *   - Responsive sizing and Tailwind styling
 */
