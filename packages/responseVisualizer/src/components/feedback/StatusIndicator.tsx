// === components/feedback/StatusIndicator.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Status indicator component for showing states
// Exports:
//   - StatusIndicator: Main status indicator component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Animated status indicators with icons

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface StatusIndicatorProps {
  /** Status type */
  status: 'success' | 'error' | 'warning' | 'info';
  /** Status text */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  className
}) => {
  const statusClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <div className={clsx('status-indicator px-3 py-2 rounded border', statusClasses[status], className)}>
      {text || status}
    </div>
  );
};

/*
 * === components/feedback/StatusIndicator.tsx ===
 * Updated: 2025-07-19 15:30
 * Summary: Status indicator component placeholder
 */
