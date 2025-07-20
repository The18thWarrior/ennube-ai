// === components/feedback/AlertBanner.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Alert banner component for notifications
// Exports:
//   - AlertBanner: Main alert banner component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Dismissible alert banners with animations

'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface AlertBannerProps {
  /** Alert type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Alert message */
  message: string;
  /** Additional CSS classes */
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  className
}) => {
  const typeClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  };

  return (
    <div className={clsx('alert-banner p-4 border rounded-lg', typeClasses[type], className)}>
      {message}
    </div>
  );
};

/*
 * === components/feedback/AlertBanner.tsx ===
 * Updated: 2025-07-19 15:30
 * Summary: Alert banner component placeholder
 */
